package handlers

import (
	"automated-lifecycle/backend/internal/services/finance"
	"database/sql"
	"encoding/json"
	"net/http"
)

// GetBudgetsHandler returns the cloud budget dashboard metrics
func GetBudgetsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		data, err := finance.GetBudgetsData(r.Context(), db)
		if err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

// UpdateBudgetHandler updates a department's budget
func UpdateBudgetHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			ID     int     `json:"id"`
			Budget float64 `json:"budget"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request payload: "+err.Error(), http.StatusBadRequest)
			return
		}

		if req.ID <= 0 || req.Budget < 0 {
			http.Error(w, "Missing or invalid parameters: id and positive budget required", http.StatusBadRequest)
			return
		}

		err := finance.UpdateDepartmentBudget(db, req.ID, req.Budget)
		if err != nil {
			http.Error(w, "Failed to update budget: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "success",
			"message": "Department budget updated successfully",
		})
	}
}
