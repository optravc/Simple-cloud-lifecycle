package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

var jwks *keyfunc.JWKS

// InitJWKS ควรถูกเรียกใช้ 1 ครั้งตอนเริ่มรันเซิร์ฟเวอร์ (เช่นใน main.go หรือ api.go)
// เพื่อดึงค่า Public Keys จาก AWS Cognito มาเก็บไว้ใน Cache
func InitJWKS() error {
	region := os.Getenv("AWS_REGION")
	userPoolID := os.Getenv("USER_POOL_ID")
	
	
	// URL สำหรับดึง JWKS ของ Cognito
	jwksURL := fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json", region, userPoolID)
	// ตั้งค่าให้รีเฟรชคีย์ทุกๆ 1 ชั่วโมง
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

// AuthMiddleware เป็นตัวดักจับ Request เพื่อตรวจสอบ Token
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized: Missing or invalid token", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, jwks.Keyfunc)
		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}