package cloud

import (
	"database/sql"
	"log"
	"time"

	"github.com/robfig/cron/v3"
)

// StartCostSyncCron เป็นฟังก์ชันสำหรับเปิดการทำงาน Background Job
func StartCostSyncCron(db *sql.DB) {
	// 1. สร้าง Cron Instance (กำหนดโซนเวลาให้เป็นเวลาท้องถิ่น หรือแก้ไขเป็น Asia/Bangkok ได้ถ้าต้องการ)
	bkkTime := time.FixedZone("BKK", 7*60*60)
	c := cron.New(cron.WithLocation(bkkTime))

	// 2. ตั้งค่ารูปแบบเวลา (Cron Expression)
	_, err := c.AddFunc("0 0 * * *", func() {
		log.Println("[CRON] ⏰ Starting daily AWS Cost & Usage sync...")
		
		// เรียกใช้ฟังก์ชันดูดข้อมูลที่เราเขียนไว้ก่อนหน้านี้
		err := SyncAWSCostData(db)
		if err != nil {
			log.Printf("[CRON] ❌ AWS cost sync failed: %v\n", err)
		} else {
			log.Println("[CRON] ✅ AWS cost sync completed successfully.")
		}
	})

	if err != nil {
		log.Fatalf("Failed to setup cron job: %v", err)
	}

	// 3. สั่งให้ Cron ทำงานใน Background
	c.Start()
	log.Println("[System]  Daily AWS Cost Sync Scheduler started (Scheduled at 00:00 BKK).")
}