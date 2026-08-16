package finance

import (
	"automated-lifecycle/backend/internal/models"
	"database/sql"
	"log"
	"strings"
	"time"
)

type TrendItem struct {
	Month      string  `json:"month"`
	AWS        float64 `json:"aws"`
	Azure      float64 `json:"azure"`
	GCP        float64 `json:"gcp"`
	Salesforce float64 `json:"salesforce"`
	IBM        float64 `json:"ibm"`
	Oracle     float64 `json:"oracle"`
	Alibaba    float64 `json:"alibaba"`
}

type ScheduledReport struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Frequency  string `json:"frequency"`
	Recipients string `json:"recipients"`
	Status     string `json:"status"`
}

// parseCloudProvider returns a simplified provider identifier for trend grouping
func parseCloudProvider(provider string) string {
	prov := strings.ToLower(strings.TrimSpace(provider))
	if strings.Contains(prov, "aws") {
		return "aws"
	}
	if strings.Contains(prov, "azure") {
		return "azure"
	}
	if strings.Contains(prov, "gcp") || strings.Contains(prov, "google") {
		return "gcp"
	}
	if strings.Contains(prov, "salesforce") {
		return "salesforce"
	}
	if strings.Contains(prov, "ibm") {
		return "ibm"
	}
	if strings.Contains(prov, "oracle") {
		return "oracle"
	}
	if strings.Contains(prov, "alibaba") {
		return "alibaba"
	}
	return ""
}

// GetCostTrendData queries DB and groups costs by month and cloud provider
func GetCostTrendData(db *sql.DB) ([]TrendItem, error) {
	query := `
		SELECT 
			TO_CHAR(pc.record_month, 'Mon') as month_name,
			pc.record_month,
			p.provider,
			SUM(pc.spend) as total_spend
		FROM project_costs pc
		JOIN projects p ON pc.project_id = p.id
		GROUP BY pc.record_month, p.provider, TO_CHAR(pc.record_month, 'Mon')
		ORDER BY pc.record_month ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("[Trend Error] Query failed: %v\n", err)
		return nil, err
	}
	defer rows.Close()

	type dbRow struct {
		monthName   string
		recordMonth time.Time
		provider    string
		spend       float64
	}

	var dbRows []dbRow
	for rows.Next() {
		var r dbRow
		err := rows.Scan(&r.monthName, &r.recordMonth, &r.provider, &r.spend)
		if err != nil {
			log.Printf("[Trend Error] Row scan failed: %v\n", err)
			return nil, err
		}
		dbRows = append(dbRows, r)
	}

	var items []TrendItem
	itemMap := make(map[string]*TrendItem)
	var monthKeys []string

	for _, r := range dbRows {
		mName := strings.TrimSpace(r.monthName)
		if len(mName) > 3 {
			mName = mName[:3]
		}
		
		key := r.recordMonth.Format("2006-01")
		item, exists := itemMap[key]
		if !exists {
			item = &TrendItem{Month: mName}
			itemMap[key] = item
			monthKeys = append(monthKeys, key)
		}

		provKey := parseCloudProvider(r.provider)
		switch provKey {
		case "aws":
			item.AWS += r.spend
		case "azure":
			item.Azure += r.spend
		case "gcp":
			item.GCP += r.spend
		case "salesforce":
			item.Salesforce += r.spend
		case "ibm":
			item.IBM += r.spend
		case "oracle":
			item.Oracle += r.spend
		case "alibaba":
			item.Alibaba += r.spend
		}
	}

	for _, key := range monthKeys {
		items = append(items, *itemMap[key])
	}

	if items == nil {
		items = []TrendItem{}
	}

	return items, nil
}

// GetScheduledReports fetches list of scheduled reports
func GetScheduledReports(db *sql.DB) ([]ScheduledReport, error) {
	rows, err := db.Query("SELECT id, name, frequency, recipients, status FROM scheduled_reports ORDER BY id ASC")
	if err != nil {
		log.Printf("[Scheduled Reports] Get query failed: %v\n", err)
		return nil, err
	}
	defer rows.Close()

	var list []ScheduledReport
	for rows.Next() {
		var r ScheduledReport
		if err := rows.Scan(&r.ID, &r.Name, &r.Frequency, &r.Recipients, &r.Status); err == nil {
			list = append(list, r)
		} else {
			log.Printf("[Scheduled Reports] Scan failed: %v\n", err)
		}
	}

	if list == nil {
		list = []ScheduledReport{}
	}
	return list, nil
}

// UpdateScheduledReportStatus toggles status of a scheduled report
func UpdateScheduledReportStatus(db *sql.DB, id string, status string) error {
	_, err := db.Exec("UPDATE scheduled_reports SET status = $1 WHERE id = $2", status, id)
	if err != nil {
		log.Printf("[Scheduled Reports] Update failed for id %s: %v\n", id, err)
		return err
	}
	return nil
}

// fetchInvoiceLineItemsMap pre-fetches all line items mapped by invoice ID
func fetchInvoiceLineItemsMap(db *sql.DB) (map[string][]models.InvoiceLineItem, error) {
	lineItemsMap := make(map[string][]models.InvoiceLineItem)
	liRows, err := db.Query(`
		SELECT id, invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id 
		FROM cloud_invoice_line_items 
		ORDER BY id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer liRows.Close()

	for liRows.Next() {
		var li models.InvoiceLineItem
		if err := liRows.Scan(&li.ID, &li.InvoiceID, &li.ServiceName, &li.Category, &li.SubTotal, &li.TaxAmount, &li.GrandTotal, &li.ProjectID); err == nil {
			lineItemsMap[li.InvoiceID] = append(lineItemsMap[li.InvoiceID], li)
		} else {
			log.Printf("[Invoices DB Error] Scan line item failed: %v\n", err)
		}
	}
	return lineItemsMap, nil
}

// fetchInvoiceAllocsMap pre-fetches all allocations mapped by invoice ID
func fetchInvoiceAllocsMap(db *sql.DB) (map[string][]models.InvoiceDepartmentAllocation, error) {
	allocsMap := make(map[string][]models.InvoiceDepartmentAllocation)
	alRows, err := db.Query(`
		SELECT a.id, a.invoice_id, a.department_id, d.name as department_name, a.ratio, a.allocated_amount 
		FROM invoice_department_allocations a
		JOIN departments d ON a.department_id = d.id
		ORDER BY a.id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer alRows.Close()

	for alRows.Next() {
		var al models.InvoiceDepartmentAllocation
		if err := alRows.Scan(&al.ID, &al.InvoiceID, &al.DepartmentID, &al.DepartmentName, &al.Ratio, &al.AllocatedAmount); err == nil {
			allocsMap[al.InvoiceID] = append(allocsMap[al.InvoiceID], al)
		} else {
			log.Printf("[Invoices DB Error] Scan allocation failed: %v\n", err)
		}
	}
	return allocsMap, nil
}

// GetInvoicesFromDB fetches all invoices with structured financials, line items, and allocations from DB
func GetInvoicesFromDB(db *sql.DB) ([]models.DBInvoiceItem, error) {
	query := `
		SELECT id, provider, billing_period, due_date, amount, status, currency, subtotal, tax_rate, tax_amount, grand_total 
		FROM cloud_invoices 
		ORDER BY id ASC
	`
	rows, err := db.Query(query)
	if err != nil {
		log.Printf("[Invoices DB] Get query failed: %v\n", err)
		return nil, err
	}
	defer rows.Close()

	lineItemsMap, err := fetchInvoiceLineItemsMap(db)
	if err != nil {
		log.Printf("[Invoices DB Error] Bulk query line items failed: %v\n", err)
	}

	allocsMap, err := fetchInvoiceAllocsMap(db)
	if err != nil {
		log.Printf("[Invoices DB Error] Bulk query allocations failed: %v\n", err)
	}

	var list []models.DBInvoiceItem
	for rows.Next() {
		var item models.DBInvoiceItem
		err := rows.Scan(
			&item.ID,
			&item.Provider,
			&item.BillingPeriod,
			&item.DueDate,
			&item.Amount,
			&item.Status,
			&item.Currency,
			&item.Financials.SubTotal,
			&item.Financials.TaxRate,
			&item.Financials.TaxAmount,
			&item.Financials.GrandTotal,
		)
		if err != nil {
			log.Printf("[Invoices DB] Row scan failed: %v\n", err)
			continue
		}

		item.LineItems = lineItemsMap[item.ID]
		if item.LineItems == nil {
			item.LineItems = []models.InvoiceLineItem{}
		}

		item.Allocations = allocsMap[item.ID]
		if item.Allocations == nil {
			item.Allocations = []models.InvoiceDepartmentAllocation{}
		}

		list = append(list, item)
	}

	if list == nil {
		list = []models.DBInvoiceItem{}
	}
	return list, nil
}
