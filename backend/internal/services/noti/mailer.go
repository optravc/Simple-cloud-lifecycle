package noti

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
)

type EmailNotificationInput struct {
	OwnerEmail   string
	OwnerTeam    string
	InstanceID   string
	InstanceName string
	Deadline     string
	Region       string
	Environment  string
	CostPerDay   float64
	IdleDays     int
}

type LeaseNotificationInput struct {
	OwnerEmail    string
	OwnerTeam     string
	InstanceID    string
	InstanceName  string
	Deadline      string
	Region        string
	Environment   string
	CostPerDay    float64
	IsGracePeriod bool
}

/// SendSweepNotificationEmail ส่งอีเมลแจ้งเตือนผ่าน AWS SES (รองรับข้อมูล FinOps และ Resource Details ครบถ้วน)
func SendSweepNotificationEmail(input EmailNotificationInput) {
	ctx := context.TODO()

	client, region := initSESClient(input.Region)
	if client == nil {
		return
	}

	senderEmail := os.Getenv("SES_SENDER_EMAIL")
	if senderEmail == "" {
		log.Println("[Warning] SES_SENDER_EMAIL is missing in .env. Email skipped.")
		return
	}

	recipientEmail := resolveRecipientEmail(input.OwnerEmail, senderEmail)
	subject, body := buildEmailContent(input, region)

	sesInput := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{recipientEmail},
		},
		Message: &types.Message{
			Subject: &types.Content{Data: aws.String(subject)},
			Body: &types.Body{Html: &types.Content{Data: aws.String(body)}},
		},
		Source: aws.String(senderEmail),
	}

	sendEmailWithRetry(ctx, client, sesInput, recipientEmail, senderEmail)
}

// 1. แยกส่วน Initialize AWS SES Client
func initSESClient(inputRegion string) (*ses.Client, string) {
	region := inputRegion
	if region == "" {
		region = os.Getenv("AWS_REGION")
		if region == "" {
			region = "ap-southeast-1"
		}
	}

	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	if err != nil {
		log.Printf("[Error] Unable to load AWS SDK config: %v\n", err)
		return nil, ""
	}

	return ses.NewFromConfig(cfg), region
}

// 2. แยกส่วนกำหนด Email ผู้รับ (Fallback Logic)
func resolveRecipientEmail(ownerEmail, senderEmail string) string {
	if ownerEmail == "" || strings.Contains(ownerEmail, "noreply") || strings.Contains(ownerEmail, "unknown") {
		if fallback := os.Getenv("FALLBACK_ADMIN_EMAIL"); fallback != "" {
			return fallback
		}
		return senderEmail
	}
	return ownerEmail
}

// 3. แยกส่วนสร้างเนื้อหา Subject และ HTML Body
func buildEmailContent(input EmailNotificationInput, region string) (string, string) {
	baseURL := strings.TrimSpace(os.Getenv("API_BASE_URL"))
	if baseURL == "" || strings.Contains(baseURL, "localhost") {
		baseURL = "http://scl-sandbox-alb-2027317152.ap-southeast-1.elb.amazonaws.com"
	}

	confirmLink := fmt.Sprintf("%s/api/resolve?id=%s&action=confirm", baseURL, input.InstanceID)
	cancelLink := fmt.Sprintf("%s/api/resolve?id=%s&action=cancel", baseURL, input.InstanceID)
	monthlyCost := input.CostPerDay * 30.0

	subject := fmt.Sprintf("[Cloud Lifecycle] Action Required: Idle Resource %s Scheduled for Deletion", input.InstanceName)

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
		input.OwnerTeam, input.InstanceName, input.InstanceID, region, input.Environment, input.IdleDays, input.CostPerDay, monthlyCost, input.Deadline, confirmLink, cancelLink,
	)

	return subject, body
}

// 4. แยกส่วนการส่งอีเมลและการทำ Retry กรณีเกิด Error
func sendEmailWithRetry(ctx context.Context, client *ses.Client, sesInput *ses.SendEmailInput, recipientEmail, senderEmail string) {
	_, err := client.SendEmail(ctx, sesInput)
	if err == nil {
		log.Printf("AWS SES email sent successfully to %s\n", recipientEmail)
		return
	}

	log.Printf("Failed to send email via AWS SES to %s: %v\n", recipientEmail, err)
	fallback := os.Getenv("FALLBACK_ADMIN_EMAIL")
	if fallback == "" {
		fallback = senderEmail
	}

	if fallback != "" && recipientEmail != fallback {
		log.Printf("Retrying AWS SES email to verified fallback admin email: %s\n", fallback)
		sesInput.Destination.ToAddresses = []string{fallback}
		if _, retryErr := client.SendEmail(ctx, sesInput); retryErr != nil {
			log.Printf("Failed to send email via AWS SES to fallback %s: %v\n", fallback, retryErr)
		} else {
			log.Printf("AWS SES email sent successfully to fallback %s\n", fallback)
		}
	}
}

// SendLeaseExpiryNotificationEmail ส่งอีเมลแจ้งเตือนเมื่อสัญญาเช่าใกล้หมดอายุ หรือเมื่อระบบสั่งหยุดทำงาน
func SendLeaseExpiryNotificationEmail(input LeaseNotificationInput) {
	ctx := context.TODO()

	region := input.Region
	if region == "" {
		region = os.Getenv("AWS_REGION")
		if region == "" {
			region = "ap-southeast-1"
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

	baseURL := strings.TrimSpace(os.Getenv("API_BASE_URL"))
	if baseURL == "" || strings.Contains(baseURL, "localhost") {
		baseURL = "http://scl-sandbox-alb-2027317152.ap-southeast-1.elb.amazonaws.com"
	}

	extendLink := fmt.Sprintf("%s/api/resolve-lease?id=%s&action=extend", baseURL, input.InstanceID)
	terminateLink := fmt.Sprintf("%s/api/resolve-lease?id=%s&action=terminate", baseURL, input.InstanceID)

	monthlyCost := input.CostPerDay * 30.0

	var subject string
	var headerText string
	var warningText string
	var actionDesc string
	var btnText string
	var btnClass string
	var btnLink string

	if input.IsGracePeriod {
		subject = fmt.Sprintf("[Cloud Lifecycle] ACTION REQUIRED: Server %s stopped. Expired lease.", input.InstanceName)
		headerText = "⚠️ Lease Expired: Server Stopped"
		warningText = fmt.Sprintf("Your server has expired and has been STOPPED to save costs. It is now in a 7-day grace period. It will be PERMANENTLY TERMINATED on %s.", input.Deadline)
		actionDesc = "If you still need this server and want to turn it back on, click the button below to extend the lease by 7 days. Otherwise, you can choose to terminate it immediately."
		btnText = "Extend Lease (+7 Days)"
		btnClass = "btn-success"
		btnLink = extendLink
	} else {
		subject = fmt.Sprintf("[Cloud Lifecycle] Warning: Server %s lease is expiring soon", input.InstanceName)
		headerText = "⏳ Server Lease Expiring Soon"
		warningText = fmt.Sprintf("Your server lease is expiring on %s. The system will automatically STOP it to optimize cost.", input.Deadline)
		actionDesc = "To prevent the server from being stopped, click the button below to extend your lease by 7 days."
		btnText = "Extend Lease (+7 Days)"
		btnClass = "btn-success"
		btnLink = extendLink
	}

	body := fmt.Sprintf(`<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
			.container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
			.header { background-color: #f8f9fa; padding: 15px; border-radius: 6px 6px 0 0; border-bottom: 3px solid #ffc107; }
			.content { padding: 20px 0; }
			.resource-box { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 5px solid #007bff; }
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
				<h3 style="margin: 0; color: #856404;">%s</h3>
			</div>
			<div class="content">
				<p>Dear System Owner (Team: <strong>%s</strong>),</p>
				<p>%s</p>
				
				<div class="resource-box">
					<p style="margin: 5px 0;"><strong>Resource Name:</strong> %s</p>
					<p style="margin: 5px 0;"><strong>Instance ID:</strong> <code>%s</code></p>
					<p style="margin: 5px 0;"><strong>Cloud Provider:</strong> AWS (Region: %s)</p>
					<p style="margin: 5px 0;"><strong>Environment Type:</strong> %s</p>
					<p style="margin: 5px 0;"><strong>Estimated Cost Impact:</strong> ~$%.2f/day (approx. ~$%.2f/month)</p>
					<hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 10px 0;">
					<p style="margin: 5px 0; color: #dc3545;"><strong>Deadline:</strong> %s</p>
				</div>

				<p class="warning-text">%s</p>
				
				<div class="btn-container">
					<a href="%s" class="btn %s">%s</a>
					<a href="%s" class="btn btn-danger">Terminate Immediately</a>
				</div>
			</div>
			<div class="footer">
				<p>Cloud Lifecycle Automation System &bull; This is an automated notification.</p>
			</div>
		</div>
	</body>
	</html>`,
		headerText, input.OwnerTeam, actionDesc, input.InstanceName, input.InstanceID, region, input.Environment, input.CostPerDay, monthlyCost, input.Deadline, warningText, btnLink, btnClass, btnText, terminateLink,
	)

	sesInput := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{input.OwnerEmail},
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

	_, err = client.SendEmail(ctx, sesInput)
	if err != nil {
		log.Printf("Failed to send email via AWS SES to %s: %v\n", input.OwnerEmail, err)
		return
	}

	log.Printf("AWS SES lease notification email sent successfully to %s\n", input.OwnerEmail)
}

// SendSlackAlert dispatches a formatted Slack notification to the configured Webhook URL
func SendSlackAlert(deptName string, channel string, currentSpend float64, budget float64, status string) {
	webhookURL := os.Getenv("SLACK_WEBHOOK_URL")
	if webhookURL == "" {
		log.Println("[Slack Noti] SLACK_WEBHOOK_URL not configured in environment. Skipping Slack alert.")
		return
	}

	percent := 0.0
	if budget > 0 {
		percent = (currentSpend / budget) * 100.0
	}

	statusEmoji := "🔴"
	if status == "Warning" {
		statusEmoji = "🟡"
	}

	payloadText := fmt.Sprintf(
		"%s *[FinOps Governance Alert - %s]*\n*Department*: %s\n*Alert Channel*: `%s`\n*Status*: %s\n*Current Spend*: $%.2f USD / *Budget*: $%.2f USD (%.1f%%)\n*Action Required*: Please review unallocated cloud resources or adjust budget threshold.",
		statusEmoji, status, deptName, channel, status, currentSpend, budget, percent,
	)

	payload := map[string]string{
		"text": payloadText,
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[Slack Noti Error] JSON marshal failed: %v\n", err)
		return
	}

	// Use a client with explicit timeout to prevent goroutine leak if Slack API hangs
	httpClient := &http.Client{Timeout: 10 * time.Second}
	resp, err := httpClient.Post(webhookURL, "application/json", bytes.NewBuffer(jsonBytes))
	if err != nil {
		log.Printf("[Slack Noti Error] Webhook POST failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("[Slack Noti Success] Dispatched %s budget alert for '%s' to Slack (%s)\n", status, deptName, channel)
}