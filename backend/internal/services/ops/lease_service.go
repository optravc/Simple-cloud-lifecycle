package ops

import (
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/noti"
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/robfig/cron/v3"
)

// StartLeaseExpiryCron เป็น Background Job คอยตรวจสอบและทำความสะอาดเครื่องที่หมดอายุเช่า
func StartLeaseExpiryCron(db *sql.DB) {
	bkkTime := time.FixedZone("BKK", 7*60*60)
	c := cron.New(cron.WithLocation(bkkTime))

	// รันทุกๆ วันตอนเที่ยงคืน (00:00 BKK)
	_, err := c.AddFunc("0 0 * * *", func() {
		log.Println("[CRON] ⏳ Starting Lease Expiry check...")
		ctx := context.Background()
		processExpiredLeases(ctx, db)
		processTerminatedLeases(ctx, db)
		log.Println("[CRON] ✅ Lease Expiry check completed.")
	})
	if err != nil {
		log.Printf("[System Error] Failed to schedule Lease Expiry cron job: %v\n", err)
	}

	c.Start()
	log.Println("[System] Lease Expiry Check Scheduler started (00:00 BKK).")
}

// processExpiredLeases ย้ายการทำงานจัดการเครื่อง LEASED -> LEASED_EXPIRED_STOPPED เพื่อลด Cognitive Complexity
func processExpiredLeases(ctx context.Context, db *sql.DB) {
	rows, err := db.Query(`
		SELECT instance_id, instance_name, owner_email 
		FROM sweep_tracking 
		WHERE status = 'LEASED' AND deadline_at <= CURRENT_TIMESTAMP
	`)
	if err != nil {
		log.Printf("[Lease Cron Error] Failed to query expired leases: %v\n", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var instID, instName, ownerEmail string
		if err := rows.Scan(&instID, &instName, &ownerEmail); err != nil {
			log.Printf("[Lease Cron Error] Scan expired lease row failed: %v\n", err)
			continue
		}

		log.Printf("[Lease Cron] Instance %s (%s) has expired. Stopping...\n", instName, instID)
		
		// 1.1 สั่งหยุดการทำงานเครื่องใน AWS
		if errStop := cloud.StopEC2Instance(ctx, instID); errStop != nil {
			log.Printf("[Lease Cron Error] Failed to stop instance %s: %v\n", instID, errStop)
		}

		// 1.2 กำหนดเดดไลน์เพิ่มอีก 7 วันเพื่อเข้าสู่ระยะผ่อนผัน (Grace Period)
		graceDeadline := time.Now().AddDate(0, 0, 7)
		_, errUpdate := db.Exec(`
			UPDATE sweep_tracking 
			SET status = 'LEASED_EXPIRED_STOPPED', deadline_at = $1
			WHERE instance_id = $2
		`, graceDeadline, instID)
		if errUpdate != nil {
			log.Printf("[Lease Cron Error] Failed to update tracking status for %s: %v\n", instID, errUpdate)
		}

		// 1.3 ส่งอีเมลแจ้งเตือนผู้สร้างว่าเครื่องโดนปิดแล้วและจะโดนลบภายใน 7 วัน
		go noti.SendLeaseExpiryNotificationEmail(noti.LeaseNotificationInput{
			OwnerEmail:    ownerEmail,
			OwnerTeam:     "Lease Owner",
			InstanceID:    instID,
			InstanceName:  instName,
			Deadline:      graceDeadline.Format("2006-01-02"),
			Region:        os.Getenv("AWS_REGION"),
			Environment:   "development",
			CostPerDay:    0.25,
			IsGracePeriod: true,
		})
	}
}

// processTerminatedLeases ย้ายการทำงานจัดการเครื่อง LEASED_EXPIRED_STOPPED -> ARCHIVED เพื่อลด Cognitive Complexity
func processTerminatedLeases(ctx context.Context, db *sql.DB) {
	rowsStopped, errStopped := db.Query(`
		SELECT instance_id, instance_name, owner_email 
		FROM sweep_tracking 
		WHERE status = 'LEASED_EXPIRED_STOPPED' AND deadline_at <= CURRENT_TIMESTAMP
	`)
	if errStopped != nil {
		log.Printf("[Lease Cron Error] Failed to query stopped expired leases: %v\n", errStopped)
		return
	}
	defer rowsStopped.Close()

	for rowsStopped.Next() {
		var instID, instName, ownerEmail string
		if err := rowsStopped.Scan(&instID, &instName, &ownerEmail); err != nil {
			log.Printf("[Lease Cron Error] Scan stopped expired lease row failed: %v\n", err)
			continue
		}

		log.Printf("[Lease Cron] Grace period for instance %s (%s) expired. Terminating...\n", instName, instID)

		// 2.1 สั่งลบเครื่องบน AWS
		if errTerm := cloud.TerminateEC2Instances(ctx, []string{instID}); errTerm != nil {
			log.Printf("[Lease Cron Error] Failed to terminate instance %s on AWS: %v. Skipping DB status update.\n", instID, errTerm)
			continue
		}

		// 2.2 ดึงข้อมูลราคาต่อวันจาก cloud_resources เพื่อนำไปสะสมข้อมูลประหยัดค่าใช้จ่ายจริง
		var costPerDay float64 = 15.50
		_ = db.QueryRow("SELECT COALESCE(cost_per_day, 15.50) FROM cloud_resources WHERE id = $1", instID).Scan(&costPerDay)

		// 2.3 อัปเดต sweep_tracking: archive + บันทึก savings ไว้ใน row เดียวกัน
		_, errUpdate := db.Exec(`
			UPDATE sweep_tracking
			SET status             = 'ARCHIVED',
			    action_taken       = 'terminated',
			    saved_cost_per_day = $2,
			    swept_date         = CURRENT_DATE
			WHERE instance_id = $1
		`, instID, costPerDay)
		if errUpdate != nil {
			log.Printf("[Lease Cron Error] Failed to update sweep_tracking to ARCHIVED for %s: %v\n", instID, errUpdate)
		}
	}
}
