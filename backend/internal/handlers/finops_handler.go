package handlers

import (
	"automated-lifecycle/backend/internal/services/finance"
	"automated-lifecycle/backend/internal/services/ops"
	"automated-lifecycle/backend/internal/services/cloud"
	"database/sql" // อย่าลืม import database/sql
	"encoding/json"
	"net/http"
)

func DashboardStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// เรียกใช้ Service ที่เราเขียนไว้ก่อนหน้านี้
		stats := finance.GetDashboardStats(db)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		
		if err := json.NewEncoder(w).Encode(stats); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

// แก้ไขให้ GetChargesHandler รับค่า db และรีเทิร์น http.HandlerFunc กลับไป
func GetChargesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}
		charges := finance.GetRecentCharges(db)
		w.Header().Set("Content-Type", "application/json")
		
		// ส่งข้อมูลกลับไปให้ Frontend
		json.NewEncoder(w).Encode(charges)
	}
}

// 1. Resources ทั้งหมด
func GetAllResourcesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		// ต้องส่ง db ไปให้ service ด้วย เพื่อเอาไป Query หาอีเมล
		resources := ops.GetAllResources(db)
		
		w.Header().Set("Access-Control-Allow-Origin", "*") 
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resources)
	}
}

// 3. ดึงรายงานภาพรวม (ROI & NPV) สำหรับหน้า Dashboard
func GetReportsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}

		// ดึงข้อมูล Resource ทั้งหมดโดยส่ง db เข้าไป
		resources := ops.GetAllResources(db)

		roiData := finance.CalROI(resources)
		npvData := finance.CalNPVPerInstance(resources, 0.05)

		Response := map[string]interface{}{
			"status":       "success",
			"roi_summary":  roiData,
			"npv_analysis": npvData,
		}

		w.Header().Set("Access-Control-Allow-Origin", "*") 
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(Response)
	}
}

func CreateChargeWithImageHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. กำหนดขนาดไฟล์สูงสุดที่รับได้ (เช่น 10 MB)
		err := r.ParseMultipartForm(10 << 20) 
		if err != nil {
			http.Error(w, "Unable to parse form", http.StatusBadRequest)
			return
		}

		
		file, header, err := r.FormFile("icon_file")
		if err != nil {
			http.Error(w, "Error retrieving the file", http.StatusBadRequest)
			return
		}
		defer file.Close()

	
		imageUrl, err := cloud.UploadImageToS3(file, header.Filename)
		if err != nil {
			http.Error(w, "Failed to upload to S3", http.StatusInternalServerError)
			return
		}

	
		id := r.FormValue("id")
		provider := r.FormValue("provider")
		usage := r.FormValue("usage")

		
		query := `
			INSERT INTO recent_charges (id, provider, icon, usage) 
			VALUES ($1, $2, $3, $4)
		`
		_, err = db.Exec(query, id, provider, imageUrl, usage)
		if err != nil {
			http.Error(w, "Failed to insert into database", http.StatusInternalServerError)
			return
		}

	
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message":   "Upload and insert successful!",
			"image_url": imageUrl,
		})
	}
}

