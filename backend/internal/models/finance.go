package models

type ROIResult struct {
	TotalSpentDaily  float64 `json:"TotalSpentDaily"`
	WastedCostDaily  float64 `json:"WastedCostDaily"`
	SavingsDaily     float64 `json:"SavingsDaily"`
	SavingsMonthly   float64 `json:"SavingsMonthly"`
	WastePercent     float64 `json:"WastePercent"`
	ROIPercent       float64 `json:"ROIPercent"` // ROI %
	PaybackDays      float64 `json:"PaybackDays"`
	SystemCostDaily  float64 `json:"SystemCostDaily"`
	ActiveCount      int     `json:"ActiveCount"`
	IdleCount        int     `json:"IdleCount"`
	SoftDeletedCount int     `json:"SoftDeletedCount"`
}
type ChargeItem struct {
	ID        string `json:"id"`
	Provider  string `json:"provider"`
	Icon      string `json:"icon"`
	Usage     string `json:"usage"`
	Interval  string `json:"interval"`
	Amount    string `json:"amount"`
	Percent   int    `json:"percent"`
	IsUp      bool   `json:"isUp"`
	Projected string `json:"projected"`
}

type InvoiceFinancials struct {
	SubTotal   float64 `json:"subTotal"`
	TaxRate    float64 `json:"taxRate"`
	TaxAmount  float64 `json:"taxAmount"`
	GrandTotal float64 `json:"grandTotal"`
}

type InvoiceLineItem struct {
	ID          int     `json:"id"`
	InvoiceID   string  `json:"invoiceId"`
	ServiceName string  `json:"serviceName"`
	Category    string  `json:"category"`
	SubTotal    float64 `json:"subtotal"`
	TaxAmount   float64 `json:"taxAmount"`
	GrandTotal  float64 `json:"grandTotal"`
	ProjectID   *string `json:"projectId"`
}

type InvoiceDepartmentAllocation struct {
	ID              int     `json:"id"`
	InvoiceID       string  `json:"invoiceId"`
	DepartmentID    int     `json:"departmentId"`
	DepartmentName  string  `json:"departmentName"`
	Ratio           float64 `json:"ratio"`
	AllocatedAmount float64 `json:"allocatedAmount"`
}

type DBInvoiceItem struct {
	ID            string                        `json:"id"`
	Provider      string                        `json:"provider"`
	BillingPeriod string                        `json:"billingPeriod"`
	DueDate       string                        `json:"dueDate"`
	Amount        float64                       `json:"amount"`
	Status        string                        `json:"status"`
	Currency      string                        `json:"currency"`
	Financials    InvoiceFinancials             `json:"financials"`
	LineItems     []InvoiceLineItem             `json:"lineItems"`
	Allocations   []InvoiceDepartmentAllocation `json:"departmentAllocations"`
}

type DashboardStats struct {
	TotalExpenditure float64   `json:"totalExpenditure"` // ยอดรวมเดือนปัจจุบัน (MTD)
	ExpData          []float64 `json:"expData"`          // กราฟ 7 วัน (Expenditure)
	ExpChange        float64   `json:"expChange"`        // เปอร์เซ็นต์ความเปลี่ยนแปลงรายสัปดาห์ (Expenditure)
	TotalSavings     float64   `json:"totalSavings"`     // ยอดรวมเงินที่ประหยัดได้
	SavData          []float64 `json:"savData"`          // กราฟ 7 วัน (Savings)
	SavChange        float64   `json:"savChange"`        // เปอร์เซ็นต์ความเปลี่ยนแปลงรายสัปดาห์ (Savings)
	UsedAllocation   float64   `json:"usedAllocation"`   // เปอร์เซ็นต์การใช้งานล่าสุด
	AllocData        []float64 `json:"allocData"`        // กราฟ 7 วัน (Allocation)
	AllocChange      float64   `json:"allocChange"`      // เปอร์เซ็นต์ความเปลี่ยนแปลงรายสัปดาห์ (Allocation)
}