package ops

import (
	"context"
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/cloud"
	"automated-lifecycle/backend/internal/services/noti"
	"database/sql"
	"log"
	"os"
	"strconv"
	"time"
	"github.com/robfig/cron/v3"
)

// IDLE_THRESHOLD_DAYS คือจำนวนวัน Idle ขั้นต่ำก่อนจะถูก flag
// ใช้ค่าเดียวกันทั้ง Manual (UI) และ CRON เพื่อความสอดคล้อง
const IDLE_THRESHOLD_DAYS = 14

// GetEffectiveThreshold คืนค่า threshold จริงที่จะใช้
// ตัวอย่าง: SWEEP_IDLE_OVERRIDE=1 ทำให้ทดสอบได้โดยไม่ต้องรอ 14 วัน
func GetEffectiveThreshold() int {
	if override := os.Getenv("SWEEP_IDLE_OVERRIDE"); override != "" {
		if val, err := strconv.Atoi(override); err == nil && val > 0 {
			log.Printf("[Warning] SWEEP_IDLE_OVERRIDE is set to %d days (testing mode)", val)
			return val
		}
	}
	return IDLE_THRESHOLD_DAYS
}

// GetAllResources ดึงข้อมูลจาก Cloud Provider ทั้งหมดแบบไดนามิก
func GetAllResources(ctx context.Context, db *sql.DB) []models.CloudResource {
	allResources := []models.CloudResource{}

	// สร้างลิสต์ของ Cloud Provider
	var providers []cloud.CloudProvider

	// ส่ง db เข้าไปใน AWSProvider ด้วย เพื่อให้มันเอาไป Query หาอีเมล
	providers = append(providers, &cloud.AWSProvider{DB: db})

	// วนลูปให้ Provider แต่ละเจ้าไปดึงข้อมูลของตัวเองมา
	for _, p := range providers {
		resources := p.FetchResources(ctx)
		allResources = append(allResources, resources...)
	}

	return allResources
}

// scanandsweep auto sweep idle resources at 8am BKK time
func StartSweeperCron(db *sql.DB) {
	bkkTime := time.FixedZone("BKK", 7*60*60)
	c := cron.New(cron.WithLocation(bkkTime))

	// ตั้งเวลารัน Sweeper (เช่น ทุก 08:00 น.)
	_, err := c.AddFunc("0 8 * * *", func() {
		log.Println("[CRON] 🧹 Starting Sweeper scan for idle resources...")
		
		// เรียกฟังก์ชันที่คุณเขียนไว้จัดการ EC2
		provider := &cloud.AWSProvider{DB: db} 
		provider.ProcessIdleResources(context.Background())
		
		log.Println("[CRON] ✅ Sweeper scan completed.")
	})
	if err != nil {
		log.Printf("[System Error] Failed to schedule Sweeper cron job: %v\n", err)
	}

	c.Start()
	log.Println("[System] Sweeper Scheduler started (08:00 BKK).")
}

// DryRunScan สแกนหาเครื่องที่เข้าเกณฑ์ Idle แต่ยังไม่ทำการ flag หรือส่ง email ใดๆ
// ใช้สำหรับแสดง Preview ให้ผู้ใช้เห็นก่อนยืนยัน Sweep
func DryRunScan(resources []models.CloudResource) []models.CloudResource {
	threshold := GetEffectiveThreshold()
	var idleResources []models.CloudResource

	for _, res := range resources {
		if res.DayIdle >= threshold && res.Status == "ACTIVE" {
			idleResources = append(idleResources, res)
		}
	}

	return idleResources
}

type SweepSelection struct {
	InstanceID string `json:"instance_id"`
	CreateAMI  bool   `json:"create_ami"`
	AMIName    string `json:"ami_name"`
	RetainEBS  bool   `json:"retain_ebs"`
}

// SweepSelectedInstances สแกนและ flag เฉพาะเครื่องที่ผู้ใช้งานติ๊กเลือกมาจาก UI
// พร้อมส่ง email แจ้งเตือน owner และบันทึกลง sweep_tracking
func SweepSelectedInstances(ctx context.Context, db *sql.DB, selections []SweepSelection) (int, float64, []string, error) {
	resources := GetAllResources(ctx, db)
	resMap := make(map[string]models.CloudResource)
	for _, r := range resources {
		resMap[r.ID] = r
	}

	deleteCount := 0
	var saveCount float64 = 0
	var sweptNames []string

	for _, sel := range selections {
		res, exists := resMap[sel.InstanceID]
		if !exists {
			log.Printf("[Sweep Error] Selected instance %s not found on AWS, skipping\n", sel.InstanceID)
			continue
		}

		deadline := time.Now().AddDate(0, 0, 7) // Grace period 7 วัน

		// บันทึกลงตาราง Tracking (upsert)
		query := `
			INSERT INTO sweep_tracking (instance_id, instance_name, owner_email, status, deadline_at)
			VALUES ($1, $2, $3, 'PENDING_SWEEP', $4)
			ON CONFLICT (instance_id) DO UPDATE SET status = 'PENDING_SWEEP', deadline_at = $4
		`
		_, err := db.Exec(query, res.ID, res.Name, res.OwnerEmail, deadline)
		if err != nil {
			log.Printf("Error inserting tracking for %s: %v\n", res.ID, err)
			continue
		}

		// Log settings ที่ผู้ใช้เลือก
		log.Printf("[Sweep] Instance %s flagged. CreateAMI=%v, AMIName=%s, RetainEBS=%v",
			res.ID, sel.CreateAMI, sel.AMIName, sel.RetainEBS)

		// ส่ง email แจ้งเตือน owner (async)
		go noti.SendSweepNotificationEmail(noti.EmailNotificationInput{
			OwnerEmail:   res.OwnerEmail,
			OwnerTeam:    res.Owner,
			InstanceID:   res.ID,
			InstanceName: res.Name,
			Deadline:     deadline.Format("2006-01-02"),
			Region:       os.Getenv("AWS_REGION"),
			Environment:  res.Environment,
			CostPerDay:   res.CostPerDay,
			IdleDays:     res.DayIdle,
		})

		deleteCount++
		saveCount += res.CostPerDay
		sweptNames = append(sweptNames, res.Name)
	}

	return deleteCount, saveCount, sweptNames, nil
}
