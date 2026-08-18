package finance

import (
	"database/sql"
	"log"
)

const (
	inv2026001        = "INV-2026-001"
	inv2026002        = "INV-2026-002"
	inv2026003        = "INV-2026-003"
	inv2026004        = "INV-2026-004"
	inv2026005        = "INV-2026-005"
	inv2026006        = "INV-2026-006"
	inv2026007        = "INV-2026-007"
	onDemandInstances = "On-Demand Instances"
	prjAWSProject     = "PRJ-001"
	prjAzureProject   = "PRJ-002"
	prjGCPProject     = "PRJ-004"

	amazonEC2T3Micro = "Amazon EC2 (t3.micro)"
	storageByteHrs   = "Storage-ByteHrs"
	computeOnDemand  = "Compute-OnDemand"

	prjInfra01   = "PRJ-INFRA-01"
	prjProd01    = "PRJ-PROD-01"
	prjData01    = "PRJ-DATA-01"
	prjTrust01   = "PRJ-TRUST-01"
	prjFinance01 = "PRJ-FINANCE-01"
	prjExec01    = "PRJ-EXEC-01"
	prjFinOps01  = "PRJ-FINOPS-01"
)

// SeedTrendData seeds the database tables with default historical UAT/Demo data if they do not exist
func SeedTrendData(db *sql.DB) {
	// 0. Initialize all database schemas first to prevent foreign key errors
	InitCoreDatabaseSchema(db)

	// 1. Check/Create scheduled_reports table and seed it
	InitScheduledReports(db)

	// 2. Seed dynamic daily dashboard stats for UAT/Demo
	SeedDynamicDashboardStats(db)

	// 3. Seed invoices table
	InitInvoicesTable(db)

	// 4. Seed mock cloud resources for service cost breakdown modal
	SeedMockCloudResources(db)

	// 5. Seed project costs for all 7 departments so Pie Chart shows complete 7-department breakdown
	SeedAllDepartmentsProjectCosts(db)
}

// InitCoreDatabaseSchema creates all required PostgreSQL database tables in correct dependency order
func InitCoreDatabaseSchema(db *sql.DB) {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS departments (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL UNIQUE,
			code VARCHAR(50),
			description TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS projects (
			id VARCHAR(50) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			department_id INTEGER REFERENCES departments(id),
			owner VARCHAR(255),
			provider VARCHAR(100),
			allocation_model VARCHAR(50) DEFAULT 'Fixed',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS cloud_resources (
			id VARCHAR(100) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			type VARCHAR(100) NOT NULL,
			provider VARCHAR(50) NOT NULL,
			project_tag VARCHAR(50),
			cost_per_day NUMERIC(15, 2) NOT NULL DEFAULT 0,
			status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
			idle_days INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS daily_cloud_costs (
			id SERIAL PRIMARY KEY,
			record_date DATE NOT NULL UNIQUE,
			total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS project_costs (
			id SERIAL PRIMARY KEY,
			project_id VARCHAR(50) REFERENCES projects(id),
			record_month DATE NOT NULL,
			spend NUMERIC(15, 2) NOT NULL DEFAULT 0,
			mom_change NUMERIC(5, 2) DEFAULT 0,
			is_tagged BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT unique_prj_month UNIQUE(project_id, record_month)
		);`,
		`CREATE TABLE IF NOT EXISTS allocation_usage (
			id SERIAL PRIMARY KEY,
			record_date DATE NOT NULL UNIQUE,
			used_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS sweep_tracking (
			id SERIAL PRIMARY KEY,
			instance_id VARCHAR(100),
			instance_name VARCHAR(255),
			owner_email VARCHAR(255),
			status VARCHAR(50),
			deadline_at TIMESTAMP,
			resource_id VARCHAR(100),
			action_taken VARCHAR(50),
			saved_cost_per_day NUMERIC(15, 2) NOT NULL DEFAULT 0,
			swept_date DATE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			log.Printf("[Schema Init Warning] Error running query: %v\n", err)
		}
	}

	// Schema Migrations for sweep_tracking
	migrationQueries := []string{
		`ALTER TABLE sweep_tracking ADD COLUMN IF NOT EXISTS instance_id VARCHAR(100);`,
		`ALTER TABLE sweep_tracking ADD COLUMN IF NOT EXISTS instance_name VARCHAR(255);`,
		`ALTER TABLE sweep_tracking ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);`,
		`ALTER TABLE sweep_tracking ADD COLUMN IF NOT EXISTS status VARCHAR(50);`,
		`ALTER TABLE sweep_tracking ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP;`,
		`DELETE FROM sweep_tracking a USING sweep_tracking b WHERE a.id < b.id AND a.instance_id IS NOT NULL AND a.instance_id = b.instance_id;`,
		`CREATE UNIQUE INDEX IF NOT EXISTS sweep_tracking_instance_id_idx ON sweep_tracking (instance_id);`,
		`DELETE FROM sweep_tracking WHERE instance_id IN ('i-081f749ca416173d4', 'i-0e0d9622c6def8658');`,
		`DELETE FROM teams a USING teams b WHERE a.id > b.id AND LOWER(a.team_name) = LOWER(b.team_name);`,
	}
	for _, mq := range migrationQueries {
		if _, err := db.Exec(mq); err != nil {
			log.Printf("[Migration Warning] %v\n", err)
		}
	}

	// Seed default 7 departments
	depts := []string{
		"Core Infrastructure",
		"Product Engineering",
		"Data Science & Analytics",
		"Trust & Safety",
		"Finance",
		"Executive / C-Level",
		"FinOps & Cloud Governance",
	}

	for _, d := range depts {
		_, _ = db.Exec(`INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, d)
	}

	log.Println("[Schema Init] Core database tables and 7 default departments initialized successfully.")
}

// InitScheduledReports creates and seeds scheduled_reports table
func InitScheduledReports(db *sql.DB) {
	query := `
		CREATE TABLE IF NOT EXISTS scheduled_reports (
			id VARCHAR(50) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			frequency VARCHAR(100) NOT NULL,
			recipients VARCHAR(255) NOT NULL,
			status VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`
	_, err := db.Exec(query)
	if err != nil {
		log.Printf("[Scheduled Reports] Create table error: %v\n", err)
		return
	}

	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM scheduled_reports").Scan(&count)
	if err == nil && count == 0 {
		insertQuery := `
			INSERT INTO scheduled_reports (id, name, frequency, recipients, status) VALUES
			('REP-001', 'Executive Monthly Cost & FinOps Summary', 'Monthly (1st)', 'noptrapk+executive@gmail.com', 'Active'),
			('REP-002', 'Departmental Chargeback Breakdown', 'Weekly (Every Mon)', 'noptrapk+finance@gmail.com', 'Active'),
			('REP-003', 'Untagged Resources & Governance Alert', 'Daily', 'noptrapk+infra.lead@gmail.com', 'Active')
		`
		_, err = db.Exec(insertQuery)
		if err != nil {
			log.Printf("[Scheduled Reports] Seeding error: %v\n", err)
		} else {
			log.Println("[Scheduled Reports] Seeded default reports with role-specific Cognito emails.")
		}
	} else {
		// Update existing DB records to role-specific Cognito emails
		updateQuery := `
			UPDATE scheduled_reports SET recipients = 'noptrapk+executive@gmail.com' WHERE id = 'REP-001';
			UPDATE scheduled_reports SET recipients = 'noptrapk+finance@gmail.com' WHERE id = 'REP-002';
			UPDATE scheduled_reports SET recipients = 'noptrapk+infra.lead@gmail.com' WHERE id = 'REP-003';
		`
		_, _ = db.Exec(updateQuery)
	}
}

// SeedDynamicDashboardStats generates daily cost, savings, and allocation stats for UAT / Demo
func SeedDynamicDashboardStats(db *sql.DB) {
	// Seed daily_cloud_costs for last 14 days
	_, _ = db.Exec(`
		INSERT INTO daily_cloud_costs (record_date, total_cost)
		SELECT dt::date, (3500.00 + (random() * 500.00))::numeric(15,2)
		FROM generate_series(CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE, '1 day'::interval) AS dt
		ON CONFLICT (record_date) DO NOTHING;
	`)

	// Seed allocation_usage for last 14 days
	_, _ = db.Exec(`
		INSERT INTO allocation_usage (record_date, used_percentage)
		SELECT dt::date, (82.5 + (random() * 10.0))::numeric(5,2)
		FROM generate_series(CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE, '1 day'::interval) AS dt
		ON CONFLICT (record_date) DO NOTHING;
	`)

	// Seed sweep_tracking for last 14 days
	_, _ = db.Exec(`
		INSERT INTO sweep_tracking (resource_id, action_taken, saved_cost_per_day, swept_date)
		SELECT 'i-auto-swept-' || dt::date, 'terminated', (850.00 + (random() * 200.00))::numeric(15,2), dt::date
		FROM generate_series(CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE, '1 day'::interval) AS dt
		ON CONFLICT DO NOTHING;
	`)

	log.Println("[Dashboard Seed] Dynamic daily stats seeded successfully.")
}

// seedInvoices inserts basic invoice rows into cloud_invoices for all 7 multi-cloud providers
// Amounts are in USD and match Dashboard Recent Charges (total $241,500)
func seedInvoices(db *sql.DB) {
	// First seed recent_charges table for Dashboard
	InitRecentChargesTable(db)

	insertQuery := `
		INSERT INTO cloud_invoices (id, provider, billing_period, due_date, amount, status, currency, subtotal, tax_rate, tax_amount, grand_total) VALUES
		($1, 'AWS',          'JULY 1 - JULY 30', '15 Aug 2026', 30000.00, 'Paid',    'USD', 28037.38, 7.00,  1962.62, 30000.00),
		($2, 'Azure',        'JULY 1 - JULY 30', '20 Aug 2026', 40000.00, 'Pending', 'USD', 37383.18, 7.00,  2616.82, 40000.00),
		($3, 'GCP',          'JULY 1 - JULY 30', '10 Aug 2026', 50000.00, 'Paid',    'USD', 46728.97, 7.00,  3271.03, 50000.00),
		($4, 'Salesforce',   'JULY 1 - JULY 30', '25 Aug 2026', 60000.00, 'Paid',    'USD', 56074.77, 7.00,  3925.23, 60000.00),
		($5, 'IBM Cloud',    'JULY 1 - JULY 30', '18 Aug 2026', 15000.00, 'Pending', 'USD', 14018.69, 7.00,   981.31, 15000.00),
		($6, 'Oracle',       'JULY 1 - JULY 30', '12 Aug 2026', 28000.00, 'Paid',    'USD', 26168.22, 7.00,  1831.78, 28000.00),
		($7, 'Alibaba Cloud','JULY 1 - JULY 30', '01 Aug 2026', 18500.00, 'Overdue', 'USD', 17289.72, 7.00,  1210.28, 18500.00)
	`
	_, err := db.Exec(insertQuery, inv2026001, inv2026002, inv2026003, inv2026004, inv2026005, inv2026006, inv2026007)
	if err != nil {
		log.Printf("[Invoices DB] Seeding error: %v\n", err)
	} else {
		log.Println("[Invoices DB] Seeded 7 multi-cloud invoices (total $241,500 USD) successfully.")
	}
}

// InitRecentChargesTable creates and seeds recent_charges table with all 8 multi-cloud items from Dashboard
func InitRecentChargesTable(db *sql.DB) {
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS recent_charges (
			id VARCHAR(50) PRIMARY KEY,
			provider VARCHAR(50) NOT NULL,
			icon VARCHAR(255) NOT NULL,
			usage VARCHAR(100) NOT NULL,
			interval VARCHAR(100) NOT NULL,
			amount VARCHAR(50) NOT NULL,
			percent FLOAT NOT NULL,
			is_up BOOLEAN NOT NULL,
			projected VARCHAR(50) NOT NULL
		);
	`
	_, err := db.Exec(createTableQuery)
	if err != nil {
		log.Printf("[Recent Charges Table] Create error: %v\n", err)
		return
	}

	// Truncate/Re-seed to populate exact Dashboard items
	_, _ = db.Exec("DELETE FROM recent_charges;")

	seedQuery := `
		INSERT INTO recent_charges (id, provider, icon, usage, interval, amount, percent, is_up, projected) VALUES
		('16023', 'AWS', 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg', '1500 Hours', 'JULY 1 - JULY 30', '$30,000', 25.0, true, '$28,000'),
		('16024', 'Azure', 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg', '300 Hours', 'JULY 1 - JULY 30', '$20,000', 25.0, true, '$30,000'),
		('16025', 'Azure', 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg', '300 Hours', 'JULY 1 - JULY 30', '$20,000', 25.0, true, '$30,000'),
		('20123', 'GCP', 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg', '300 Hours', 'JULY 1 - JULY 30', '$50,000', 30.0, true, '$35,000'),
		('32405', 'Salesforce', 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg', '700 Hours', 'JULY 1 - JULY 30', '$60,000', 20.0, true, '$55,000'),
		('35215', 'IBM Cloud', 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg', '1500 Hours', 'JULY 1 - JULY 30', '$15,000', 12.0, false, '$17,000'),
		('38241', 'Oracle', 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg', '1500 Hours', 'JULY 1 - JULY 30', '$28,000', 18.0, true, '$24,000'),
		('30101', 'Alibaba Cloud', 'https://upload.wikimedia.org/wikipedia/commons/0/07/Alibaba_Cloud_logo.svg', '300 Hours', 'JULY 1 - JULY 30', '$18,500', 10.0, true, '$17,000');
	`
	_, err = db.Exec(seedQuery)
	if err != nil {
		log.Printf("[Recent Charges Seed] Error: %v\n", err)
	} else {
		log.Println("[Recent Charges Seed] Seeded 8 multi-cloud invoice items matching Dashboard successfully.")
	}
}

// seedLineItemsAndAllocations inserts line items and chargeback department mappings
func seedLineItemsAndAllocations(db *sql.DB) {
	// Look up departments
	var engID, dataID, mktID, sharedID sql.NullInt64
	_ = db.QueryRow("SELECT id FROM departments WHERE name ILIKE '%Engineering%' OR name ILIKE '%วิศวกรรม%' LIMIT 1").Scan(&engID)
	_ = db.QueryRow("SELECT id FROM departments WHERE name ILIKE '%Data%' OR name ILIKE '%ข้อมูล%' LIMIT 1").Scan(&dataID)
	_ = db.QueryRow("SELECT id FROM departments WHERE name ILIKE '%Marketing%' OR name ILIKE '%การตลาด%' LIMIT 1").Scan(&mktID)
	_ = db.QueryRow("SELECT id FROM departments WHERE name ILIKE '%Shared%' OR name ILIKE '%ส่วนกลาง%' LIMIT 1").Scan(&sharedID)

	// Look up projects
	var prjAWS, prjAzure, prjGCP, prjAlibaba sql.NullString
	_ = db.QueryRow("SELECT id FROM projects WHERE provider ILIKE '%AWS%' LIMIT 1").Scan(&prjAWS)
	_ = db.QueryRow("SELECT id FROM projects WHERE provider ILIKE '%Azure%' LIMIT 1").Scan(&prjAzure)
	_ = db.QueryRow("SELECT id FROM projects WHERE provider ILIKE '%GCP%' LIMIT 1").Scan(&prjGCP)
	_ = db.QueryRow("SELECT id FROM projects WHERE provider ILIKE '%Alibaba%' LIMIT 1").Scan(&prjAlibaba)

	// Helpers to handle SQL types safely
	var getNullValStr = func(ns sql.NullString) interface{} {
		if ns.Valid {
			return ns.String
		}
		return nil
	}

	var getNullValInt = func(ni sql.NullInt64) interface{} {
		if ni.Valid {
			return ni.Int64
		}
		return nil
	}

	// 1. Seed Line Items for AWS (INV-2026-001)
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026001, "Amazon EC2", "Compute", 11214.95, 785.05, 12000.00, getNullValStr(prjAWS))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026001, "Amazon RDS", "Database", 7009.35, 490.65, 7500.00, getNullValStr(prjAWS))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026001, "Amazon S3", "Storage", 4205.61, 294.39, 4500.00, getNullValStr(prjAWS))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026001, "AWS Support & Fees", "Support", 2803.74, 196.26, 3000.00, getNullValStr(prjAWS))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026001, "AWSDataTransfer (Data Egress)", "DataTransfer", 2803.74, 196.26, 3000.00, getNullValStr(prjAWS))

	// 2. Seed Line Items for Azure (INV-2026-002)
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026002, "Azure Virtual Machines", "Compute", 8411.22, 588.78, 9000.00, getNullValStr(prjAzure))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026002, "Azure SQL Database", "Database", 5607.48, 392.52, 6000.00, getNullValStr(prjAzure))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026002, "Azure Blob Storage", "Storage", 2803.74, 196.26, 3000.00, getNullValStr(prjAzure))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026002, "Bandwidth & IP", "DataTransfer", 1869.15, 130.85, 2000.00, getNullValStr(prjAzure))

	// 3. Seed Line Items for GCP (INV-2026-003)
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026003, "Google Compute Engine", "Compute", 23364.49, 1635.51, 25000.00, getNullValStr(prjGCP))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026003, "Google Cloud Storage", "Storage", 9345.79, 654.21, 10000.00, getNullValStr(prjGCP))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026003, "BigQuery Analytics", "Database", 11214.95, 785.05, 12000.00, getNullValStr(prjGCP))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026003, "Cloud Pub/Sub", "DataTransfer", 2803.74, 196.26, 3000.00, getNullValStr(prjGCP))

	// 4. Seed Line Items for Alibaba Cloud (INV-2026-004) — $18,500 USD total
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026004, "ECS Instances", "Compute", 9345.79, 654.21, 10000.00, getNullValStr(prjAlibaba))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026004, "ApsaraDB for RDS", "Database", 5607.48, 392.52, 6000.00, getNullValStr(prjAlibaba))
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026004, "Object Storage Service", "Storage", 2336.45, 163.55, 2500.00, getNullValStr(prjAlibaba))

	// 5. Seed Line Items for Salesforce (INV-2026-005) — $60,000 USD total
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026005, "Sales Cloud Platform", "Platform", 28037.38, 1962.62, 30000.00, nil)
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026005, "Marketing Cloud", "Marketing", 18691.59, 1308.41, 20000.00, nil)
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026005, "Tableau Analytics", "Analytics", 9345.79, 654.21, 10000.00, nil)

	// 6. Seed Line Items for IBM Cloud (INV-2026-006) — $15,000 USD total
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026006, "IBM Virtual Servers", "Compute", 9345.79, 654.21, 10000.00, nil)
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026006, "IBM Cloud Object Storage", "Storage", 4672.90, 327.10, 5000.00, nil)

	// 7. Seed Line Items for Oracle Cloud (INV-2026-007) — $28,000 USD total
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026007, "Oracle Compute", "Compute", 14018.69, 981.31, 15000.00, nil)
	_, _ = db.Exec(`
		INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total, project_id) VALUES
		($1, $2, $3, $4, $5, $6, $7)`, inv2026007, "Oracle Autonomous DB", "Database", 12149.53, 850.47, 13000.00, nil)

	// Seed Department Allocations for all 7 Invoices (USD amounts)
	if engID.Valid {
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 45.00, 13500.00)`, inv2026001, getNullValInt(engID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 40.00, 16000.00)`, inv2026002, getNullValInt(engID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 15.00, 7500.00)`, inv2026003, getNullValInt(engID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 65.00, 12025.00)`, inv2026004, getNullValInt(engID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 40.00, 24000.00)`, inv2026005, getNullValInt(engID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 50.00, 7500.00)`, inv2026006, getNullValInt(engID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 35.00, 9800.00)`, inv2026007, getNullValInt(engID))
	}
	if dataID.Valid {
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 15.00, 4500.00)`, inv2026001, getNullValInt(dataID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 20.00, 8000.00)`, inv2026002, getNullValInt(dataID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 35.00, 17500.00)`, inv2026003, getNullValInt(dataID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 35.00, 6475.00)`, inv2026004, getNullValInt(dataID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 15.00, 9000.00)`, inv2026005, getNullValInt(dataID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 30.00, 4500.00)`, inv2026006, getNullValInt(dataID))
		_, _ = db.Exec(`INSERT INTO invoice_department_allocations (invoice_id, department_id, ratio, allocated_amount) VALUES ($1, $2, 15.00, 4200.00)`, inv2026007, getNullValInt(dataID))
	}

	log.Println("[Invoices DB] Seeded line items and department allocations dynamically.")
}

// InitInvoicesTable creates and seeds the cloud_invoices, cloud_invoice_line_items, and invoice_department_allocations tables in PostgreSQL
func InitInvoicesTable(db *sql.DB) {
	// 1. Create cloud_invoices table
	queryInvoices := `
		CREATE TABLE IF NOT EXISTS cloud_invoices (
			id VARCHAR(50) PRIMARY KEY,
			provider VARCHAR(100) NOT NULL,
			billing_period VARCHAR(100) NOT NULL,
			due_date VARCHAR(50) NOT NULL,
			amount NUMERIC(15, 2) NOT NULL,
			status VARCHAR(50) NOT NULL,
			currency VARCHAR(10) NOT NULL,
			subtotal NUMERIC(15, 2) NOT NULL,
			tax_rate NUMERIC(5, 2) NOT NULL,
			tax_amount NUMERIC(15, 2) NOT NULL,
			grand_total NUMERIC(15, 2) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`
	_, err := db.Exec(queryInvoices)
	if err != nil {
		log.Printf("[Invoices DB] Create cloud_invoices error: %v\n", err)
		return
	}

	// 2. Create cloud_invoice_line_items table
	queryLineItems := `
		CREATE TABLE IF NOT EXISTS cloud_invoice_line_items (
			id SERIAL PRIMARY KEY,
			invoice_id VARCHAR(50) REFERENCES cloud_invoices(id) ON DELETE CASCADE,
			service_name VARCHAR(100) NOT NULL,
			category VARCHAR(50) NOT NULL,
			subtotal NUMERIC(15, 2) NOT NULL,
			tax_amount NUMERIC(15, 2) NOT NULL,
			grand_total NUMERIC(15, 2) NOT NULL,
			project_id VARCHAR(50) REFERENCES projects(id)
		)
	`
	_, err = db.Exec(queryLineItems)
	if err != nil {
		log.Printf("[Invoices DB] Create cloud_invoice_line_items error: %v\n", err)
		return
	}

	// 3. Create invoice_department_allocations table
	queryAllocations := `
		CREATE TABLE IF NOT EXISTS invoice_department_allocations (
			id SERIAL PRIMARY KEY,
			invoice_id VARCHAR(50) REFERENCES cloud_invoices(id) ON DELETE CASCADE,
			department_id INTEGER REFERENCES departments(id),
			ratio NUMERIC(5, 2) NOT NULL,
			allocated_amount NUMERIC(15, 2) NOT NULL
		)
	`
	_, err = db.Exec(queryAllocations)
	if err != nil {
		log.Printf("[Invoices DB] Create invoice_department_allocations error: %v\n", err)
		return
	}

	// Seed/Migrate cloud_invoices — idempotent: insert new, fix existing
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM cloud_invoices").Scan(&count)
	if err == nil && count == 0 {
		// Fresh DB: seed all 7 invoices
		seedInvoices(db)
	} else if err == nil && count > 0 {
		// Existing DB: migrate to fix INV-2026-004 currency and add missing invoices
		migrateInvoices(db)
	}

	// Dynamic Seeding of Line Items & Department Allocations if Line Items is empty
	var linesCount int
	err = db.QueryRow("SELECT COUNT(*) FROM cloud_invoice_line_items").Scan(&linesCount)
	if err == nil && linesCount == 0 {
		seedLineItemsAndAllocations(db)
	} else {
		// Migration: fix Alibaba line items if they have wrong (THB) amounts
		migrateLineItems(db)
	}
}

// SeedMockCloudResources seeds the cloud_resources table with mock resources for each project for UAT / Demo purposes
func SeedMockCloudResources(db *sql.DB) {
	mockResources := []struct {
		ID         string
		Name       string
		Type       string
		Provider   string
		ProjectTag string
		Cost       float64
		Status     string
		IdleDays   int
	}{
		// PRJ-001 (MovieX AI Backend - AWS)
		{"i-019c114b82aa3d710", amazonEC2T3Micro, onDemandInstances, "AWS", prjAWSProject, 15.50, "ACTIVE", 3},
		{"db-019c114b82aa3d711", "Amazon RDS (PostgreSQL)", "db.t3.medium", "AWS", prjAWSProject, 32.20, "ACTIVE", 0},
		{"s3-019c114b82aa3d712", "Amazon S3 (Standard Storage)", storageByteHrs, "AWS", prjAWSProject, 4.80, "ACTIVE", 0},

		// PRJ-002 (Vet Clinic Management - Azure)
		{"vm-029c114b82aa3d720", "Azure Virtual Machines (B2s)", "Compute-Hours", "Azure", prjAzureProject, 25.00, "ACTIVE", 12},
		{"sql-029c114b82aa3d721", "Azure SQL Database (DTU-based)", "Database-Hours", "Azure", prjAzureProject, 18.50, "ACTIVE", 0},
		{"blob-029c114b82aa3d722", "Azure Blob Storage", "Storage-GB", "Azure", prjAzureProject, 3.20, "ACTIVE", 0},

		// PRJ-003 (Sandbox / Tests - GCP)
		{"ce-039c114b82aa3d730", "Compute Engine (e2-micro)", "Virtual Machine", "GCP", "PRJ-003", 8.00, "ACTIVE", 15},
		{"gcs-039c114b82aa3d731", "Cloud Storage", "Storage-Standard", "GCP", "PRJ-003", 2.40, "ACTIVE", 18},

		// PRJ-004 (Recommendation Engine - AWS)
		{"i-049c114b82aa3d740", "Amazon EC2 (c5.large)", onDemandInstances, "AWS", prjGCPProject, 45.00, "ACTIVE", 5},
		{"db-049c114b82aa3d741", "Amazon RDS (MySQL)", "db.r5.large", "AWS", prjGCPProject, 62.00, "ACTIVE", 0},
		{"s3-049c114b82aa3d742", "Amazon S3 (Standard Storage)", storageByteHrs, "AWS", prjGCPProject, 8.50, "ACTIVE", 0},

		// PRJ-005 (Feature Store - AWS)
		{"i-059c114b82aa3d750", "Amazon EC2 (m5.xlarge)", onDemandInstances, "AWS", "PRJ-005", 52.00, "ACTIVE", 2},
		{"ddb-059c114b82aa3d751", "Amazon DynamoDB", "Read/Write Capacity", "AWS", "PRJ-005", 18.00, "ACTIVE", 0},

		// PRJ-006 (Campaign Analytics - Azure)
		{"vm-069c114b82aa3d760", "Azure Virtual Machines (D2s v3)", "Compute-Hours", "Azure", "PRJ-006", 38.00, "ACTIVE", 20},
		{"sql-069c114b82aa3d761", "Azure SQL Database", "Database-Hours", "Azure", "PRJ-006", 22.00, "ACTIVE", 0},

		// 7 Department Projects Breakdown
		{"i-infra-01", "Amazon EC2 (c7i-flex.large)", computeOnDemand, "AWS", prjInfra01, 385.00, "ACTIVE", 0},
		{"db-infra-01", "Amazon RDS PostgreSQL Multi-AZ", "Database-Instance", "AWS", prjInfra01, 142.00, "ACTIVE", 0},
		{"s3-infra-01", "Amazon S3 Standard Storage", storageByteHrs, "AWS", prjInfra01, 88.00, "ACTIVE", 0},

		{"i-prod-01", "Amazon EC2 (m7i-flex.large)", computeOnDemand, "AWS", prjProd01, 490.00, "ACTIVE", 0},
		{"db-prod-01", "Amazon Aurora PostgreSQL", "Database-Cluster", "AWS", prjProd01, 210.00, "ACTIVE", 0},
		{"s3-prod-01", "Amazon S3 Standard Storage", storageByteHrs, "AWS", prjProd01, 106.00, "ACTIVE", 0},

		{"i-data-01", "Amazon EC2 (c7i-flex.large)", computeOnDemand, "AWS", prjData01, 340.00, "ACTIVE", 0},
		{"db-data-01", "Amazon Redshift Data Warehouse", "Analytics-Cluster", "AWS", prjData01, 175.00, "ACTIVE", 0},
		{"s3-data-01", "Amazon S3 Analytics Lake", storageByteHrs, "AWS", prjData01, 45.00, "ACTIVE", 0},

		{"i-trust-01", "Amazon EC2 (t3.small)", computeOnDemand, "AWS", prjTrust01, 190.00, "ACTIVE", 0},
		{"db-trust-01", "Amazon DynamoDB Fraud Logs", "NoSQL-Capacity", "AWS", prjTrust01, 85.00, "ACTIVE", 0},

		{"i-finance-01", amazonEC2T3Micro, computeOnDemand, "AWS", prjFinance01, 145.00, "ACTIVE", 0},
		{"db-finance-01", "Amazon RDS PostgreSQL", "Database-Instance", "AWS", prjFinance01, 72.00, "ACTIVE", 0},

		{"i-exec-01", amazonEC2T3Micro, computeOnDemand, "AWS", prjExec01, 105.00, "ACTIVE", 0},
		{"s3-exec-01", "Amazon S3 Executive Reports", storageByteHrs, "AWS", prjExec01, 42.00, "ACTIVE", 0},

		{"i-finops-01", amazonEC2T3Micro, computeOnDemand, "AWS", prjFinOps01, 78.00, "ACTIVE", 0},
		{"s3-finops-01", "Amazon S3 Audit Logs", storageByteHrs, "AWS", prjFinOps01, 28.00, "ACTIVE", 0},
	}

	query := `
		INSERT INTO cloud_resources (id, name, type, provider, project_tag, cost_per_day, status, idle_days)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO NOTHING
	`

	for _, res := range mockResources {
		_, err := db.Exec(query, res.ID, res.Name, res.Type, res.Provider, res.ProjectTag, res.Cost, res.Status, res.IdleDays)
		if err != nil {
			log.Printf("[Mock Resources Seed] Seeding error for %s: %v\n", res.ID, err)
		}
	}
	log.Println("[Mock Resources Seed] Seeded mock cloud resources successfully.")
}

// SeedAllDepartmentsProjectCosts seeds representative projects & spending for all 7 departments
func SeedAllDepartmentsProjectCosts(db *sql.DB) {
	deptMap := map[string]struct {
		prjID      string
		prjName    string
		owner      string
		spend      float64
		momChange  float64
		provider   string
		allocModel string
	}{
		"Core Infrastructure": {
			prjID: prjInfra01, prjName: "Cloud Platform & K8s Cluster", owner: "Tata Infra Lead",
			spend: 18450.00, momChange: 3.5, provider: "AWS", allocModel: "Fixed",
		},
		"Product Engineering": {
			prjID: prjProd01, prjName: "Mobile App & Core Microservices", owner: "Nest Prod Lead",
			spend: 24200.00, momChange: 5.2, provider: "AWS", allocModel: "Usage-Based",
		},
		"Data Science & Analytics": {
			prjID: prjData01, prjName: "AI Model Training & Data Lake", owner: "Promp Data Lead",
			spend: 16800.00, momChange: -2.1, provider: "AWS", allocModel: "Usage-Based",
		},
		"Trust & Safety": {
			prjID: prjTrust01, prjName: "Fraud Detection & Content Moderation", owner: "Bank Trust Lead",
			spend: 9600.00, momChange: 1.8, provider: "AWS", allocModel: "Fixed",
		},
		"Finance": {
			prjID: prjFinance01, prjName: "ERP & Financial Analytics Platform", owner: "Dear Finance Lead",
			spend: 7400.00, momChange: 0.5, provider: "AWS", allocModel: "Fixed",
		},
		"Executive / C-Level": {
			prjID: prjExec01, prjName: "Executive Dashboard & BI Metrics", owner: "John Executive Lead",
			spend: 5200.00, momChange: 0.0, provider: "AWS", allocModel: "Fixed",
		},
		"FinOps & Cloud Governance": {
			prjID: prjFinOps01, prjName: "Automated Lifecycle & Sweeper Platform", owner: "Optra FinOps Lead",
			spend: 3800.00, momChange: -8.4, provider: "AWS", allocModel: "Fixed",
		},
	}

	var latestMonth string
	err := db.QueryRow("SELECT COALESCE(TO_CHAR(MAX(record_month), 'YYYY-MM-01'), '2026-08-01') FROM project_costs").Scan(&latestMonth)
	if err != nil || latestMonth == "" {
		latestMonth = "2026-08-01"
	}

	for deptName, info := range deptMap {
		var deptID int
		err := db.QueryRow("SELECT id FROM departments WHERE LOWER(name) = LOWER($1)", deptName).Scan(&deptID)
		if err != nil {
			log.Printf("[Seeder Warning] Department '%s' not found in DB: %v\n", deptName, err)
			continue
		}

		// Ensure project exists
		_, _ = db.Exec(`
			INSERT INTO projects (id, name, department_id, owner, provider, allocation_model)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (id) DO UPDATE SET 
				name = $2, department_id = $3, owner = $4, provider = $5, allocation_model = $6
		`, info.prjID, info.prjName, deptID, info.owner, info.provider, info.allocModel)

		// Ensure project_costs entry exists for latestMonth
		_, _ = db.Exec(`
			INSERT INTO project_costs (project_id, record_month, spend, mom_change, is_tagged)
			VALUES ($1, $2::date, $3, $4, true)
			ON CONFLICT (project_id, record_month) DO UPDATE SET
				spend = $3, mom_change = $4, is_tagged = true
		`, info.prjID, latestMonth, info.spend, info.momChange)
	}

	log.Println("[Seeder] Seeded representative project costs for all 7 departments successfully.")
}

// migrateInvoices fixes existing cloud_invoices data and adds missing providers.
// This is idempotent: uses ON CONFLICT DO UPDATE / DO NOTHING.
func migrateInvoices(db *sql.DB) {
	// Fix INV-2026-004: convert Alibaba Cloud from THB to USD
	_, err := db.Exec(`
		UPDATE cloud_invoices SET
			amount      = 18500.00,
			currency    = 'USD',
			subtotal    = 17289.72,
			tax_rate    = 7.00,
			tax_amount  = 1210.28,
			grand_total = 18500.00
		WHERE id = 'INV-2026-004'
		  AND currency = 'THB'
	`)
	if err != nil {
		log.Printf("[Invoice Migration] Fix Alibaba currency error: %v\n", err)
	} else {
		log.Println("[Invoice Migration] Fixed INV-2026-004 Alibaba Cloud: THB → USD $18,500")
	}

	// Fix INV-2026-002: Azure amount should be $40,000 (consolidated from 2 charges #16024+#16025)
	_, _ = db.Exec(`
		UPDATE cloud_invoices SET
			amount      = 40000.00,
			subtotal    = 37383.18,
			tax_amount  = 2616.82,
			grand_total = 40000.00
		WHERE id = 'INV-2026-002'
		  AND amount = 20000.00
	`)

	// Insert missing providers — ON CONFLICT DO NOTHING makes this safe to re-run
	upsertQuery := `
		INSERT INTO cloud_invoices (id, provider, billing_period, due_date, amount, status, currency, subtotal, tax_rate, tax_amount, grand_total) VALUES
		($1, 'Salesforce',    'JULY 1 - JULY 30', '25 Aug 2026', 60000.00, 'Paid',    'USD', 56074.77, 7.00, 3925.23, 60000.00),
		($2, 'IBM Cloud',     'JULY 1 - JULY 30', '18 Aug 2026', 15000.00, 'Pending', 'USD', 14018.69, 7.00,  981.31, 15000.00),
		($3, 'Oracle',        'JULY 1 - JULY 30', '12 Aug 2026', 28000.00, 'Paid',    'USD', 26168.22, 7.00, 1831.78, 28000.00)
		ON CONFLICT (id) DO NOTHING
	`
	_, err = db.Exec(upsertQuery, inv2026005, inv2026006, inv2026007)
	if err != nil {
		log.Printf("[Invoice Migration] Insert missing providers error: %v\n", err)
	} else {
		log.Println("[Invoice Migration] Upserted Salesforce, IBM Cloud, Oracle invoices successfully.")
	}
}

// migrateLineItems fixes Alibaba Cloud line items that were stored with THB amounts.
func migrateLineItems(db *sql.DB) {
	// Check if Alibaba line items are wrong (grand_total sum >> $18,500 means THB data)
	var alibabaTotal float64
	_ = db.QueryRow(`SELECT COALESCE(SUM(grand_total), 0) FROM cloud_invoice_line_items WHERE invoice_id = 'INV-2026-004'`).Scan(&alibabaTotal)

	if alibabaTotal > 50000 {
		// Delete old THB line items and re-insert correct USD amounts
		_, _ = db.Exec(`DELETE FROM cloud_invoice_line_items WHERE invoice_id = 'INV-2026-004'`)
		_, _ = db.Exec(`INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total) VALUES
			('INV-2026-004', 'ECS Instances',          'Compute',  9345.79, 654.21, 10000.00),
			('INV-2026-004', 'ApsaraDB for RDS',       'Database', 5607.48, 392.52,  6000.00),
			('INV-2026-004', 'Object Storage Service', 'Storage',  2336.45, 163.55,  2500.00)`)
		log.Println("[Invoice Migration] Fixed INV-2026-004 line items: THB → USD $18,500")
	}

	// Insert missing line items for new providers (INV-2026-005, -006, -007) if absent
	var sfCount, ibmCount, oracleCount int
	_ = db.QueryRow(`SELECT COUNT(*) FROM cloud_invoice_line_items WHERE invoice_id = 'INV-2026-005'`).Scan(&sfCount)
	_ = db.QueryRow(`SELECT COUNT(*) FROM cloud_invoice_line_items WHERE invoice_id = 'INV-2026-006'`).Scan(&ibmCount)
	_ = db.QueryRow(`SELECT COUNT(*) FROM cloud_invoice_line_items WHERE invoice_id = 'INV-2026-007'`).Scan(&oracleCount)

	if sfCount == 0 {
		_, _ = db.Exec(`INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total) VALUES
			('INV-2026-005', 'Sales Cloud Platform', 'Platform',  28037.38, 1962.62, 30000.00),
			('INV-2026-005', 'Marketing Cloud',       'Marketing', 18691.59, 1308.41, 20000.00),
			('INV-2026-005', 'Tableau Analytics',     'Analytics',  9345.79,  654.21, 10000.00)`)
		log.Println("[Invoice Migration] Inserted Salesforce line items.")
	}
	if ibmCount == 0 {
		_, _ = db.Exec(`INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total) VALUES
			('INV-2026-006', 'IBM Virtual Servers',       'Compute',  9345.79, 654.21, 10000.00),
			('INV-2026-006', 'IBM Cloud Object Storage',  'Storage',  4672.90, 327.10,  5000.00)`)
		log.Println("[Invoice Migration] Inserted IBM Cloud line items.")
	}
	if oracleCount == 0 {
		_, _ = db.Exec(`INSERT INTO cloud_invoice_line_items (invoice_id, service_name, category, subtotal, tax_amount, grand_total) VALUES
			('INV-2026-007', 'Oracle Compute',       'Compute',  14018.69, 981.31, 15000.00),
			('INV-2026-007', 'Oracle Autonomous DB', 'Database', 12149.53, 850.47, 13000.00)`)
		log.Println("[Invoice Migration] Inserted Oracle line items.")
	}
}
