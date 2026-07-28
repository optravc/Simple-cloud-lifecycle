package main

import (
	"automated-lifecycle/backend/internal/routes"
	"database/sql" // 1. นำเข้า package sql สำหรับจัดการฐานข้อมูล
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq" // 2. นำเข้า PostgreSQL driver แบบ blank import
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Print("not found .envfile")
	} else {
		fmt.Print("found.envfile\n")
	}

	region := os.Getenv("AWS_REGION")
	fmt.Printf("Cloud region: %s\n", region)

	// 3. ดึง Connection String จาก .env มาเชื่อมต่อกับ AWS RDS PostgreSQL
	// อย่าลืมไปเพิ่ม DB_URL ไว้ในไฟล์ .env ของคุณนะครับ
	dbConnStr := os.Getenv("DB_URL")
	db, err := sql.Open("postgres", dbConnStr)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	fmt.Println("Database connected successfully!")

	
	mux := routes.Routes(db)
	port := ":8000"

	fmt.Printf("backend running on http://localhost%s\n", port)

	if err := http.ListenAndServe(port, mux); err != nil {
		panic(err)
	}
}