package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"automated-lifecycle/backend/internal/services/cloud"
)

// GetAnomaliesHandler returns ML-detected cost anomalies from AWS Cost Explorer
func GetAnomaliesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.Method != http.MethodGet {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		summary, err := cloud.GetCostAnomalies(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(summary)
	}
}

// GetSavingsPlansRecommendationsHandler returns AWS Savings Plans recommendations
func GetSavingsPlansRecommendationsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.Method != http.MethodGet {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		summary, err := cloud.GetSavingsPlansRecommendations(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(summary)
	}
}


