package services

import (
	"database/sql"
	"log"
	"automated-lifecycle/backend/internal/models" // ปรับ path ให้ตรงกับโปรเจกต์ของคุณ
)

// 1. ดึงข้อมูลกราฟเส้น 7 วันย้อนหลังของค่าใช้จ่าย (Expenditure)
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
		return make([]float64, 7) // คืนค่าอาเรย์ 0 ป้องกันกราฟพัง
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

// 2. ดึงยอดสะสมเดือนปัจจุบัน (MTD Expenditure)
func getMTDExpenditure(db *sql.DB) float64 {
	query := `
		SELECT COALESCE(SUM(total_cost), 0)
		FROM daily_cloud_costs
		WHERE date_trunc('month', record_date) = date_trunc('month', CURRENT_DATE);
	`
	var total float64
	err := db.QueryRow(query).Scan(&total)
	if err != nil {
		return 0
	}
	return total
}

// 3. ฟังก์ชันหลักสำหรับรวบรวมข้อมูลทั้งหมดส่งให้ Handler
func GetDashboardStats(db *sql.DB) models.DashboardStats {
	var stats models.DashboardStats

	// ดึงข้อมูลค่าใช้จ่าย
	stats.TotalExpenditure = getMTDExpenditure(db)
	stats.ExpData = get7DaysExpenditure(db)

	// ตัวอย่างข้อมูล Savings และ Allocation (สามารถปรับเปลี่ยนเป็น Query จากตารางจริงได้ในลักษณะเดียวกัน)
	stats.TotalSavings = 3900.00
	stats.SavData = []float64{5000, 4800, 4900, 4500, 4200, 4000, 3900}

	stats.AllocData = []float64{60, 62, 65, 64, 70, 75, 78}
	if len(stats.AllocData) > 0 {
		stats.UsedAllocation = stats.AllocData[len(stats.AllocData)-1] // ดึงค่าล่าสุดมาแสดงผล
	}

	return stats
}