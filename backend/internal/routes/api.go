package routes

import (
	"net/http"
	"automated-lifecycle/backend/internal/handlers"
	"database/sql"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc  {
	
			return  func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Access-Control-Allow-Origin","*")
					w.Header().Set("Access-Control-Allow-Methods","GET, POST, OPTIONS, PUT, DELETE")
					w.Header().Set("Access-Control-Allow-Headers","Content-type,Authorization")
			

				if r.Method =="OPTIONS" {
					w.WriteHeader(http.StatusOK)
					return 
				}
				next(w,r)
			}
	}

	func Routes(db *sql.DB) *http.ServeMux {
			mux := http.NewServeMux()

			mux.HandleFunc("/api/resources",corsMiddleware(handlers.GetAllResourcesHandler))
			mux.HandleFunc("/api/charges", corsMiddleware(handlers.GetChargesHandler(db)))
			mux.HandleFunc("/api/scan",corsMiddleware(handlers.RunSweeperHandler))
			mux.HandleFunc("/api/Reports",corsMiddleware(handlers.GetReportsHandler))
			mux.HandleFunc("/api/charges/upload", corsMiddleware(handlers.CreateChargeWithImageHandler(db)))
			mux.HandleFunc("/api/dashboard-stats", corsMiddleware(handlers.DashboardStatsHandler(db)))
			return  mux

	}
