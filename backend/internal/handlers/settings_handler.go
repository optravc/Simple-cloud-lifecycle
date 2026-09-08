package handlers

import (
	"automated-lifecycle/backend/internal/services/ops"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
)

// GetSettingsHandler - returns current system settings including idle_threshold_days and finance configs
// Route: GET /api/settings
func GetSettingsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		threshold := ops.GetEffectiveThreshold(db)
		systemCostPerDay := ops.GetSettingFloat64(db, "system_cost_per_day", 5.0)
		npvDiscountRate := ops.GetSettingFloat64(db, "npv_discount_rate", 0.05)

		response := map[string]interface{}{
			"idle_threshold_days":  threshold,
			"system_cost_per_day": systemCostPerDay,
			"npv_discount_rate":   npvDiscountRate,
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

		if req.IdleThresholdDays < 0 || req.IdleThresholdDays > 365 {
			writeHTTPError(w, "idle_threshold_days must be between 0 and 365 days", http.StatusBadRequest)
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

type UpdateFinanceSettingsRequest struct {
	SystemCostPerDay *float64 `json:"system_cost_per_day"`
	NPVDiscountRate  *float64 `json:"npv_discount_rate"`
}

// UpdateFinanceSettingsHandler - updates finance config values (system_cost_per_day, npv_discount_rate)
// Route: PUT /api/settings/finance
func UpdateFinanceSettingsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPut) {
			return
		}

		var req UpdateFinanceSettingsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeHTTPError(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		updated := map[string]interface{}{}

		if req.SystemCostPerDay != nil {
			if *req.SystemCostPerDay < 0 {
				writeHTTPError(w, "system_cost_per_day must be >= 0", http.StatusBadRequest)
				return
			}
			valStr := strconv.FormatFloat(*req.SystemCostPerDay, 'f', 4, 64)
			_, err := db.Exec(`
				INSERT INTO system_settings (key, value, description)
				VALUES ('system_cost_per_day', $1, 'Daily operating cost of the FinOps platform (USD)')
				ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW();
			`, valStr)
			if err != nil {
				writeHTTPError(w, "failed to update system_cost_per_day: "+err.Error(), http.StatusInternalServerError)
				return
			}
			updated["system_cost_per_day"] = *req.SystemCostPerDay
		}

		if req.NPVDiscountRate != nil {
			if *req.NPVDiscountRate < 0 || *req.NPVDiscountRate > 1 {
				writeHTTPError(w, "npv_discount_rate must be between 0 and 1 (e.g. 0.05 = 5%)", http.StatusBadRequest)
				return
			}
			valStr := strconv.FormatFloat(*req.NPVDiscountRate, 'f', 6, 64)
			_, err := db.Exec(`
				INSERT INTO system_settings (key, value, description)
				VALUES ('npv_discount_rate', $1, 'Annual discount rate for NPV calculation')
				ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW();
			`, valStr)
			if err != nil {
				writeHTTPError(w, "failed to update npv_discount_rate: "+err.Error(), http.StatusInternalServerError)
				return
			}
			updated["npv_discount_rate"] = *req.NPVDiscountRate
		}

		if len(updated) == 0 {
			writeHTTPError(w, "no valid fields to update", http.StatusBadRequest)
			return
		}

		writeJSONResponse(w, http.StatusOK, map[string]interface{}{
			"message": "Finance settings updated successfully",
			"updated": updated,
		})
	}
}
