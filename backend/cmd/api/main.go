package main

import (
	"automated-lifecycle/backend/internal/middleware"
	"automated-lifecycle/backend/internal/routes"
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/finance"
	"automated-lifecycle/backend/internal/services/ops"
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("[Warning] .env file not found, relying on system environment variables")
	} else {
		log.Println("[Info] Loaded configurations from .env file")
	}

	region := os.Getenv("AWS_REGION")
	log.Printf("[Info] Cloud region: %s\n", region)

	dbConnStr := os.Getenv("DB_URL")
	if dbConnStr == "" {
		log.Fatal("[Fatal] DB_URL environment variable is required but not set")
	}

	db, err := sql.Open("postgres", dbConnStr)
	if err != nil {
		log.Fatalf("[Fatal] Error opening database connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("[Fatal] Database connectivity check failed: %v", err)
	}
	log.Println("[Info] Connected to PostgreSQL database successfully")

	// 1. Initialize AWS Cognito JWKS Cache
	if err := middleware.InitJWKS(); err != nil {
		log.Fatalf("[Fatal] Failed to initialize AWS Cognito JWKS: %v", err)
	}
	log.Println("[Info] AWS Cognito JWKS initialized successfully")

	// 2. Seed default trend data if they do not exist
	finance.SeedTrendData(db)

	// 3. Start background schedulers/cron jobs
	cloud.StartCostSyncCron(db)
	ops.StartSweeperCron(db)
	ops.StartLeaseExpiryCron(db)

	// 4. Register API routes
	mux := routes.Routes(db)

	// 5. Determine HTTP server port from environment variable with fallback
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	formattedPort := ":" + port

	log.Printf("[System] Backend HTTP Server running on http://localhost%s\n", formattedPort)
	if err := http.ListenAndServe(formattedPort, mux); err != nil {
		log.Fatalf("[Fatal] Server terminated unexpectedly: %v", err)
	}
}