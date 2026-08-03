package handlers

import (
	"automated-lifecycle/backend/internal/services/ops"
	"automated-lifecycle/backend/internal/services/cloud"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

// RunSweeperHandler - สั่งสแกนและจัดการทรัพยากรที่ไม่ได้ใช้งาน
func RunSweeperHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}

		// 1. ดึงข้อมูลทรัพยากรทั้งหมดมาก่อน (ส่ง db เข้าไป)
		resources := ops.GetAllResources(db)

		// 2. ส่งครบทั้ง 2 พารามิเตอร์ (db และ resources) ให้ ScanAndSweep
		deleteCount, saveCount, sweptNames := ops.ScanAndSweep(db, resources)

		response := map[string]interface{}{
			"message":          "Sandbox scan completed",
			"items_swept":      deleteCount,
			"saved_cost_daily": saveCount,
			"swept_details":    sweptNames,
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// ResolveSweepHandler - รอรับ Action จากปุ่มในอีเมล (Confirm / Cancel)
// ResolveSweepHandler - Handles user action from email buttons (Confirm / Cancel)
func ResolveSweepHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "not allowed", http.StatusMethodNotAllowed)
			return
		}

		instanceID := r.URL.Query().Get("id")
		action := r.URL.Query().Get("action")

		w.Header().Set("Content-Type", "text/html; charset=utf-8")

		if action == "cancel" {
			_, _ = db.Exec("UPDATE sweep_tracking SET status = 'ACTIVE', deadline_at = NULL WHERE instance_id = $1", instanceID)
			w.Write([]byte(fmt.Sprintf("<h2>Cancellation Successful</h2><p>The system has cancelled the sweep for instance %s.</p>", instanceID)))
		
		} else if action == "confirm" {
			// 1. Trigger actual AWS termination via SDK
			err := cloud.TerminateEC2Instances([]string{instanceID})
			if err != nil {
				http.Error(w, "Failed to terminate instance on AWS", http.StatusInternalServerError)
				return
			}

			// 2. Update database status to ARCHIVED once terminated on AWS
			_, _ = db.Exec("UPDATE sweep_tracking SET status = 'ARCHIVED' WHERE instance_id = $1", instanceID)
			
			w.Write([]byte(fmt.Sprintf(`
				<div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
					<h2 style="color: #d9534f;">Terminated Successfully!</h2>
					<p>The system has successfully terminated instance <b>%s</b> on AWS.</p>
					<p>You have successfully saved cloud infrastructure costs! </p>
				</div>
			`, instanceID)))
		
		} else {
			http.Error(w, "invalid action", http.StatusBadRequest)
		}
	}
}