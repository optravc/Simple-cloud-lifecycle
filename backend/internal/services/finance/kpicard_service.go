package finance

import (
	"database/sql"
	"log"
	"automated-lifecycle/backend/internal/models"
)

// 1. กลุ่มฟังก์ชัน Expenditure (ค่าใช้จ่าย)
func get7DaysExpenditure(db *sql.DB) []float64 {
	query := `
		WITH last_7_days AS (
			SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date AS dt
		)
		SELECT COALESCE(SUM(d.total_cost), 0)
		FROM last_7_days l
		LEFT JOIN daily_cloud_costs d ON l.dt = d.record_date
		GROUP BY l.dt
		ORDER BY l.dt ASC;
	`
	rows, err := db.Query(query)
	if err != nil {
		log.Println("Error querying 7 days expenditure:", err)
		return make([]float64, 7)
	}
	defer rows.Close()

	var data []float64
	for rows.Next() {
		var val float64
		if err := rows.Scan(&val); err == nil {
			data = append(data, val)
		}
	}
	return data
}

func getMTDExpenditure(db *sql.DB) float64 {
	query := `
		SELECT COALESCE(SUM(total_cost), 0)
		FROM daily_cloud_costs
		WHERE date_trunc('month', record_date) = date_trunc('month', CURRENT_DATE);
	`
	var total float64
	if err := db.QueryRow(query).Scan(&total); err != nil {
		return 0
	}
	return total
}

// ---------------------------------------------------------
// 2. กลุ่มฟังก์ชัน Savings (การประหยัดจากระบบ Sweeper)
// ---------------------------------------------------------

func get7DaysSavings(db *sql.DB) []float64 {
	query := `
		WITH last_7_days AS (
			SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date AS dt
		)
		SELECT COALESCE(SUM(s.saved_cost_per_day), 0)
		FROM last_7_days l
		LEFT JOIN swept_logs s ON l.dt = s.swept_date::date
		GROUP BY l.dt
		ORDER BY l.dt ASC;
	`
	rows, err := db.Query(query)
	if err != nil {
		log.Println("Error querying 7 days savings:", err)
		return make([]float64, 7)
	}
	defer rows.Close()

	var data []float64
	for rows.Next() {
		var val float64
		if err := rows.Scan(&val); err == nil {
			data = append(data, val)
		}
	}
	return data
}

func getMTDSavings(db *sql.DB) float64 {
	query := `
		SELECT COALESCE(SUM(saved_cost_per_day), 0)
		FROM swept_logs
		WHERE date_trunc('month', swept_date) = date_trunc('month', CURRENT_DATE);
	`
	var total float64
	if err := db.QueryRow(query).Scan(&total); err != nil {
		return 0
	}
	return total
}

// ---------------------------------------------------------
// 3. กลุ่มฟังก์ชัน Allocation (สัดส่วนการจัดสรร/Compliance)
// ---------------------------------------------------------

func get7DaysAllocation(db *sql.DB) []float64 {
	query := `
		WITH last_7_days AS (
			SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date AS dt
		)
		SELECT COALESCE(AVG(a.used_percentage), 0)
		FROM last_7_days l
		LEFT JOIN allocation_usage a ON l.dt = a.record_date
		GROUP BY l.dt
		ORDER BY l.dt ASC;
	`
	rows, err := db.Query(query)
	if err != nil {
		log.Println("Error querying 7 days allocation:", err)
		return make([]float64, 7)
	}
	defer rows.Close()

	var data []float64
	for rows.Next() {
		var val float64
		if err := rows.Scan(&val); err == nil {
			data = append(data, val)
		}
	}
	return data
}

// ---------------------------------------------------------
// 4. ฟังก์ชันหลักสำหรับรวบรวมข้อมูลทั้งหมดส่งให้ Handler
// ---------------------------------------------------------

func GetDashboardStats(db *sql.DB) models.DashboardStats {
	var stats models.DashboardStats

	stats.TotalExpenditure = getMTDExpenditure(db)
	stats.ExpData = get7DaysExpenditure(db)

	stats.TotalSavings = getMTDSavings(db)
	stats.SavData = get7DaysSavings(db)

	stats.AllocData = get7DaysAllocation(db)
	if len(stats.AllocData) > 0 {
		stats.UsedAllocation = stats.AllocData[len(stats.AllocData)-1]
	} else {
		stats.UsedAllocation = 0
	}

	return stats
}