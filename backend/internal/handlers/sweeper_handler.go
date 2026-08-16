package handlers

import (
	"automated-lifecycle/backend/internal/middleware"
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/ops"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

type PendingItem struct {
	InstanceID   string `json:"instance_id"`
	InstanceName string `json:"instance_name"`
	OwnerEmail   string `json:"owner_email"`
	Deadline     string `json:"deadline_at"`
}

// calculatePotentialSavings calculates total potential daily savings for active idle instances
func calculatePotentialSavings(ctx context.Context, db *sql.DB) float64 {
	resources := ops.GetAllResources(ctx, db)
	var potentialSavingsDaily float64
	threshold := ops.GetEffectiveThreshold()
	for _, res := range resources {
		if res.DayIdle >= threshold && res.Status == "ACTIVE" {
			potentialSavingsDaily += res.CostPerDay
		}
	}
	return potentialSavingsDaily
}

// handleSweepConfirmation terminates instances and archives the lease details
func handleSweepConfirmation(ctx context.Context, db *sql.DB, instanceID string) error {
	var costPerDay float64
	var resourceName string
	var projectID sql.NullString
	
	queryResource := "SELECT name, cost_per_day, project_tag FROM cloud_resources WHERE id = $1"
	err := db.QueryRow(queryResource, instanceID).Scan(&resourceName, &costPerDay, &projectID)
	if err != nil {
		costPerDay = 15.50
		log.Printf("[Resolve] Warning: instance %s not found in cloud_resources: %v\n", instanceID, err)
	}

	err = cloud.TerminateEC2Instances(ctx, []string{instanceID})
	if err != nil {
		return err
	}

	var pID interface{}
	if projectID.Valid {
		pID = projectID.String
	}
	_, err = db.Exec(`
		UPDATE sweep_tracking
		SET status             = 'ARCHIVED',
		    action_taken       = 'terminated',
		    saved_cost_per_day = $2,
		    swept_date         = CURRENT_DATE,
		    project_id         = COALESCE($3, project_id)
		WHERE instance_id = $1
	`, instanceID, costPerDay, pID)
	if err != nil {
		log.Printf("[Resolve] Failed to update sweep_tracking for %s: %v\n", instanceID, err)
	}
	return nil
}

// fetchPendingItemsFromDB retrieves pending sweep tracking records filtered by user department role
func fetchPendingItemsFromDB(db *sql.DB, userRole, userDept string) ([]PendingItem, error) {
	var rows *sql.Rows
	var err error

	if (userRole == "lead" || userRole == "dev") && userDept != "All" && userDept != "" {
		rows, err = db.Query(`
			SELECT DISTINCT st.instance_id, st.instance_name, st.owner_email, st.deadline_at
			FROM sweep_tracking st
			JOIN teams t ON LOWER(t.contact_email) = LOWER(st.owner_email)
			JOIN departments d ON t.department_id = d.id
			WHERE st.status = 'PENDING_SWEEP'
			  AND LOWER(d.name) = LOWER($1)
			ORDER BY st.deadline_at ASC
		`, userDept)
	} else {
		rows, err = db.Query(`
			SELECT instance_id, instance_name, owner_email, deadline_at
			FROM sweep_tracking
			WHERE status = 'PENDING_SWEEP'
			ORDER BY deadline_at ASC
		`)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []PendingItem
	for rows.Next() {
		var item PendingItem
		if scanErr := rows.Scan(&item.InstanceID, &item.InstanceName, &item.OwnerEmail, &item.Deadline); scanErr == nil {
			items = append(items, item)
		}
	}
	if items == nil {
		items = []PendingItem{}
	}
	return items, nil
}

// ScanDryRunHandler - สแกนหาเครื่องที่เข้าเกณฑ์ Idle แต่ยังไม่ทำการ flag หรือส่ง email
// ใช้เป็น Preview ก่อนที่ผู้ใช้จะยืนยัน Sweep จริง
// Route: POST /api/scan
func ScanDryRunHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		// ดึงข้อมูลทรัพยากรทั้งหมดจาก AWS
		resources := ops.GetAllResources(r.Context(), db)

		// Dry Run: แค่นับและรายงาน ไม่ flag ไม่ส่ง email
		idleResources := ops.DryRunScan(resources)
		count := len(idleResources)
		
		var totalSavings float64
		for _, item := range idleResources {
			totalSavings += item.CostPerDay
		}

		response := map[string]interface{}{
			"message":           "Dry run scan completed — no instances were flagged",
			"items_to_sweep":    count,
			"potential_savings": totalSavings,
			"instances":         idleResources,
			"threshold_days":    ops.IDLE_THRESHOLD_DAYS,
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")
		writeJSONResponse(w, http.StatusOK, response)
	}
}

// RunSweeperHandler - สแกนและ flag เครื่องที่ไม่ได้ใช้งาน พร้อมส่ง email แจ้ง owner
// รับ settings จาก body: selections
// Route: POST /api/sweep
func RunSweeperHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		var req struct {
			Selections []ops.SweepSelection `json:"selections"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeHTTPError(w, "bad request: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Validate that selections are not empty before running sweep
		if len(req.Selections) == 0 {
			writeHTTPError(w, "no instances selected for sweep", http.StatusBadRequest)
			return
		}

		// สั่งรันกระบวนการ Sweep ตามรายการที่เลือกส่งมาจากหน้าจอ
		deleteCount, saveCount, sweptNames, err := ops.SweepSelectedInstances(r.Context(), db, req.Selections)
		if err != nil {
			writeHTTPError(w, "sweep failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"message":          "Sweep action processed successfully",
			"items_swept":      deleteCount,
			"saved_cost_daily": saveCount,
			"swept_details":    sweptNames,
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")
		writeJSONResponse(w, http.StatusOK, response)
	}
}

// GetSavedSummaryHandler - ดึงยอดรวมค่าใช้จ่ายที่ประหยัดได้จริงและจำนวนเครื่องที่ลบไปจริง
// Route: GET /api/resources/saved-summary
func GetSavedSummaryHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		var sweptCount int
		var actualSavingsDaily float64

		// 1. นับจำนวนเครื่องทั้งหมดที่ถูก Terminate (ลบจริง)
		err := db.QueryRow("SELECT COUNT(*) FROM sweep_tracking WHERE action_taken = 'terminated'").Scan(&sweptCount)
		if err != nil {
			sweptCount = 0
		}

		// 2. ผลรวมราคาประหยัดต่อวันที่ถูกเซฟไปได้จริง
		err = db.QueryRow("SELECT COALESCE(SUM(saved_cost_per_day), 0) FROM sweep_tracking WHERE action_taken = 'terminated'").Scan(&actualSavingsDaily)
		if err != nil {
			actualSavingsDaily = 0.0
		}

		// 3. คำนวณหาเครื่องที่เข้าเกณฑ์ Idle ในระบบปัจจุบัน
		potentialSavingsDaily := calculatePotentialSavings(r.Context(), db)

		response := map[string]interface{}{
			"swept_count":             sweptCount,
			"actual_savings_daily":    actualSavingsDaily,
			"potential_savings_daily": potentialSavingsDaily,
		}

		writeJSONResponse(w, http.StatusOK, response)
	}
}

// PendingSweepHandler - ดึงจำนวน + รายชื่อเครื่องที่อยู่ใน PENDING_SWEEP จาก DB
// รองรับ department filtering: lead เห็นเฉพาะแผนกตัวเอง, finops/admin เห็นทั้งหมด
// Route: GET /api/pending-sweep
func PendingSweepHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		userRole := middleware.GetUserRole(r.Context())
		userDept := middleware.GetUserDept(r.Context())

		items, err := fetchPendingItemsFromDB(db, userRole, userDept)
		if err != nil {
			writeHTTPError(w, "failed to query pending sweeps: "+err.Error(), http.StatusInternalServerError)
			return
		}

		writeJSONResponse(w, http.StatusOK, map[string]interface{}{
			"pending_count": len(items),
			"instances":     items,
		})
	}
}

// ResolveSweepHandler - รอรับ Action จากปุ่มในอีเมล (Confirm / Cancel)
// Route: GET /api/resolve?id=...&action=...
func ResolveSweepHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		instanceID := r.URL.Query().Get("id")
		action := r.URL.Query().Get("action")

		w.Header().Set("Content-Type", "text/html; charset=utf-8")

		if action == "cancel" {
			if _, err := db.Exec("UPDATE sweep_tracking SET status = 'ACTIVE', deadline_at = NULL WHERE instance_id = $1", instanceID); err != nil {
				log.Printf("[Sweeper] DB error cancelling sweep for instance %s: %v\n", instanceID, err)
			}
			_, _ = w.Write([]byte(fmt.Sprintf("<h2>Cancellation Successful</h2><p>The system has cancelled the sweep for instance %s.</p>", instanceID)))
			return
		}

		if action == "confirm" {
			err := handleSweepConfirmation(r.Context(), db, instanceID)
			if err != nil {
				http.Error(w, "Failed to terminate instance on AWS", http.StatusInternalServerError)
				return
			}

			w.Write([]byte(fmt.Sprintf(`
				<div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
					<h2 style="color: #d9534f;">Terminated Successfully!</h2>
					<p>The system has successfully terminated instance <b>%s</b> on AWS.</p>
					<p>You have successfully saved cloud infrastructure costs!</p>
				</div>
			`, instanceID)))
			return
		}

		http.Error(w, "invalid action", http.StatusBadRequest)
	}
}

type TerminatedHistoryItem struct {
	InstanceID      string    `json:"instance_id"`
	InstanceName    string    `json:"instance_name"`
	OwnerEmail      string    `json:"owner_email"`
	SavedCostPerDay float64   `json:"saved_cost_per_day"`
	ActionTaken     string    `json:"action_taken"`
	ActionAt        time.Time `json:"action_at"`
}

// GetTerminatedHistoryHandler - ดึงประวัติเครื่องที่ถูก Terminate/ลบออกจริงทั้งหมด
// Route: GET /api/resources/history
func GetTerminatedHistoryHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		userRole := middleware.GetUserRole(r.Context())
		userDept := middleware.GetUserDept(r.Context())

		var rows *sql.Rows
		var err error

		if (userRole == "lead" || userRole == "dev") && userDept != "All" && userDept != "" &&
			userRole != "finops" && userRole != "finance" &&
			!strings.Contains(strings.ToLower(userDept), "finops") &&
			!strings.Contains(strings.ToLower(userDept), "finance") {
			rows, err = db.Query(`
				SELECT DISTINCT st.instance_id, COALESCE(st.instance_name, ''), COALESCE(st.owner_email, ''), 
				       COALESCE(st.saved_cost_per_day, 0), COALESCE(st.action_taken, 'terminated'),
				       st.deadline_at
				FROM sweep_tracking st
				JOIN teams t ON LOWER(t.contact_email) = LOWER(st.owner_email)
				JOIN departments d ON t.department_id = d.id
				WHERE (st.action_taken = 'terminated' OR st.status = 'TERMINATED' OR st.status = 'ARCHIVED')
				  AND LOWER(d.name) = LOWER($1)
				ORDER BY st.deadline_at DESC
			`, userDept)
		} else {
			rows, err = db.Query(`
				SELECT instance_id, COALESCE(instance_name, ''), COALESCE(owner_email, ''), 
				       COALESCE(saved_cost_per_day, 0), COALESCE(action_taken, 'terminated'),
				       deadline_at
				FROM sweep_tracking
				WHERE action_taken = 'terminated' OR status = 'TERMINATED' OR status = 'ARCHIVED'
				ORDER BY deadline_at DESC
			`)
		}

		if err != nil {
			log.Printf("[Terminated History Error] DB Query failed: %v\n", err)
			writeHTTPError(w, "failed to query terminated history: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var history []TerminatedHistoryItem
		for rows.Next() {
			var item TerminatedHistoryItem
			var rawDate sql.NullTime
			if scanErr := rows.Scan(&item.InstanceID, &item.InstanceName, &item.OwnerEmail, &item.SavedCostPerDay, &item.ActionTaken, &rawDate); scanErr != nil {
				log.Printf("[Terminated History Warning] Scan error: %v\n", scanErr)
				continue
			}
			if rawDate.Valid {
				item.ActionAt = rawDate.Time
			} else {
				item.ActionAt = time.Now()
			}
			history = append(history, item)
		}

		if history == nil {
			history = []TerminatedHistoryItem{}
		}

		writeJSONResponse(w, http.StatusOK, map[string]interface{}{
			"count":   len(history),
			"history": history,
		})
	}
}