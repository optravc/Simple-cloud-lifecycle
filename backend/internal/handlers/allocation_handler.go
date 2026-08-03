package handlers

import (
	"automated-lifecycle/backend/internal/services/finance"
	"automated-lifecycle/backend/internal/services/cloud"
	"database/sql"
	"encoding/json"
	"net/http"
)

func GetCostAllocationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}

		selectedDept := finance.NormalizeAllocationFilter(r.URL.Query().Get("department"), "All")
		tagFilter := finance.NormalizeAllocationFilter(r.URL.Query().Get("tag"), "All")

		response, err := finance.GetCostAllocationData(r.Context(), db, selectedDept, tagFilter)
		if err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func TriggerCostSyncHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}

		err := cloud.SyncAWSCostData(db)
		if err != nil {
			http.Error(w, "Failed to sync AWS Cost: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "AWS Cost sync completed successfully"}`))
	}
}

func GetProjectBreakdownHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}

		projectID := r.URL.Query().Get("id")
		if projectID == "" {
			http.Error(w, "Missing project id parameter", http.StatusBadRequest)
			return
		}

		breakdown, err := finance.GetProjectServiceBreakdown(r.Context(), db, projectID)
		if err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(breakdown)
	}
}