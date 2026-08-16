package handlers

import (
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/finance"
	"database/sql"
	"net/http"
)

// GetCostAllocationHandler retrieves cost allocation data
func GetCostAllocationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		selectedDept := finance.NormalizeAllocationFilter(r.URL.Query().Get("department"), "All")
		tagFilter := finance.NormalizeAllocationFilter(r.URL.Query().Get("tag"), "All")

		response, err := finance.GetCostAllocationData(r.Context(), db, selectedDept, tagFilter)
		if err != nil {
			writeHTTPError(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		writeJSONResponse(w, http.StatusOK, response)
	}
}

// TriggerCostSyncHandler triggers manual AWS Cost Explorer data sync
func TriggerCostSyncHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		err := cloud.SyncAWSCostData(r.Context(), db)
		if err != nil {
			writeHTTPError(w, "Failed to sync AWS Cost: "+err.Error(), http.StatusInternalServerError)
			return
		}

		writeJSONResponse(w, http.StatusOK, map[string]string{
			"message": "AWS Cost sync completed successfully",
		})
	}
}

// GetProjectBreakdownHandler fetches service breakdown data for a specific project ID
func GetProjectBreakdownHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		projectID := r.URL.Query().Get("id")
		if projectID == "" {
			writeHTTPError(w, "Missing project id parameter", http.StatusBadRequest)
			return
		}

		breakdown, err := finance.GetProjectServiceBreakdown(r.Context(), db, projectID)
		if err != nil {
			writeHTTPError(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		writeJSONResponse(w, http.StatusOK, breakdown)
	}
}