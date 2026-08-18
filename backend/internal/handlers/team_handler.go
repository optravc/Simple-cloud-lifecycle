package handlers

import (
	"automated-lifecycle/backend/internal/middleware"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// GetTeamsHandler - ดึงรายชื่อทีมตามแผนกของผู้ใช้ที่ล็อกอินอยู่
// Route: GET /api/teams
func GetTeamsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		userRole := middleware.GetUserRole(r.Context())
		userDept := middleware.GetUserDept(r.Context())

		var rows *sql.Rows
		var err error

		// ถ้าเป็น Admin, FinOps หรือ Finance ให้ดึงทีมทั้งหมด
		if userRole == "admin" || userRole == "finops" || userRole == "finance" ||
			strings.Contains(strings.ToLower(userDept), "finops") ||
			strings.Contains(strings.ToLower(userDept), "finance") {
			rows, err = db.Query(`
				SELECT DISTINCT t.team_name, t.contact_email, d.name 
				FROM teams t
				JOIN departments d ON t.department_id = d.id
				ORDER BY t.team_name ASC
			`)
		} else {
			// ถ้าเป็น Lead หรือ Dev ให้ดึงเฉพาะทีมในแผนกตนเอง
			rows, err = db.Query(`
				SELECT DISTINCT t.team_name, t.contact_email, d.name 
				FROM teams t
				JOIN departments d ON t.department_id = d.id
				WHERE LOWER(d.name) = LOWER($1)
				ORDER BY t.team_name ASC
			`, userDept)
		}

		if err != nil {
			writeHTTPError(w, "failed to query teams: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type TeamItem struct {
			TeamName     string `json:"team_name"`
			ContactEmail string `json:"contact_email"`
			Department   string `json:"department"`
		}

		teams := []TeamItem{}
		for rows.Next() {
			var t TeamItem
			if err := rows.Scan(&t.TeamName, &t.ContactEmail, &t.Department); err == nil {
				teams = append(teams, t)
			}
		}

		writeJSONResponse(w, http.StatusOK, teams)
	}
}

// GetDepartmentsHandler - ดึงรายชื่อแผนกทั้งหมดในฐานข้อมูล
// Route: GET /api/departments
func GetDepartmentsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodGet) {
			return
		}

		rows, err := db.Query("SELECT id, name FROM departments ORDER BY name ASC")
		if err != nil {
			writeHTTPError(w, "failed to query departments: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type DeptItem struct {
			ID   int    `json:"id"`
			Name string `json:"name"`
		}

		depts := []DeptItem{}
		for rows.Next() {
			var d DeptItem
			if err := rows.Scan(&d.ID, &d.Name); err == nil {
				depts = append(depts, d)
			}
		}

		writeJSONResponse(w, http.StatusOK, depts)
	}
}

// CreateTeamHandler - สร้างทีมใหม่ในระบบ (เฉพาะ Admin)
// Route: POST /api/teams/create
func CreateTeamHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !checkMethod(w, r, http.MethodPost) {
			return
		}

		userRole := middleware.GetUserRole(r.Context())
		userDept := middleware.GetUserDept(r.Context())
		if userRole != "admin" && userRole != "finops" && !strings.Contains(strings.ToLower(userDept), "finops") {
			writeHTTPError(w, "Forbidden: Only administrators and FinOps can create new teams", http.StatusForbidden)
			return
		}

		var req struct {
			TeamName     string `json:"team_name"`
			ContactEmail string `json:"contact_email"`
			DepartmentID int    `json:"department_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeHTTPError(w, "bad request", http.StatusBadRequest)
			return
		}

		if req.TeamName == "" || req.ContactEmail == "" || req.DepartmentID <= 0 {
			writeHTTPError(w, "missing required fields", http.StatusBadRequest)
			return
		}

		// บันทึกเข้าฐานข้อมูล
		_, err := db.Exec(`
			INSERT INTO teams (team_name, contact_email, department_id, created_at)
			VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		`, req.TeamName, req.ContactEmail, req.DepartmentID)

		if err != nil {
			writeHTTPError(w, "failed to create team: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// บันทึก Log ลง audit_logs
		userEmail := middleware.GetUserEmail(r.Context())
		ipAddress := parseClientIP(r.RemoteAddr)
		details := fmt.Sprintf("Created new team %s (Contact: %s, DeptID: %d)", req.TeamName, req.ContactEmail, req.DepartmentID)
		writeAuditLog(db, userEmail, "CREATE_TEAM", req.TeamName, details, ipAddress)

		writeJSONResponse(w, http.StatusOK, map[string]string{
			"status":  "success",
			"message": fmt.Sprintf("Team %s created successfully", req.TeamName),
		})
	}
}
