package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

var jwks *keyfunc.JWKS

type contextKey string

const UserRoleKey contextKey = "user_role"
const UserGroupsKey contextKey = "user_groups"
const UserDeptKey contextKey = "user_dept"
const UserEmailKey contextKey = "user_email"
const defaultEmail = "unknown@enterprise.com"

// InitJWKS ควรถูกเรียกใช้ 1 ครั้งตอนเริ่มรันเซิร์ฟเวอร์ (เช่นใน main.go)
// เพื่อดึงค่า Public Keys จาก AWS Cognito มาเก็บไว้ใน Cache
func InitJWKS() error {
	region := os.Getenv("AWS_REGION")
	userPoolID := os.Getenv("USER_POOL_ID")
	
	jwksURL := fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json", region, userPoolID)
	options := keyfunc.Options{
		RefreshInterval: time.Hour,
	}

	var err error
	jwks, err = keyfunc.Get(jwksURL, options)
	if err != nil {
		return fmt.Errorf("failed to create JWKS from resource at the given URL: %w", err)
	}
	return nil
}

// extractTokenString extracts bearer token string from HTTP header
func extractTokenString(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return "", fmt.Errorf("missing or invalid token")
	}
	return strings.TrimPrefix(authHeader, "Bearer "), nil
}

// extractGroupsClaim extracts cognito groups list from raw token claims map
func extractGroupsClaim(claims jwt.MapClaims) []string {
	var groups []string
	grpClaim, ok := claims["cognito:groups"]
	if !ok {
		return nil
	}
	if grpList, ok := grpClaim.([]interface{}); ok {
		for _, g := range grpList {
			if gStr, ok := g.(string); ok {
				groups = append(groups, gStr)
			}
		}
	} else if grpStr, ok := grpClaim.(string); ok {
		groups = append(groups, grpStr)
	}
	return groups
}

// extractDeptClaim extracts custom:department from raw token claims map
func extractDeptClaim(claims jwt.MapClaims) string {
	if deptClaim, ok := claims["custom:department"]; ok {
		if dStr, ok := deptClaim.(string); ok && dStr != "" {
			return dStr
		}
	}
	return "All"
}

// extractEmailClaim extracts email or username attributes from raw token claims map
func extractEmailClaim(claims jwt.MapClaims) string {
	if emailVal, ok := claims["email"].(string); ok {
		return emailVal
	}
	if usernameVal, ok := claims["username"].(string); ok {
		return usernameVal
	}
	if cognitoUserVal, ok := claims["cognito:username"].(string); ok {
		return cognitoUserVal
	}
	return defaultEmail
}

// parseTokenClaims extracts groups, department, and email claims from parsed JWT token
func parseTokenClaims(token *jwt.Token) (groups []string, dept string, email string) {
	dept = "All"
		email = defaultEmail
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return
	}

	groups = extractGroupsClaim(claims)
	dept = extractDeptClaim(claims)
	email = extractEmailClaim(claims)
	return
}

// mapGroupsToRole maps AWS Cognito groups to internal FinOps dashboard role
func mapGroupsToRole(groups []string) string {
	role := "dev"
	for _, g := range groups {
		gLower := strings.ToLower(g)
		switch gLower {
		case "admins", "admin":
			return "admin"
		case "finops":
			role = "finops"
		case "finance":
			if role != "finops" {
				role = "finance"
			}
		case "leads", "lead", "devlead":
			if role != "finops" && role != "finance" {
				role = "lead"
			}
		case "devs", "dev", "developer":
			if role != "finops" && role != "finance" && role != "lead" {
				role = "dev"
			}
		}
	}
	return role
}

// AuthMiddleware เป็นตัวดักจับ Request เพื่อตรวจสอบ Token
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if jwks == nil {
			log.Println("[Auth Error] JWKS is not initialized")
			http.Error(w, "Internal Server Error: Auth configuration missing", http.StatusInternalServerError)
			return
		}

		tokenString, err := extractTokenString(r)
		if err != nil {
			http.Error(w, "Unauthorized: Missing or invalid token", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(tokenString, jwks.Keyfunc)
		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		groups, dept, email := parseTokenClaims(token)
		role := mapGroupsToRole(groups)

		ctx := context.WithValue(r.Context(), UserRoleKey, role)
		ctx = context.WithValue(ctx, UserGroupsKey, groups)
		ctx = context.WithValue(ctx, UserDeptKey, dept)
		ctx = context.WithValue(ctx, UserEmailKey, email)
		r = r.WithContext(ctx)

		next(w, r)
	}
}

// RequireRole เป็น Middleware กรองสิทธิ์ของ API ปลายทางตามบทบาทผู้ใช้
func RequireRole(allowedRoles []string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userRole, ok := r.Context().Value(UserRoleKey).(string)
		if !ok {
			http.Error(w, "Forbidden: Role context missing", http.StatusForbidden)
			return
		}

		userDept, _ := r.Context().Value(UserDeptKey).(string)
		userDeptLower := strings.ToLower(userDept)

		allowed := false

		// Admin, FinOps, Finance roles/departments get global view permissions
		if strings.EqualFold(userRole, "admin") {
			allowed = true
		} else if strings.Contains(userDeptLower, "finops") || strings.Contains(userDeptLower, "finance") {
			for _, rVal := range allowedRoles {
				if strings.EqualFold(rVal, "finops") || strings.EqualFold(rVal, "finance") || strings.EqualFold(rVal, "admin") {
					allowed = true
					break
				}
			}
		} else {
			for _, rVal := range allowedRoles {
				if strings.EqualFold(rVal, userRole) {
					allowed = true
					break
				}
			}
		}

		if !allowed {
			http.Error(w, "Forbidden: You do not have permission to perform this action", http.StatusForbidden)
			return
		}

		next(w, r)
	}
}

// GetUserRole เป็นฟังก์ชันดึงบทบาทผู้ใช้จาก Context
func GetUserRole(ctx context.Context) string {
	if role, ok := ctx.Value(UserRoleKey).(string); ok {
		return role
	}
	return ""
}

// GetUserGroups เป็นฟังก์ชันดึงรายชื่อกลุ่มของค็อกนิโตจาก Context
func GetUserGroups(ctx context.Context) []string {
	if groups, ok := ctx.Value(UserGroupsKey).([]string); ok {
		return groups
	}
	return nil
}

// GetUserDept เป็นฟังก์ชันดึงแผนกผู้ใช้งานจาก Context
func GetUserDept(ctx context.Context) string {
	if dept, ok := ctx.Value(UserDeptKey).(string); ok {
		return dept
	}
	return "All"
}

// GetUserEmail เป็นฟังก์ชันดึงอีเมลผู้ใช้งานจาก Context
func GetUserEmail(ctx context.Context) string {
	if email, ok := ctx.Value(UserEmailKey).(string); ok {
		return email
	}
	return defaultEmail
}