package routes

import (
	"database/sql"
	"net/http"

	"automated-lifecycle/backend/internal/handlers"
	"automated-lifecycle/backend/internal/middleware"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-type,Authorization")

		// ให้ OPTIONS ผ่านไปเลยโดยไม่ต้องเช็ค Token (สำคัญมากสำหรับการทำ API ข้ามโดเมน)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func Routes(db *sql.DB) *http.ServeMux {
	mux := http.NewServeMux()

	// 2. ครอบ Routes ด้วย corsMiddleware ซ้อนกับ AuthMiddleware และ RequireRole
	// รูปแบบ: corsMiddleware(middleware.AuthMiddleware(middleware.RequireRole([]string{...}, handler)))

	// ทุกบทบาทเว้นแต่ Finance ที่ห้ามเข้า Manage/Resources
	mux.HandleFunc("/api/resources", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead", "dev"}, handlers.GetAllResourcesHandler(db)),
	)))
	mux.HandleFunc("/api/resources/history", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead", "dev"}, handlers.GetTerminatedHistoryHandler(db)),
	)))

	// สิทธิ์การตรวจสอบค่าใช้จ่าย สำหรับ Admin, Finance, FinOps
	mux.HandleFunc("/api/charges", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops"}, handlers.GetChargesHandler(db)),
	)))

	// รายงานสำหรับ Admin, Finance, FinOps และ Lead (รองรับทั้งตัวพิมพ์เล็กและตัวพิมพ์ใหญ่)
	reportsHandler := corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead"}, handlers.GetReportsHandler(db)),
	))
	mux.HandleFunc("/api/Reports", reportsHandler)
	mux.HandleFunc("/api/reports", reportsHandler)

	// การแบ่งจ่ายค่าส่วนกลาง สำหรับ Admin, Finance, FinOps, Lead
	mux.HandleFunc("/api/cost-allocation", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead"}, handlers.GetCostAllocationHandler(db)),
	)))
	mux.HandleFunc("/api/project-breakdown", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead"}, handlers.GetProjectBreakdownHandler(db)),
	)))

	// อัปโหลดบิล/จัดการค่าใช้จ่าย สำหรับ Admin, Finance (FinOps ดูได้อย่างเดียวผ่านปุ่มอื่น)
	mux.HandleFunc("/api/charges/upload", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance"}, handlers.CreateChargeWithImageHandler(db)),
	)))

	// หน้า Dashboard Stats สามารถเข้าดูได้ทุกบทบาท เพื่อแสดงหน้า Dashboard
	mux.HandleFunc("/api/dashboard-stats", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead", "dev"}, handlers.DashboardStatsHandler(db)),
	)))

	// สั่งซิงค์บิลการเงินภายนอก สำหรับ Admin, Finance, FinOps
	mux.HandleFunc("/api/sync-costs", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops"}, handlers.TriggerCostSyncHandler(db)),
	)))
	mux.HandleFunc("/api/invoices", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops"}, handlers.GetInvoicesHandler(db)),
	)))
	
	// --- [Performance / Monitoring] ---
	// ข้อมูลมอนิเตอร์มุ่งเน้นที่ Admin, FinOps, Lead, Dev (Finance บัญชีไม่เข้าหน้านี้)
	mux.HandleFunc("/api/performance", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead", "dev"}, handlers.PerformanceHandler(db)),
	)))

	// --- [Budgets & Governance] ---
	// ดูงบประมาณได้ทั้ง Admin, Finance, FinOps, Lead
	mux.HandleFunc("/api/budgets", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead"}, handlers.GetBudgetsHandler(db)),
	)))
	// แก้ไขปรับปรุงงบประมาณได้เฉพาะ Admin, Finance, และ FinOps เท่านั้น
	mux.HandleFunc("/api/budgets/update", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops"}, handlers.UpdateBudgetHandler(db)),
	)))

	// --- [Engineering / Sweeper Handlers] ---
	// สั่งสแกน/แก้ไข สิทธิ์สำหรับผู้ดูแล Admin, FinOps และ Dev Lead

	// Dry Run: สแกนหาเครื่องที่เข้าเกณฑ์ แต่ยังไม่ทำการ flag หรือส่ง email
	mux.HandleFunc("/api/scan", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead"}, handlers.ScanDryRunHandler(db)),
	)))
	// Sweep จริง: flag เครื่อง + บันทึก + ส่ง email แจ้ง owner
	mux.HandleFunc("/api/sweep", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead"}, handlers.RunSweeperHandler(db)),
	)))
	// ดึงจำนวน + รายชื่อ instance ที่อยู่ใน PENDING_SWEEP (รองรับ department filter)
	mux.HandleFunc("/api/pending-sweep", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead"}, handlers.PendingSweepHandler(db)),
	)))
	// URL สำหรับปุ่ม Action Link ในอีเมล (ถอด AuthMiddleware ออกเพราะเป็นลิงก์เปิดตรงจากกล่องอีเมล)
	mux.HandleFunc("/api/resolve", corsMiddleware(handlers.ResolveSweepHandler(db)))

	// จัดการเปิด/ปิดเครื่องแยกตามระดับบทบาท (admin, lead, dev)
	mux.HandleFunc("/api/resources/start", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "lead", "dev"}, handlers.StartInstanceHandler(db)),
	)))
	mux.HandleFunc("/api/resources/stop", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "lead", "dev"}, handlers.StopInstanceHandler(db)),
	)))

	// จัดการจองสร้างเครื่องและการต่ออายุสัญญาเช่า (admin, lead, dev)
	mux.HandleFunc("/api/resources/create", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "lead", "dev"}, handlers.CreateInstanceHandler(db)),
	)))
	mux.HandleFunc("/api/resources/extend", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "lead", "dev"}, handlers.ExtendLeaseHandler(db)),
	)))
	mux.HandleFunc("/api/resources/saved-summary", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead", "dev"}, handlers.GetSavedSummaryHandler(db)),
	)))

	// ดึงข้อมูลทีมตามแผนกของผู้ใช้
	mux.HandleFunc("/api/teams", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead", "dev"}, handlers.GetTeamsHandler(db)),
	)))

	// จัดการแผนกและทีมย่อยในระบบ
	mux.HandleFunc("/api/departments", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops", "lead", "dev"}, handlers.GetDepartmentsHandler(db)),
	)))
	mux.HandleFunc("/api/teams/create", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops"}, handlers.CreateTeamHandler(db)),
	)))



	// AWS Cost Anomaly Detection API
	mux.HandleFunc("/api/anomalies", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead", "dev"}, handlers.GetAnomaliesHandler(db)),
	)))

	// AWS Savings Plans Recommendations API
	mux.HandleFunc("/api/recommendations/savings-plans", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead"}, handlers.GetSavingsPlansRecommendationsHandler(db)),
	)))

	// System Settings API (Dynamic Idle Threshold)
	mux.HandleFunc("/api/settings", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finance", "finops", "lead", "dev"}, handlers.GetSettingsHandler(db)),
	)))
	mux.HandleFunc("/api/settings/idle-threshold", corsMiddleware(middleware.AuthMiddleware(
		middleware.RequireRole([]string{"admin", "finops"}, handlers.UpdateThresholdHandler(db)),
	)))



	// (Optional) เปิด API บางเส้นให้เข้าถึงได้โดยไม่ต้อง Login เช่น /api/health
	mux.HandleFunc("/api/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Service is running"))
	}))

	return mux
}