package noti

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
)

// SendSweepNotificationEmail ส่งอีเมลแจ้งเตือนผ่าน AWS SES (รองรับข้อมูล FinOps และ Resource Details ครบถ้วน)
func SendSweepNotificationEmail(
	ownerEmail string,
	ownerTeam string,
	instanceID string,
	instanceName string,
	deadline string,
	region string,
	environment string,
	costPerDay float64,
	idleDays int,
) {
	ctx := context.TODO()

	// ถ้าไม่ได้ส่ง region มา ให้ดึงจาก Env หรือใช้ค่าเริ่มต้น
	if region == "" {
		region = os.Getenv("AWS_REGION")
		if region == "" {
			region = "ap-southeast-7"
		}
	}

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		log.Printf("[Error] Unable to load AWS SDK config: %v\n", err)
		return
	}

	client := ses.NewFromConfig(cfg)

	senderEmail := os.Getenv("SES_SENDER_EMAIL")
	if senderEmail == "" {
		log.Println("[Warning] SES_SENDER_EMAIL is missing in .env. Email skipped.")
		return
	}

	baseURL := os.Getenv("API_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8000"
	}

	// สร้างลิงก์สำหรับกด Confirm หรือ Cancel จากอีเมล
	confirmLink := fmt.Sprintf("%s/api/resolve?id=%s&action=confirm", baseURL, instanceID)
	cancelLink := fmt.Sprintf("%s/api/resolve?id=%s&action=cancel", baseURL, instanceID)

	// คำนวณค่าใช้จ่ายรายเดือนคร่าวๆ
	monthlyCost := costPerDay * 30.0

	subject := fmt.Sprintf("[Cloud Lifecycle] Action Required: Idle Resource %s Scheduled for Deletion", instanceName)
	
	body := fmt.Sprintf(`<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
			.container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
			.header { background-color: #f8f9fa; padding: 15px; border-radius: 6px 6px 0 0; border-bottom: 3px solid #dc3545; }
			.content { padding: 20px 0; }
			.resource-box { background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 5px solid #ffc107; }
			.btn-container { text-align: center; margin: 30px 0; }
			.btn { padding: 10px 20px; text-decoration: none; color: #fff; border-radius: 5px; font-weight: bold; display: inline-block; margin: 0 5px; }
			.btn-danger { background-color: #d9534f; }
			.btn-success { background-color: #5cb85c; }
			.footer { font-size: 12px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center; }
			.warning-text { color: #dc3545; font-weight: bold; font-size: 13px; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h3 style="margin: 0; color: #dc3545;">⚠️ Cloud Lifecycle: Idle Resource Notice</h3>
			</div>
			<div class="content">
				<p>Dear System Owner (Team: <strong>%s</strong>),</p>
				<p>Our FinOps automation system has detected that your cloud resource is running in an idle state and is scheduled for automatic cleanup.</p>
				
				<div class="resource-box">
					<p style="margin: 5px 0;"><strong>Resource Name:</strong> %s</p>
					<p style="margin: 5px 0;"><strong>Instance ID:</strong> <code>%s</code></p>
					<p style="margin: 5px 0;"><strong>Cloud Provider:</strong> AWS (Region: %s)</p>
					<p style="margin: 5px 0;"><strong>Environment Type:</strong> %s</p>
					<p style="margin: 5px 0;"><strong>Idle Duration:</strong> %d days</p>
					<p style="margin: 5px 0;"><strong>Estimated Cost Impact:</strong> ~$%.2f/day (approx. ~$%.2f/month)</p>
					<hr style="border: 0; border-top: 1px solid #ffeeba; margin: 10px 0;">
					<p style="margin: 5px 0; color: #dc3545;"><strong>Scheduled Permanent Deletion:</strong> %s</p>
				</div>

				<p class="warning-text">Auto-action Notice: If no action is taken by the scheduled date, the system will automatically terminate this resource to optimize infrastructure costs.</p>
				
				<p>If you wish to cancel this deletion or confirm it immediately, please click one of the options below:</p>
				
				<div class="btn-container">
					<a href="%s" class="btn btn-danger">Confirm Deletion</a>
					<a href="%s" class="btn btn-success">Cancel & Retain</a>
				</div>
			</div>
			<div class="footer">
				<p>Cloud Lifecycle Automation System &bull; This is an automated notification.</p>
			</div>
		</div>
	</body>
	</html>`,
		ownerTeam, instanceName, instanceID, region, environment, idleDays, costPerDay, monthlyCost, deadline, confirmLink, cancelLink,
	)

	input := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{ownerEmail},
		},
		Message: &types.Message{
			Subject: &types.Content{
				Data: aws.String(subject),
			},
			Body: &types.Body{
				Html: &types.Content{
					Data: aws.String(body),
				},
			},
		},
		Source: aws.String(senderEmail),
	}

	_, err = client.SendEmail(ctx, input)
	if err != nil {
		log.Printf("Failed to send email via AWS SES to %s: %v\n", ownerEmail, err)
		return
	}

	log.Printf("AWS SES email sent successfully to %s\n", ownerEmail)
}