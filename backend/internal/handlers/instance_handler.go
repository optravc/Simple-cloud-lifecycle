package handlers

import (
	"automated-lifecycle/backend/internal/middleware"
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/ops"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type createInstanceReq struct {
	Name         string `json:"name"`
	InstanceType string `json:"instance_type"`
	Environment  string `json:"environment"`
	LeaseDays    int    `json:"lease_days"` // 0 = permanent, 7, 14
	Team         string `json:"team"`
	Description  string `json:"description"`
}

// validateInstanceCreationRestrictions validates instance types and lease periods based on role rules
func validateInstanceCreationRestrictions(userRole string, reqInstanceType string, leaseDays *int) error {
	allowedTypes := map[string]bool{
		"t3.nano": true, "t3.micro": true, "t3.small": true,
		"c7i-flex.large": true, "m7i-flex.large": true, "t3.medium": true,
	}
	if userRole != "admin" && userRole != "finops" && !allowedTypes[reqInstanceType] {
		return fmt.Errorf("Forbidden: Invalid instance type requested")
	}
	if userRole != "admin" && userRole != "finops" && *leaseDays <= 0 {
		*leaseDays = 7
	}
	return nil
}

// fetchTeamDetailsForCreation fetches associated owner, department and project ID for tagging EC2 creation
func fetchTeamDetailsForCreation(db *sql.DB, teamName, userDept string) (string, string, string) {
	var ownerEmail string
	var teamDeptName string
	var teamDeptID int
	err := db.QueryRow(`
		SELECT t.contact_email, d.name, t.department_id 
		FROM teams t
		JOIN departments d ON t.department_id = d.id
		WHERE LOWER(t.team_name) = LOWER($1)
	`, teamName).Scan(&ownerEmail, &teamDeptName, &teamDeptID)

	if err != nil {
		ownerEmail = "unknown@enterprise.com"
		teamDeptName = userDept
	}

	projectID := "PRJ-001"
	if teamDeptID > 0 {
		_ = db.QueryRow("SELECT id FROM projects WHERE department_id = $1 LIMIT 1", teamDeptID).Scan(&projectID)
	}

	return ownerEmail, teamDeptName, projectID
}

// parseAndValidateCreateRequest decodes the create requests and checks for missing fields
func parseAndValidateCreateRequest(r *http.Request) (createInstanceReq, error) {
	var req createInstanceReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return req, fmt.Errorf("bad request: %w", err)
	}
	if req.Name == "" || req.InstanceType == "" || req.Environment == "" || req.Team == "" {
		return req, fmt.Errorf("missing required fields")
	}
	return req, nil
}

// createLeaseTracking saves lease details in sweep_tracking database table
func createLeaseTracking(db *sql.DB, leaseDays int, instanceID, name, ownerEmail string) error {
	if leaseDays <= 0 {
		return nil
	}
	deadline := time.Now().AddDate(0, 0, leaseDays)
	_, err := db.Exec(`
		INSERT INTO sweep_tracking (instance_id, instance_name, owner_email, status, deadline_at)
		VALUES ($1, $2, $3, 'LEASED', $4)
		ON CONFLICT (instance_id) DO UPDATE SET status = 'LEASED', deadline_at = $4
	`, instanceID, name, ownerEmail, deadline)
	return err
}

// StartInstanceHandler - สั่งเปิดเครื่อง EC2
// Route: POST /api/resources/start
func StartInstanceHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		var req struct {
			InstanceID string `json:"instance_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.InstanceID == "" {
			writeHTTPError(w, "bad request: missing instance_id", http.StatusBadRequest)
			return
		}

		// ดึงข้อมูลทรัพยากรทั้งหมดตามสิทธิ์ของผู้ใช้นี้เพื่อเช็คสิทธิ์การเข้าถึง
		resources := ops.GetAllResources(r.Context(), db)
		var targetResource *models.CloudResource
		for i := range resources {
			if resources[i].ID == req.InstanceID {
				targetResource = &resources[i]
				break
			}
		}

		if targetResource == nil {
			writeHTTPError(w, forbiddenManageMsg, http.StatusForbidden)
			return
		}

		// สั่งเปิดเครื่อง
		err := cloud.StartEC2Instance(r.Context(), req.InstanceID)
		if err != nil {
			writeHTTPError(w, "failed to start instance: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// บันทึก Log ลง audit_logs
		userEmail := middleware.GetUserEmail(r.Context())
		ipAddress := parseClientIP(r.RemoteAddr)
		details := fmt.Sprintf("Started EC2 instance %s (%s)", targetResource.Name, req.InstanceID)
		writeAuditLog(db, userEmail, "START_RESOURCE", req.InstanceID, details, ipAddress)

		writeJSONResponse(w, http.StatusOK, map[string]string{
			"status":  "success",
			"message": fmt.Sprintf("Instance %s started successfully", req.InstanceID),
		})
	}
}

// StopInstanceHandler - สั่งปิดเครื่อง EC2
// Route: POST /api/resources/stop
func StopInstanceHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		var req struct {
			InstanceID string `json:"instance_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.InstanceID == "" {
			writeHTTPError(w, "bad request: missing instance_id", http.StatusBadRequest)
			return
		}

		// ดึงข้อมูลทรัพยากรทั้งหมดตามสิทธิ์ของผู้ใช้นี้เพื่อเช็คสิทธิ์การเข้าถึง
		resources := ops.GetAllResources(r.Context(), db)
		var targetResource *models.CloudResource
		for i := range resources {
			if resources[i].ID == req.InstanceID {
				targetResource = &resources[i]
				break
			}
		}

		if targetResource == nil {
			writeHTTPError(w, forbiddenManageMsg, http.StatusForbidden)
			return
		}

		// สั่งปิดเครื่อง
		err := cloud.StopEC2Instance(r.Context(), req.InstanceID)
		if err != nil {
			writeHTTPError(w, "failed to stop instance: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// บันทึก Log ลง audit_logs
		userEmail := middleware.GetUserEmail(r.Context())
		ipAddress := parseClientIP(r.RemoteAddr)
		details := fmt.Sprintf("Stopped EC2 instance %s (%s)", targetResource.Name, req.InstanceID)
		writeAuditLog(db, userEmail, "STOP_RESOURCE", req.InstanceID, details, ipAddress)

		writeJSONResponse(w, http.StatusOK, map[string]string{
			"status":  "success",
			"message": fmt.Sprintf("Instance %s stopped successfully", req.InstanceID),
		})
	}
}

// CreateInstanceHandler - สั่งสร้างเครื่อง EC2 ใหม่และจัดตั้งสัญญาเช่า
// Route: POST /api/resources/create
func CreateInstanceHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		userRole := middleware.GetUserRole(r.Context())
		userDept := middleware.GetUserDept(r.Context())

		req, err := parseAndValidateCreateRequest(r)
		if err != nil {
			writeHTTPError(w, err.Error(), http.StatusBadRequest)
			return
		}

		if errRule := validateInstanceCreationRestrictions(userRole, req.InstanceType, &req.LeaseDays); errRule != nil {
			writeHTTPError(w, errRule.Error(), http.StatusForbidden)
			return
		}

		ownerEmail, teamDeptName, projectID := fetchTeamDetailsForCreation(db, req.Team, userDept)

		// 4. สั่งจองและสร้างเครื่องบน AWS โดยระบุ ProjectID ของแผนกไปเป็น Tag
		instanceID, err := cloud.CreateEC2Instance(r.Context(), cloud.CreateEC2InstanceInput{
			Name:         req.Name,
			InstanceType: req.InstanceType,
			Environment:  req.Environment,
			OwnerTeam:    req.Team,
			OwnerDept:    teamDeptName,
			ProjectID:    projectID,
			Description:  req.Description,
		})
		if err != nil {
			writeHTTPError(w, "failed to launch instance on AWS: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// 5. บันทึกข้อมูลลงตาราง Tracking สัญญาเช่า (เฉพาะกรณีหมดอายุ)
		err = createLeaseTracking(db, req.LeaseDays, instanceID, req.Name, ownerEmail)
		if err != nil {
			log.Printf("[Lease Error] Failed to write tracking for %s: %v\n", instanceID, err)
		}

		// 6. บันทึกประวัติลง audit_logs
		userEmailFromContext := middleware.GetUserEmail(r.Context())
		ipAddress := parseClientIP(r.RemoteAddr)
		details := fmt.Sprintf("Launched new EC2 instance %s (%s) with lease %d days", req.Name, instanceID, req.LeaseDays)
		writeAuditLog(db, userEmailFromContext, "LAUNCH_RESOURCE", instanceID, details, ipAddress)

		writeJSONResponse(w, http.StatusOK, map[string]string{
			"status":      "success",
			"instance_id": instanceID,
			"message":     fmt.Sprintf("Server %s created successfully with lease", req.Name),
		})
	}
}

// ExtendLeaseHandler - สั่งต่ออายุสัญญาเช่าเครื่อง
// Route: POST /api/resources/extend
func ExtendLeaseHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		var req struct {
			InstanceID string `json:"instance_id"`
			Days       int    `json:"days"` // จำนวนวันที่ขอเพิ่ม
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.InstanceID == "" || req.Days <= 0 {
			writeHTTPError(w, "bad request", http.StatusBadRequest)
			return
		}

		// ตรวจสอบสิทธิ์การเข้าถึงเครื่องตามแผนกของผู้ใช้ก่อน
		resources := ops.GetAllResources(r.Context(), db)
		var targetResource *models.CloudResource
		for i := range resources {
			if resources[i].ID == req.InstanceID {
				targetResource = &resources[i]
				break
			}
		}

		if targetResource == nil {
			writeHTTPError(w, forbiddenManageMsg, http.StatusForbidden)
			return
		}

		// คำนวณวันเดดไลน์ใหม่
		newDeadline := time.Now().AddDate(0, 0, req.Days)

		// อัปเดตตาราง tracking
		_, err := db.Exec(`
			INSERT INTO sweep_tracking (instance_id, instance_name, owner_email, status, deadline_at)
			VALUES ($1, $2, $3, 'LEASED', $4)
			ON CONFLICT (instance_id) 
			DO UPDATE SET status = 'LEASED', deadline_at = $4
		`, req.InstanceID, targetResource.Name, targetResource.OwnerEmail, newDeadline)

		if err != nil {
			writeHTTPError(w, "failed to update lease deadline: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// บันทึก Log ลง audit_logs
		userEmail := middleware.GetUserEmail(r.Context())
		ipAddress := parseClientIP(r.RemoteAddr)
		details := fmt.Sprintf("Extended lease for instance %s (%s) by %d days", targetResource.Name, req.InstanceID, req.Days)
		writeAuditLog(db, userEmail, "EXTEND_LEASE", req.InstanceID, details, ipAddress)

		writeJSONResponse(w, http.StatusOK, map[string]string{
			"status":  "success",
			"message": fmt.Sprintf("Lease extended successfully to %s", newDeadline.Format("2006-01-02")),
		})
	}
}
