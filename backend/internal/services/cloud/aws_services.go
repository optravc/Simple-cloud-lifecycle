package cloud

import (
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/noti"
	"context"
	"database/sql"
	"log" 
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
)

type AWSProvider struct {
	DB *sql.DB
}

func (p *AWSProvider) FetchResources() []models.CloudR {
	// 1. ดักจับ Error ตอนโหลด Config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Printf("[AWS Error] Load Config Failed: %v\n", err)
		return nil
	}

	client := ec2.NewFromConfig(cfg)
	
	// 2. ดัก Error ตอนดึงข้อมูล EC2
	output, err := client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{})
	if err != nil {
		log.Printf("[AWS Error] Describe Instances Failed: %v\n", err)
		return nil
	}

	// 3. พิมพ์บอกว่าเจอกี่เครื่อง
	log.Printf("[AWS Info] Found %d reservations from AWS\n", len(output.Reservations))

	var resources []models.CloudR

	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-southeast-1" 
	}

	for _, reservation := range output.Reservations {
		for _, instance := range reservation.Instances {
			id := *instance.InstanceId
			awsState := string(instance.State.Name)
			log.Printf("-> Instance ID: %s | State in AWS: %s\n", id, awsState)

			name := "Unknown"
			ownerTag := "Unknown"
			environment := "development"
			
			for _, tag := range instance.Tags {
				if *tag.Key == "Name" {
					name = *tag.Value
				}
				if *tag.Key == " Owner team" || *tag.Key == "Owner" {
					ownerTag = *tag.Value
				}
				if *tag.Key == "Environment" || *tag.Key == "Env" {
					environment = *tag.Value
				}
			}

			var ownerEmail string
			err := p.DB.QueryRow("SELECT contact_email FROM teams WHERE team_name = $1", ownerTag).Scan(&ownerEmail)
			
			if err != nil {
			
				fallbackEmail := os.Getenv("FALLBACK_ADMIN_EMAIL")
				
				if fallbackEmail == "" {
					
					log.Println("[Warning] FALLBACK_ADMIN_EMAIL is not set. Using system default.")
					fallbackEmail = "noreply@internal.system" 
				}
				ownerEmail = fallbackEmail
			}
			
			dayIdle := 15 
			status := "ACTIVE"
			if awsState == "terminated" || awsState == "shutting-down" {
    	status = "TERMINATED"
    dayIdle = 0
} else if awsState == "stopped" {
    status = "STOPPED"
}

			r := models.CloudR{
				ID:         id,
				Name:       name,
				Type:       "EC2",
				Provider:   "AWS",
				Owner:      ownerTag,
				OwnerEmail: ownerEmail,
				DayIdle:    dayIdle,
				Costperday: 1.5,
				Status:     status,
				Environment: environment,
			}
			resources = append(resources, r)
		}
	}
	return resources
}


func (p *AWSProvider) ProcessIdleResources() {
	resources := p.FetchResources()

	for _, res := range resources {
		// check status: ถ้าเครื่องเปิดอยู่ (ACTIVE) และเข้าเกณฑ์ Idle
		if res.Status == "ACTIVE" && res.DayIdle >= 15 {
			noti.SendSweepNotificationEmail(
				res.OwnerEmail,                 
				res.Owner,                     
				res.ID,                        
				res.Name,                     
				"2026-08-06",                   
				"ap-southeast-1",               
				res.Environment,                
				res.Costperday,                 
				res.DayIdle,                   
			)

			log.Printf("[FinOps] Alert email sent for idle instance: %s to %s", res.ID, res.OwnerEmail)
		}
	}
}


func TerminateEC2Instances(instanceIDs []string) error {
	if len(instanceIDs) == 0 {
		return nil
	}

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Printf("[AWS Error] Load Config Failed in Terminate: %v\n", err)
		return err
	}

	client := ec2.NewFromConfig(cfg)

	input := &ec2.TerminateInstancesInput{
		InstanceIds: instanceIDs,
	}

	_, err = client.TerminateInstances(context.TODO(), input)
	if err != nil {
		log.Printf("[AWS Error] Failed to terminate instances %v: %v\n", instanceIDs, err)
		return err
	}

	log.Printf("[FinOps Action] Successfully sent termination request for instances: %v\n", instanceIDs)
	return nil
}