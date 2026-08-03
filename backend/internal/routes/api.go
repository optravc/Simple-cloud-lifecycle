package routes

import (
	"database/sql"
	"log"
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
	// 1. เรียก InitJWKS เพื่อโหลดคีย์จาก AWS Cognito ตอนที่เซิร์ฟเวอร์เริ่มทำงาน
	if err := middleware.InitJWKS(); err != nil {
		log.Fatalf("Failed to initialize AWS Cognito JWKS: %v", err)
	}

	mux := http.NewServeMux()

	// 2. ครอบ Routes ด้วย corsMiddleware ซ้อนกับ AuthMiddleware
	// รูปแบบ: corsMiddleware(middleware.AuthMiddleware(handler))

	mux.HandleFunc("/api/resources", corsMiddleware(middleware.AuthMiddleware(handlers.GetAllResourcesHandler(db))))
	mux.HandleFunc("/api/charges", corsMiddleware(middleware.AuthMiddleware(handlers.GetChargesHandler(db))))
	mux.HandleFunc("/api/Reports", corsMiddleware(middleware.AuthMiddleware(handlers.GetReportsHandler(db))))
	mux.HandleFunc("/api/cost-allocation", corsMiddleware(middleware.AuthMiddleware(handlers.GetCostAllocationHandler(db))))
	mux.HandleFunc("/api/project-breakdown", corsMiddleware(middleware.AuthMiddleware(handlers.GetProjectBreakdownHandler(db))))
	mux.HandleFunc("/api/charges/upload", corsMiddleware(middleware.AuthMiddleware(handlers.CreateChargeWithImageHandler(db))))
	mux.HandleFunc("/api/dashboard-stats", corsMiddleware(middleware.AuthMiddleware(handlers.DashboardStatsHandler(db))))
	mux.HandleFunc("/api/sync-costs", corsMiddleware(middleware.AuthMiddleware(handlers.TriggerCostSyncHandler(db))))
	
	// --- [Engineering / Sweeper Handlers] ---
	mux.HandleFunc("/api/scan", corsMiddleware(middleware.AuthMiddleware(handlers.RunSweeperHandler(db))))
	mux.HandleFunc("/api/resolve", corsMiddleware(middleware.AuthMiddleware(handlers.ResolveSweepHandler(db))))

	// (Optional) เปิด API บางเส้นให้เข้าถึงได้โดยไม่ต้อง Login เช่น /api/health
	mux.HandleFunc("/api/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Service is running"))
	}))

	return mux
}