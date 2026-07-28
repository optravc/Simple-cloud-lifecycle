package services

import (
	"automated-lifecycle/backend/internal/models"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
)

// AWSProvider เป็น Struct ที่ใช้สำหรับผูกกับฟังก์ชันของ AWS
type AWSProvider struct{}

// FetchResources เป็นฟังก์ชันที่ทำให้ AWSProvider ทำงานตามมาตรฐาน Interface CloudProvider
func (p *AWSProvider) FetchResources() []models.CloudR {
	// 1. โหลด Config จากไฟล์ .env
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Printf("[Error] ไม่สามารถโหลด AWS Config ได้: %v", err)
		return nil
	}

	// 2. สร้าง Client สำหรับต่อเข้า EC2
	client := ec2.NewFromConfig(cfg)

	// 3. สั่งดึงข้อมูล Instance ทั้งหมด
	output, err := client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{})
	if err != nil {
		log.Printf("[Error] ดึงข้อมูล EC2 ไม่สำเร็จ: %v", err)
		return nil
	}

	var resources []models.CloudR

	// 4. วนลูปนำข้อมูลจาก AWS มาใส่ใน Struct กลาง
	for _, reservation := range output.Reservations {
		for _, instance := range reservation.Instances {
			id := *instance.InstanceId
			awsState := string(instance.State.Name) // สถานะเครื่องจาก AWS (running, stopped, ฯลฯ)

			// ค้นหาชื่อ (Name) จาก Tags 
			name := "Unknown"
			for _, tag := range instance.Tags {
				if *tag.Key == "Name" {
					name = *tag.Value
					break
				}
			}

			// --- [จำลอง Logic หาเวลา Idle ชั่วคราว] ---
			// อนาคตเราสามารถดึงข้อมูล CPU จาก CloudWatch มาช่วยประเมิน DayIdle ตรงนี้ได้
			dayIdle := 2
			status := "active"
			if awsState == "stopped" {
				dayIdle = 15
				status = "soft-deleted"
			}

			// ประกอบร่างข้อมูลให้เข้ากับมาตรฐานที่เราออกแบบไว้
			r := models.CloudR{
				ID:         id,
				Name:       name,
				Type:       "EC2",
				Provider:   "AWS",
				Owner:      "Auto-Discovered", // หรือดึงจาก Tag ขององค์กร
				DayIdle:    dayIdle,
				Costperday: 1.5, // สามารถเชื่อม API Cost Explorer มาอัปเดตตรงนี้ได้ในอนาคต
				Status:     status,
			}

			resources = append(resources, r)
		}
	}

	return resources
}