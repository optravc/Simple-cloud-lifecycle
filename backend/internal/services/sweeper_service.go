package services

import (
	"automated-lifecycle/backend/internal/models"
	"fmt"
)

// GetAllResources ดึงข้อมูลจาก Cloud Provider ทั้งหมดแบบไดนามิก
func GetAllResources() []models.CloudR {
	var allResources []models.CloudR

	// สร้างลิสต์ของ Cloud Provider
	var providers []CloudProvider

	// เพิ่ม AWS เข้าไปในระบบ (ถ้ามี GCP/Azure ก็เพิ่มต่อท้ายได้เลย)
	providers = append(providers, &AWSProvider{})

	// วนลูปให้ Provider แต่ละเจ้าไปดึงข้อมูลของตัวเองมา
	for _, p := range providers {
		resources := p.FetchResources()
		allResources = append(allResources, resources...)
	}

	return allResources
}

// ScanAndSweep สแกนหาเครื่องที่ไม่ได้ใช้งานเกิน 14 วัน
func ScanAndSweep() (int, float64, []string) {
	DeleteCount := 0
	SaveCount := 0.0
	var SweptName []string

	currentResources := GetAllResources()

	for _, res := range currentResources {
		isFlagged := false
		reason := ""

		// Logic 1: Zombie Compute (เครื่องเปิดทิ้งไว้ แต่แทบไม่ได้รันงาน)
		// ตรวจจากระยะเวลา Idle หรือถ้ามีฟิลด์ CPU ก็เช็กว่า CPU < 5% ติดต่อกัน
		if res.Type == "EC2" && res.Status == "active" {
			if res.DayIdle > 14 /* || res.AvgCPU < 5.0 */ {
				isFlagged = true
				reason = "Idle over 14 days"
			}
		}

		// Logic 2: Orphaned Storage (ดิสก์ที่ลืมลบ ไม่มีเซิร์ฟเวอร์ไหนใช้งาน)
		// ใน AWS สถานะดิสก์ที่ไม่ได้ผูกกับใครจะขึ้นว่า "available" แทน "in-use"
		if res.Type == "EBS" && res.Status == "available" {
			isFlagged = true
			reason = "Unattached Volume"
		}

		// Logic 3: Unassociated IPs (IP สาธารณะที่จองไว้แต่ไม่ได้ต่อกับเครื่อง)
		if res.Type == "ElasticIP" && res.Status == "unassociated" {
			isFlagged = true
			reason = "Unused Static IP"
		}

		// ถ้าระบบตรวจพบความสิ้นเปลืองจากเงื่อนไขใดเงื่อนไขหนึ่ง
		if isFlagged {
			DeleteCount++
			SaveCount += res.Costperday
			
			// เก็บชื่อพร้อมเหตุผล เพื่อส่งไปแสดงที่หน้า Dashboard ให้ทีมพิจารณา
			detail := fmt.Sprintf("%s (%s)", res.Name, reason)
			SweptName = append(SweptName, detail)

			fmt.Printf("[ALERT] Flagged for clean-up: %s (ID: %s) - Reason: %s\n", res.Name, res.ID, reason)
		}
	}

	return DeleteCount, SaveCount, SweptName
}