package ops

import (
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/noti"
	"database/sql"
	"log"
	"time"
	"os"
	"github.com/robfig/cron/v3"
)

// GetAllResources ดึงข้อมูลจาก Cloud Provider ทั้งหมดแบบไดนามิก
func GetAllResources(db *sql.DB) []models.CloudR {
	var allResources []models.CloudR

	// สร้างลิสต์ของ Cloud Provider
	var providers []cloud.CloudProvider

	// ส่ง db เข้าไปใน AWSProvider ด้วย เพื่อให้มันเอาไป Query หาอีเมล
	providers = append(providers, &cloud.AWSProvider{DB: db})

	// วนลูปให้ Provider แต่ละเจ้าไปดึงข้อมูลของตัวเองมา
	for _, p := range providers {
		resources := p.FetchResources()
		allResources = append(allResources, resources...)
	}

	return allResources
}

//scanandsweep auto sweep idle resources at 8am BKK time
func StartSweeperCron(db *sql.DB) {
	bkkTime := time.FixedZone("BKK", 7*60*60)
	c := cron.New(cron.WithLocation(bkkTime))

	// ตั้งเวลารัน Sweeper (เช่น ทุก 08:00 น.)
	c.AddFunc("0 8 * * *", func() {
		log.Println("[CRON] 🧹 Starting Sweeper scan for idle resources...")
		
		// เรียกฟังก์ชันที่คุณเขียนไว้จัดการ EC2
		provider := &cloud.AWSProvider{DB: db} 
		provider.ProcessIdleResources()
		
		log.Println("[CRON] ✅ Sweeper scan completed.")
	})

	c.Start()
	log.Println("[System] Sweeper Scheduler started (08:00 BKK).")
}

// ScanAndSweep สแกนหาเครื่องที่ไม่ได้ใช้งานเกิน 14 วัน
func ScanAndSweep(db *sql.DB, resources []models.CloudR) (int, float64, []string) {
	deleteCount := 0
	var saveCount float64 = 0
	var sweptNames []string

	for _, res := range resources {
		// กรองเฉพาะเครื่องที่ Idle เกิน 14 วัน และยังไม่ได้อยู่ในกระบวนการ Sweep
if res.DayIdle >= 1 && res.Status == "ACTIVE" {			
			deadline := time.Now().AddDate(0, 0, 7) // บวกไปอีก 7 วัน

			// บันทึกลงตาราง Tracking
			query := `
				INSERT INTO sweep_tracking (instance_id, instance_name, owner_email, status, deadline_at)
				VALUES ($1, $2, $3, 'PENDING_SWEEP', $4)
				ON CONFLICT (instance_id) DO UPDATE SET status = 'PENDING_SWEEP', deadline_at = $4
			`
			_, err := db.Exec(query, res.ID, res.Name, res.OwnerEmail, deadline)
			if err != nil {
				log.Println("Error inserting tracking:", err)
				continue
			}

			
			go noti.SendSweepNotificationEmail(
    res.OwnerEmail,                 // 1. ownerEmail
    res.Owner,                      // 2. ownerTeam (ชื่อทีมจาก Tag)
    res.ID,                         // 3. instanceID
    res.Name,                       // 4. instanceName
    deadline.Format("2006-01-02"),  // 5. deadline
    os.Getenv("AWS_REGION"),        // 6. region (ดึงจาก Env)
    res.Environment,                // 7. environment (หรือใช้ค่าจาก struct ถ้ารองรับ)
    res.Costperday,                
    res.DayIdle,                    
)

			deleteCount++
			saveCount += res.Costperday
			sweptNames = append(sweptNames, res.Name)
		}
	}

	return deleteCount, saveCount, sweptNames
}


