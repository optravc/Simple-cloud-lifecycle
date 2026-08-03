package models

type budget struct {
	ID         string  `json:"ID"`
	TeamName   string  `json:"TeamName"`
	LimitDay   float64 `json:"LimitDay"`
	LimitMonth float64 `json:"LimitMonth"`
	ALERT      float64 `json:"ALERT"`
}

type BudgetStatus struct {
	SpentDay      float64 `json:"SpentDay"`
	SpentMonth    float64 `json:"SpentMonth"`
	usagePct      float64 `json:"usagePct"` // % limitMonth
	ForecastMonth float64 `json:"ForecastMonth"`
	IsOverBudget  bool    `json:"IsOverBudget"` //check limit
	IsNearLimit   bool    `json:"IsNearLimit"`  // near Alert
	Status        string  `json:"Status"`
}

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
    ID          string  `json:"id"`
    Provider    string  `json:"provider"`
    Icon        string  `json:"icon"`
    Usage       string  `json:"usage"`
    Interval    string  `json:"interval"`
    Amount      string  `json:"amount"`
    Percent     int     `json:"percent"`
    IsUp        bool    `json:"isUp"`
    Projected   string  `json:"projected"`
}
type DashboardStats struct {
	TotalExpenditure float64   `json:"totalExpenditure"` // ยอดรวมเดือนปัจจุบัน (MTD)
	ExpData          []float64 `json:"expData"`          // กราฟ 7 วัน (Expenditure)
	TotalSavings     float64   `json:"totalSavings"`     // ยอดรวมเงินที่ประหยัดได้
	SavData          []float64 `json:"savData"`          // กราฟ 7 วัน (Savings)
	UsedAllocation   float64   `json:"usedAllocation"`   // เปอร์เซ็นต์การใช้งานล่าสุด
	AllocData        []float64 `json:"allocData"`        // กราฟ 7 วัน (Allocation)
}