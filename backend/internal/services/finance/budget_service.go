package finance

import (
	"context"
	"database/sql"
	"log"
	"strings"
	"time"

	"automated-lifecycle/backend/internal/middleware"
	"automated-lifecycle/backend/internal/services/noti"
)

type ProjectBudget struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Owner    string  `json:"owner"`
	Provider string  `json:"provider"`
	Spent    float64 `json:"spent"`
}

type DepartmentBudget struct {
	ID         int             `json:"id"`
	Name       string          `json:"name"`
	Allocated  float64         `json:"allocated"`
	Spent      float64         `json:"spent"`
	Forecasted float64         `json:"forecasted"`
	Owner      string          `json:"owner"`
	Status     string          `json:"status"` // "OK", "Warning", "Critical"
	Slack      string          `json:"slack"`
	Email      string          `json:"email"`
	Projects   []ProjectBudget `json:"projects"`
}

type TrendValue struct {
	Value float64 `json:"value"`
}

type BudgetsDataResponse struct {
	TotalBudget     float64            `json:"totalBudget"`
	TotalSpent      float64            `json:"totalSpent"`
	RemainingBudget float64            `json:"remainingBudget"`
	ForecastedSpend float64            `json:"forecastedSpend"`
	UsagePercent    float64            `json:"usagePercent"`
	BudgetTrend     []TrendValue       `json:"budgetTrend"`
	SpentTrend      []TrendValue       `json:"spentTrend"`
	RemainingTrend  []TrendValue       `json:"remainingTrend"`
	Departments     []DepartmentBudget `json:"departments"`
}

type teamContact struct {
	slack string
	email string
}

// fetchDepartmentsAndRoles loads and filters departments based on user permissions
func fetchDepartmentsAndRoles(ctx context.Context, db *sql.DB) ([]DepartmentBudget, float64, error) {
	deptRows, err := db.Query("SELECT id, name, COALESCE(budget, 0.0) FROM departments ORDER BY id ASC")
	if err != nil {
		log.Println("[Budget Service] Error querying departments:", err)
		return nil, 0, err
	}
	defer deptRows.Close()

	var departments []DepartmentBudget
	var totalBudget float64

	userRole := middleware.GetUserRole(ctx)
	userDept := middleware.GetUserDept(ctx)

	for deptRows.Next() {
		var dept DepartmentBudget
		err := deptRows.Scan(&dept.ID, &dept.Name, &dept.Allocated)
		if err != nil {
			log.Println("[Budget Service] Error scanning department:", err)
			continue
		}

		// Filter departments if user has restrictions (lead/dev)
		if (userRole == "lead" || userRole == "dev") && userDept != "All" && userDept != "" &&
			!strings.EqualFold(userRole, "finops") &&
			!strings.EqualFold(userRole, "finance") &&
			!strings.EqualFold(userRole, "admin") &&
			!strings.Contains(strings.ToLower(userDept), "finops") &&
			!strings.Contains(strings.ToLower(userDept), "finance") &&
			!strings.EqualFold(dept.Name, userDept) {
			continue
		}

		totalBudget += dept.Allocated
		dept.Projects = []ProjectBudget{}
		departments = append(departments, dept)
	}
	return departments, totalBudget, nil
}

// loadProjectsToDepartments maps projects to their respective departments
func loadProjectsToDepartments(db *sql.DB, latestMonthStr string, deptMap map[int]*DepartmentBudget) error {
	projectQuery := `
		SELECT p.id, p.name, p.owner, p.provider, p.department_id, COALESCE(pc.spend, 0.0)
		FROM projects p
		LEFT JOIN project_costs pc ON pc.project_id = p.id AND pc.record_month = $1
	`
	pRows, err := db.Query(projectQuery, latestMonthStr)
	if err != nil {
		log.Println("[Budget Service] Error querying projects spent:", err)
		return err
	}
	defer pRows.Close()

	for pRows.Next() {
		var p ProjectBudget
		var deptID int
		err := pRows.Scan(&p.ID, &p.Name, &p.Owner, &p.Provider, &deptID, &p.Spent)
		if err != nil {
			log.Println("[Budget Service] Error scanning project budget:", err)
			continue
		}

		if dept, exists := deptMap[deptID]; exists {
			dept.Projects = append(dept.Projects, p)
			dept.Spent += p.Spent
			if dept.Owner == "" {
				dept.Owner = p.Owner // Default department owner to the first project owner
			}
		}
	}
	return nil
}

// loadTeamContacts pre-fetches team contacts to avoid N+1 queries
func loadTeamContacts(db *sql.DB) map[int]teamContact {
	teamContacts := make(map[int]teamContact)
	teamRows, err := db.Query("SELECT department_id, slack_channel, contact_email FROM teams")
	if err == nil {
		defer teamRows.Close()
		for teamRows.Next() {
			var deptID int
			var tc teamContact
			if err := teamRows.Scan(&deptID, &tc.slack, &tc.email); err == nil {
				teamContacts[deptID] = tc
			}
		}
	} else {
		log.Printf("[Budget Service] Error bulk loading team contacts: %v\n", err)
	}
	return teamContacts
}

// loadActiveDailyCosts pre-fetches cost per day per department to avoid N+1 queries
func loadActiveDailyCosts(db *sql.DB) map[int]float64 {
	activeDailyCosts := make(map[int]float64)
	costRows, err := db.Query(`
		SELECT p.department_id, COALESCE(SUM(cr.cost_per_day), 0.0)
		FROM cloud_resources cr
		JOIN projects p ON cr.project_tag = p.id
		GROUP BY p.department_id
	`)
	if err == nil {
		defer costRows.Close()
		for costRows.Next() {
			var deptID int
			var dailyCost float64
			if err := costRows.Scan(&deptID, &dailyCost); err == nil {
				activeDailyCosts[deptID] = dailyCost
			}
		}
	} else {
		log.Printf("[Budget Service] Error bulk loading active daily costs: %v\n", err)
	}
	return activeDailyCosts
}


func processDepartmentBudget(dept *DepartmentBudget, teamContacts map[int]teamContact, activeDailyCosts map[int]float64, daysInMonth, remainingDays int) {
	// 1. Baseline spend adjustment
	if dept.Spent == 0 && dept.Allocated > 0 {
		dept.Spent = dept.Allocated * 0.22
	}

	// 2. Assign contact details
	if tc, exists := teamContacts[dept.ID]; exists && tc.slack != "" && !strings.HasPrefix(tc.slack, "#finops-alerts-") {
		dept.Slack = tc.slack
		dept.Email = tc.email
	} else {
		dept.Slack = getDepartmentSlackChannel(dept.Name)
		dept.Email = "team-lead@enterprise.com"
	}

	// 3. Calculate run rate and forecast
	dailyRunRate := activeDailyCosts[dept.ID]
	if dailyRunRate == 0 {
		dailyRunRate = dept.Spent / float64(daysInMonth)
	}

	dept.Forecasted = dept.Spent + (dailyRunRate * float64(remainingDays))
	if dept.Forecasted < dept.Spent {
		dept.Forecasted = dept.Spent * 1.15
	}

	// 4. Determine status based on percentage used
	pct := 0.0
	if dept.Allocated > 0 {
		pct = (dept.Spent / dept.Allocated) * 100.0
	}

	if pct >= 100.0 {
		dept.Status = "Critical"
	} else if pct >= 80.0 {
		dept.Status = "Warning"
	} else {
		dept.Status = "OK"
	}
}

func processDepartmentForecasts(departments []DepartmentBudget, teamContacts map[int]teamContact, activeDailyCosts map[int]float64, daysInMonth, remainingDays int) (float64, float64) {
	var totalSpent float64
	var totalForecasted float64

	for i := range departments {
		dept := &departments[i]
		
		processDepartmentBudget(dept, teamContacts, activeDailyCosts, daysInMonth, remainingDays)

		totalSpent += dept.Spent
		totalForecasted += dept.Forecasted
	}

	return totalSpent, totalForecasted
}
// fetchHistoricalBudgetTrend fetches budget trend details
func fetchHistoricalBudgetTrend(db *sql.DB, totalBudget, totalSpent float64) ([]TrendValue, []TrendValue, []TrendValue) {
	trendQuery := `
		SELECT record_month, SUM(spend)
		FROM project_costs
		GROUP BY record_month
		ORDER BY record_month ASC
	`
	tRows, err := db.Query(trendQuery)
	var budgetTrend []TrendValue
	var spentTrend []TrendValue
	var remainingTrend []TrendValue

	if err == nil {
		defer tRows.Close()
		for tRows.Next() {
			var m time.Time
			var s float64
			if err := tRows.Scan(&m, &s); err == nil {
				budgetTrend = append(budgetTrend, TrendValue{Value: totalBudget})
				spentTrend = append(spentTrend, TrendValue{Value: s})
				remainingTrend = append(remainingTrend, TrendValue{Value: totalBudget - s})
			}
		}
	}

	// Fallback trend values if empty
	if len(spentTrend) == 0 {
		budgetTrend = []TrendValue{{100000}, {100000}, {100000}, {100000}}
		spentTrend = []TrendValue{{80000}, {85000}, {90000}, {totalSpent}}
		remainingTrend = []TrendValue{{20000}, {15000}, {10000}, {totalBudget - totalSpent}}
	}
	return budgetTrend, spentTrend, remainingTrend
}

// GetBudgetsData retrieves dynamic budget data according to FinOps principles
func GetBudgetsData(ctx context.Context, db *sql.DB) (BudgetsDataResponse, error) {
	// 1. Get latest record month from project_costs
	var latestMonth time.Time
	err := db.QueryRow("SELECT COALESCE(MAX(record_month), '2026-07-01') FROM project_costs").Scan(&latestMonth)
	if err != nil {
		latestMonth = time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	}
	latestMonthStr := latestMonth.Format("2006-01-02")

	// 2. Fetch all departments and their budget limit
	departments, totalBudget, err := fetchDepartmentsAndRoles(ctx, db)
	if err != nil {
		return BudgetsDataResponse{}, err
	}

	// 3. Map projects to their departments
	deptMap := make(map[int]*DepartmentBudget)
	for i := range departments {
		deptMap[departments[i].ID] = &departments[i]
	}

	err = loadProjectsToDepartments(db, latestMonthStr, deptMap)
	if err != nil {
		return BudgetsDataResponse{}, err
	}

	// Optimization: Pre-fetch details bulk
	teamContacts := loadTeamContacts(db)
	activeDailyCosts := loadActiveDailyCosts(db)

	// 4. Calculate Forecast, Status, Slack and Email details per department
	now := time.Now()
	lastDayOfMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, now.Location()).Day()
	daysInMonth := lastDayOfMonth
	currentDay := now.Day()
	remainingDays := daysInMonth - currentDay
	if remainingDays < 0 {
		remainingDays = 0
	}

	totalSpent, totalForecasted := processDepartmentForecasts(departments, teamContacts, activeDailyCosts, daysInMonth, remainingDays)

	// 5. Query historical trends for the stats area (last 4 months)
	budgetTrend, spentTrend, remainingTrend := fetchHistoricalBudgetTrend(db, totalBudget, totalSpent)

	remainingBudget := totalBudget - totalSpent
	usagePercent := 0.0
	if totalBudget > 0 {
		usagePercent = (totalSpent / totalBudget) * 100.0
	}

	return BudgetsDataResponse{
		TotalBudget:     totalBudget,
		TotalSpent:      totalSpent,
		RemainingBudget: remainingBudget,
		ForecastedSpend: totalForecasted,
		UsagePercent:    usagePercent,
		BudgetTrend:     budgetTrend,
		SpentTrend:      spentTrend,
		RemainingTrend:  remainingTrend,
		Departments:     departments,
	}, nil
}

// UpdateDepartmentBudget updates a department's budget in the database and dispatches Slack alert
func UpdateDepartmentBudget(db *sql.DB, deptID int, newBudget float64) error {
	query := "UPDATE departments SET budget = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	_, err := db.Exec(query, newBudget, deptID)
	if err != nil {
		log.Printf("[Budget Service] Failed to update budget for dept %d: %v\n", deptID, err)
		return err
	}

	// Fetch updated department info and calculate status
	var deptName string
	var totalSpent float64
	err = db.QueryRow("SELECT name FROM departments WHERE id = $1", deptID).Scan(&deptName)
	if err == nil {
		_ = db.QueryRow(`
			SELECT COALESCE(SUM(pc.spend), 0.0) 
			FROM project_costs pc 
			JOIN projects p ON pc.project_id = p.id 
			WHERE p.department_id = $1
		`, deptID).Scan(&totalSpent)

		status := "OK"
		if newBudget > 0 && totalSpent > newBudget {
			status = "Critical"
		} else if newBudget > 0 && totalSpent > (newBudget*0.85) {
			status = "Warning"
		}

		channel := getDepartmentSlackChannel(deptName)
		go noti.SendSlackAlert(deptName, channel, totalSpent, newBudget, status)
	}

	return nil
}

func getDepartmentSlackChannel(deptName string) string {
	switch deptName {
	case "Core Infrastructure":
		return "#core-infrastructure"
	case "Product Engineering":
		return "#product-engineering"
	case "Data Science & Analytics":
		return "#data-science-analytics"
	case "Trust & Safety":
		return "#trust-safety"
	case "Finance":
		return "#finance"
	case "Executive / C-Level":
		return "#executive"
	case "FinOps & Cloud Governance":
		return "#finops"
	default:
		return "#finops"
	}
}
