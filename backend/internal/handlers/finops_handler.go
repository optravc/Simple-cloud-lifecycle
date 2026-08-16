package handlers

import (
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/finance"
	"automated-lifecycle/backend/internal/services/ops"
	"database/sql"
	"encoding/json"
	"net/http"
)

// handleGetReports processes the GET request for FinOps reports
func handleGetReports(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	resources := ops.GetAllResources(r.Context(), db)

	roiData := finance.CalROI(resources)
	npvData := finance.CalNPVPerInstance(resources, 0.05)
	trendData, err := finance.GetCostTrendData(db)
	if err != nil {
		trendData = []finance.TrendItem{}
	}
	scheduledReports, err := finance.GetScheduledReports(db)
	if err != nil {
		scheduledReports = []finance.ScheduledReport{}
	}

	Response := map[string]interface{}{
		"status":            "success",
		"roi_summary":       roiData,
		"npv_analysis":      npvData,
		"cost_trend":        trendData,
		"scheduled_reports": scheduledReports,
	}

	writeJSONResponse(w, http.StatusOK, Response)
}

// handlePostReports processes the POST request to toggle scheduled report status
func handlePostReports(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var req struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeHTTPError(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.ID == "" || req.Status == "" {
		writeHTTPError(w, "missing id or status", http.StatusBadRequest)
		return
	}

	err := finance.UpdateScheduledReportStatus(db, req.ID, req.Status)
	if err != nil {
		writeHTTPError(w, "failed to update status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSONResponse(w, http.StatusOK, map[string]string{
		"status":  "success",
		"message": "Status updated successfully",
	})
}

// DashboardStatsHandler fetches high-level dashboard metrics
func DashboardStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats := finance.GetDashboardStats(db)
		writeJSONResponse(w, http.StatusOK, stats)
	}
}

// GetChargesHandler fetches cloud charges
func GetChargesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}
		charges := finance.GetRecentCharges(db)
		writeJSONResponse(w, http.StatusOK, charges)
	}
}

// GetAllResourcesHandler fetches active cloud resources list
func GetAllResourcesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}
		resources := ops.GetAllResources(r.Context(), db)
		writeJSONResponse(w, http.StatusOK, resources)
	}
}

// GetReportsHandler handles GET (reporting) and POST (reports management)
func GetReportsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleGetReports(w, r, db)
			return
		}
		if r.Method == http.MethodPost {
			handlePostReports(w, r, db)
			return
		}
		writeHTTPError(w, notAllowedMsg, http.StatusMethodNotAllowed)
	}
}

// CreateChargeWithImageHandler uploads charge icon to S3 and inserts database log
func CreateChargeWithImageHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. กำหนดขนาดไฟล์สูงสุดที่รับได้ (เช่น 10 MB)
		err := r.ParseMultipartForm(10 << 20) 
		if err != nil {
			writeHTTPError(w, "Unable to parse form", http.StatusBadRequest)
			return
		}
		
		file, header, err := r.FormFile("icon_file")
		if err != nil {
			writeHTTPError(w, "Error retrieving the file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		imageUrl, err := cloud.UploadImageToS3(r.Context(), file, header.Filename)
		if err != nil {
			writeHTTPError(w, "Failed to upload to S3", http.StatusInternalServerError)
			return
		}

		id := r.FormValue("id")
		provider := r.FormValue("provider")
		usage := r.FormValue("usage")

		// Validate required fields
		if id == "" || provider == "" {
			writeHTTPError(w, "missing required fields: id and provider are required", http.StatusBadRequest)
			return
		}

		query := `
			INSERT INTO recent_charges (id, provider, icon, usage) 
			VALUES ($1, $2, $3, $4)
		`
		_, err = db.Exec(query, id, provider, imageUrl, usage)
		if err != nil {
			writeHTTPError(w, "Failed to insert into database", http.StatusInternalServerError)
			return
		}

		writeJSONResponse(w, http.StatusCreated, map[string]string{
			"message":   "Upload and insert successful!",
			"image_url": imageUrl,
		})
	}
}

// GetInvoicesHandler fetches invoices from database and returns as JSON
func GetInvoicesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}
		invoices, err := finance.GetInvoicesFromDB(db)
		if err != nil {
			writeHTTPError(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSONResponse(w, http.StatusOK, invoices)
	}
}
