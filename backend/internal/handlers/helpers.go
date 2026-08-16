package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

const (
	notAllowedMsg      = "not allowed"
	forbiddenManageMsg = "Forbidden: You do not have permission to manage this instance"
	originHeader       = "Access-Control-Allow-Origin"
	contentTypeHeader  = "Content-Type"
	jsonContentType    = "application/json"
)

// parseClientIP - ดึงค่า IP address ของ Client โดยตัดส่วนของ Port ออกหากมี
func parseClientIP(remoteAddr string) string {
	ipAddress := remoteAddr
	if strings.Contains(ipAddress, ":") {
		parts := strings.Split(ipAddress, ":")
		ipAddress = strings.Join(parts[:len(parts)-1], ":")
		ipAddress = strings.Trim(ipAddress, "[]")
	}
	return ipAddress
}

// writeAuditLog - เขียนประวัติความปลอดภัยลงตาราง audit_logs
func writeAuditLog(db *sql.DB, userEmail, action, targetResource, details, ipAddress string) {
	_, err := db.Exec(`
		INSERT INTO audit_logs (user_email, action, target_resource, details, ip_address, created_at)
		VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
	`, userEmail, action, targetResource, details, ipAddress)
	if err != nil {
		log.Printf("[Audit Log Error] Failed to write %s log: %v\n", action, err)
	}
}

// writeJSONResponse write response headers and JSON encoded body to w
func writeJSONResponse(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set(originHeader, "*")
	w.Header().Set(contentTypeHeader, jsonContentType)
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

// writeHTTPError write CORS header and HTTP error to w
func writeHTTPError(w http.ResponseWriter, message string, status int) {
	w.Header().Set(originHeader, "*")
	http.Error(w, message, status)
}

// checkMethod validates request HTTP method and responds if not matching
func checkMethod(w http.ResponseWriter, r *http.Request, expected string) bool {
	if r.Method != expected {
		writeHTTPError(w, notAllowedMsg, http.StatusMethodNotAllowed)
		return false
	}
	return true
}
