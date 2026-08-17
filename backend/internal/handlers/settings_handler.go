package handlers

import (
	"automated-lifecycle/backend/internal/services/ops"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
)

// GetSettingsHandler - returns current system settings including idle_threshold_days
// Route: GET /api/settings
func GetSettingsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		threshold := ops.GetEffectiveThreshold(db)
		response := map[string]interface{}{
			"idle_threshold_days": threshold,
		}

		writeJSONResponse(w, http.StatusOK, response)
	}
}

type UpdateThresholdRequest struct {
	IdleThresholdDays int `json:"idle_threshold_days"`
}

// UpdateThresholdHandler - updates idle_threshold_days in system_settings table
// Route: PUT /api/settings/idle-threshold
func UpdateThresholdHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPut) {
			return
		}

		var req UpdateThresholdRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeHTTPError(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		if req.IdleThresholdDays <= 0 || req.IdleThresholdDays > 365 {
			writeHTTPError(w, "idle_threshold_days must be between 1 and 365 days", http.StatusBadRequest)
			return
		}

		valStr := strconv.Itoa(req.IdleThresholdDays)
		_, err := db.Exec(`
			INSERT INTO system_settings (key, value, description, updated_at)
			VALUES ('idle_threshold_days', $1, 'Minimum idle days before an instance is flagged for sweep', NOW())
			ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW();
		`, valStr)

		if err != nil {
			writeHTTPError(w, "failed to update setting: "+err.Error(), http.StatusInternalServerError)
			return
		}

		writeJSONResponse(w, http.StatusOK, map[string]interface{}{
			"message":             "Idle threshold updated successfully",
			"idle_threshold_days": req.IdleThresholdDays,
		})
	}
}
