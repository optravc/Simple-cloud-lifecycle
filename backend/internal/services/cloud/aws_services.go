package cloud

import (
	"automated-lifecycle/backend/internal/middleware"
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/noti"
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
)

type AWSProvider struct {
	DB *sql.DB
}

type teamDetail struct {
	email string
	dept  string
}

// sanitizeEmail ลบ whitespace, control characters และอักขระ Unicode ที่ไม่ใช่ ASCII
// ออกจาก email address เพื่อป้องกัน SES InvalidParameterValue error
func sanitizeEmail(email string) string {
	email = strings.TrimSpace(email)
	var cleaned []rune
	for _, r := range email {
		if r < 128 && !unicode.IsControl(r) {
			cleaned = append(cleaned, r)
		}
	}
	return string(cleaned)
}

// parseInstanceTags extracts Name, Owner, Environment and Description tag details from raw tags
func parseInstanceTags(tags []ec2types.Tag) (name, ownerTag, environment, description string) {
	name = "Unknown"
	ownerTag = "Unknown"
	environment = "development"
	description = ""

	for _, tag := range tags {
		trimmedKey := strings.TrimSpace(*tag.Key)
		trimmedValue := strings.TrimSpace(*tag.Value)
		switch trimmedKey {
		case "Name":
			name = trimmedValue
		case "Owner team", "Owner":
			ownerTag = trimmedValue
		case "Environment", "Env":
			environment = trimmedValue
		case "Description", "Purpose", "Desc":
			description = trimmedValue
		}
	}
	return
}

// lookupOwnerAndDept looks up email and department details from teams map, falling back to config envs if not found
func lookupOwnerAndDept(ownerTag string, teamDetails map[string]teamDetail) (string, string) {
	td, exists := teamDetails[strings.ToLower(ownerTag)]
	if exists {
		cleanedEmail := sanitizeEmail(td.email)
		if cleanedEmail == "" {
			cleanedEmail = "noreply@internal.system"
		}
		return cleanedEmail, td.dept
	}

	fallback := os.Getenv("FALLBACK_ADMIN_EMAIL")
	if fallback == "" {
		fallback = os.Getenv("SES_SENDER_EMAIL")
		if fallback == "" {
			fallback = "noreply@internal.system"
		}
	}
	return fallback, "Unknown"
}

// calculateIdleDays calculates the number of days a resource has been running/stopped
func calculateIdleDays(launchTime *time.Time, awsState string) int {
	if launchTime == nil || (awsState != "running" && awsState != "stopped") {
		return 0
	}
	return int(time.Since(*launchTime).Hours() / 24.0)
}

// determineResourceStatus determines simple status mapping of ec2 states
func determineResourceStatus(awsState string) string {
	if awsState == "terminated" || awsState == "shutting-down" {
		return "TERMINATED"
	}
	if awsState == "stopped" || awsState == "stopping" {
		return "STOPPED"
	}
	return "ACTIVE"
}

// CalculateCostPerDay calculates Singapore On-Demand daily costs for standard EC2 instances
func CalculateCostPerDay(instanceType string) float64 {
	switch instanceType {
	case "t3.nano":
		return 0.0052 * 24.0
	case "t3.micro":
		return 0.0104 * 24.0
	case "t3.small":
		return 0.0264 * 24.0
	case "c7i-flex.large":
		return 0.09778 * 24.0
	case "m7i-flex.large":
		return 0.1197 * 24.0
	case "t3.medium":
		return 0.0416 * 24.0
	case "t3.large":
		return 0.0832 * 24.0
	case "m5.large":
		return 0.12 * 24.0
	default:
		return 0.25
	}
}

// IsProtectedSystemResource checks if instance is critical core infrastructure that must never be stopped or swept

const (
	KeywordAppServer  = "app-server"
	KeywordSclSandbox = "scl-sandbox"
)

func IsProtectedSystemResource(res models.CloudResource) bool {
	nameLower := strings.ToLower(res.Name)
	idLower := strings.ToLower(res.ID)
	appID := strings.ToLower(os.Getenv("PRIMARY_APP_INSTANCE_ID"))

	return strings.Contains(nameLower, KeywordAppServer) ||
		strings.Contains(nameLower, KeywordSclSandbox) ||
		(appID != "" && idLower == appID)
}

// mapEC2InstanceToResource maps a single EC2 Instance type to Models.CloudResource
func mapEC2InstanceToResource(instance ec2types.Instance, teamDetails map[string]teamDetail) models.CloudResource {
	id := *instance.InstanceId
	awsState := string(instance.State.Name)

	name, ownerTag, environment, description := parseInstanceTags(instance.Tags)
	ownerEmail, departmentName := lookupOwnerAndDept(ownerTag, teamDetails)
	
	// Mark primary application server instance as Permanent Core Infrastructure
	if strings.Contains(strings.ToLower(name), KeywordAppServer) || strings.Contains(strings.ToLower(name), KeywordSclSandbox) {
    environment = "Permanent"
    ownerTag = "Infra Team"
    ownerEmail = "noptrapk+infra.lead@gmail.com"
    departmentName = "Core Infrastructure"
    if description == "" {
        description = "Primary Cloud Lifecycle Application & Backend API Server"
    }
}
	dayIdle := calculateIdleDays(instance.LaunchTime, awsState)
	status := determineResourceStatus(awsState)
	if status == "TERMINATED" {
		dayIdle = 0
	}
	costPerDay := CalculateCostPerDay(string(instance.InstanceType))

	return models.CloudResource{
		ID:          id,
		Name:        name,
		Type:        "EC2",
		Provider:    "AWS",
		Owner:       ownerTag,
		OwnerEmail:  ownerEmail,
		Department:  departmentName,
		DayIdle:     dayIdle,
		CostPerDay:  costPerDay,
		Status:      status,
		Environment: environment,
		Description: description,
	}
}

// isInstanceAllowed checks if the instance's owner matches allowed teams
func isInstanceAllowed(ownerTag string, allowedTeams []string, restricted bool) bool {
	if !restricted {
		return true
	}
	for _, team := range allowedTeams {
		if strings.EqualFold(team, ownerTag) {
			return true
		}
	}
	return false
}

// fetchAllowedTeams for role department segregation
func (p *AWSProvider) fetchAllowedTeams(userDept string) []string {
	var allowedTeams []string
	rows, err := p.DB.Query(`
		SELECT t.team_name 
		FROM teams t
		JOIN departments d ON t.department_id = d.id
		WHERE LOWER(d.name) = LOWER($1)
	`, userDept)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var team string
			if err := rows.Scan(&team); err == nil {
				allowedTeams = append(allowedTeams, team)
			}
		}
	} else {
		log.Printf("[AWS Segregation Error] Failed to query allowed teams: %v\n", err)
	}
	return allowedTeams
}

// fetchBulkTeamDetails maps lowercase team names to owner emails and departments
func (p *AWSProvider) fetchBulkTeamDetails() map[string]teamDetail {
	teamDetails := make(map[string]teamDetail)
	teamRows, err := p.DB.Query(`
		SELECT LOWER(t.team_name), t.contact_email, d.name 
		FROM teams t
		JOIN departments d ON t.department_id = d.id
	`)
	if err == nil {
		defer teamRows.Close()
		for teamRows.Next() {
			var teamName string
			var td teamDetail
			if err := teamRows.Scan(&teamName, &td.email, &td.dept); err == nil {
				teamDetails[teamName] = td
			}
		}
	} else {
		log.Printf("[AWS Warning] Failed to bulk query team details: %v\n", err)
	}
	return teamDetails
}

func isRestrictedUser(userRole, userDept string) bool {
	return (userRole == "lead" || userRole == "dev") &&
		userDept != "All" && userDept != "" &&
		!strings.EqualFold(userRole, "finops") &&
		!strings.EqualFold(userRole, "finance") &&
		!strings.EqualFold(userRole, "admin") &&
		!strings.Contains(strings.ToLower(userDept), "finops") &&
		!strings.Contains(strings.ToLower(userDept), "finance")
}

// FetchResources lists AWS cloud resources and aligns them with DB configurations
func (p *AWSProvider) FetchResources(ctx context.Context) []models.CloudResource {
	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		log.Printf("[AWS Error] Load Config Failed: %v\n", err)
		return nil
	}

	client := ec2.NewFromConfig(cfg)
	output, err := client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{})
	if err != nil {
		log.Printf("[AWS Error] Describe Instances Failed: %v\n", err)
		return nil
	}

	userRole := middleware.GetUserRole(ctx)
	userDept := middleware.GetUserDept(ctx)
	restricted := isRestrictedUser(userRole, userDept)

	var allowedTeams []string
	if restricted {
		allowedTeams = p.fetchAllowedTeams(userDept)
	}

	teamDetails := p.fetchBulkTeamDetails()
	resources := p.processEC2Instances(output, teamDetails, restricted, allowedTeams, userDept)

	// 2. Fallback to DB tracking resources only if no live AWS instances exist (Offline/Dev mode)
	if len(resources) == 0 {
		resources = p.fetchFallbackResourcesFromDB(restricted, allowedTeams)
	}

	return resources
}

func (p *AWSProvider) processEC2Instances(
	output *ec2.DescribeInstancesOutput,
	teamDetails map[string]teamDetail,
	restricted bool,
	allowedTeams []string,
	userDept string,
) []models.CloudResource {
	var resources []models.CloudResource
	for _, reservation := range output.Reservations {
		for _, instance := range reservation.Instances {
			if r, ok := p.processSingleEC2Instance(instance, teamDetails, restricted, allowedTeams, userDept); ok {
				// ซ่อนเครื่อง App Server หลัก ไม่ให้แสดงในตาราง Manage ป้องกันคนกดลบ
				if IsProtectedSystemResource(r) {
					log.Printf("[AWS Security] Hiding primary app server instance %s (%s) from Manage table\n", r.ID, r.Name)
					continue
				}
				resources = append(resources, r)
			}
		}
	}
	return resources
}

func (p *AWSProvider) processSingleEC2Instance(
	instance ec2types.Instance,
	teamDetails map[string]teamDetail,
	restricted bool,
	allowedTeams []string,
	userDept string,
) (models.CloudResource, bool) {
	r := mapEC2InstanceToResource(instance, teamDetails)

	if restricted && !isInstanceAllowed(r.Owner, allowedTeams, restricted) {
		log.Printf("[AWS Segregation] Skipping instance %s because it belongs to team '%s' which is not in department '%s'\n", r.ID, r.Owner, userDept)
		return r, false
	}

	var deadline sql.NullTime
	var trackingStatus sql.NullString
	_ = p.DB.QueryRow("SELECT deadline_at, status FROM sweep_tracking WHERE instance_id = $1 ORDER BY id DESC LIMIT 1", r.ID).Scan(&deadline, &trackingStatus)
	if trackingStatus.Valid && trackingStatus.String == "PENDING_SWEEP" {
		r.Status = "PENDING_SWEEP"
	}
	if deadline.Valid {
		r.Deadline = deadline.Time
	}

	return r, true
}

func (p *AWSProvider) fetchFallbackResourcesFromDB(restricted bool, allowedTeams []string) []models.CloudResource {
	dbRows, err := p.DB.Query(`
		SELECT st.instance_id, st.instance_name, st.owner_email, st.status, st.deadline_at,
		       COALESCE(d.name, 'Unknown'), COALESCE(t.team_name, 'Unknown')
		FROM sweep_tracking st
		LEFT JOIN teams t ON LOWER(t.contact_email) = LOWER(st.owner_email)
		LEFT JOIN departments d ON t.department_id = d.id
		WHERE LOWER(st.instance_name) NOT LIKE '%app-server%' AND LOWER(st.instance_name) NOT LIKE '%scl-sandbox%'
		ORDER BY st.id DESC LIMIT 20
	`)
	if err != nil {
		return nil
	}
	defer dbRows.Close()

	var resources []models.CloudResource
	for dbRows.Next() {
		if res, ok := parseFallbackResourceRow(dbRows, restricted, allowedTeams); ok {
			resources = append(resources, res)
		}
	}
	return resources
}

func parseFallbackResourceRow(dbRows *sql.Rows, restricted bool, allowedTeams []string) (models.CloudResource, bool) {
	var id, name, ownerEmail, status, dept, team string
	var deadline sql.NullTime
	if dbRows.Scan(&id, &name, &ownerEmail, &status, &deadline, &dept, &team) != nil {
		return models.CloudResource{}, false
	}

	if restricted && !isInstanceAllowed(team, allowedTeams, restricted) {
		return models.CloudResource{}, false
	}

	var dl time.Time
	if deadline.Valid {
		dl = deadline.Time
	} else {
		dl = time.Now().AddDate(0, 0, 7)
	}

	return models.CloudResource{
		ID:          id,
		Name:        name,
		Type:        "EC2",
		Provider:    "AWS",
		Owner:       team,
		OwnerEmail:  ownerEmail,
		Department:  dept,
		DayIdle:     1,
		CostPerDay:  0.25,
		Status:      status,
		Environment: "development",
		Deadline:    dl,
	}, true
}

// ProcessIdleResources alerts owners of resources that have stayed idle too long
func (p *AWSProvider) ProcessIdleResources(ctx context.Context) {
	resources := p.FetchResources(ctx)
	deadlineStr := time.Now().AddDate(0, 0, 7).Format("2006-01-02")

	for _, res := range resources {
		if IsProtectedSystemResource(res) {
			log.Printf("[FinOps Protection] Skipping idle scan/alert for permanent system instance: %s (%s)\n", res.ID, res.Name)
			continue
		}
		if res.Status == "ACTIVE" && res.DayIdle >= 14 {
			noti.SendSweepNotificationEmail(noti.EmailNotificationInput{
				OwnerEmail:   res.OwnerEmail,
				OwnerTeam:    res.Owner,
				InstanceID:   res.ID,
				InstanceName: res.Name,
				Deadline:     deadlineStr,
				Region:       os.Getenv("AWS_REGION"),
				Environment:  res.Environment,
				CostPerDay:   res.CostPerDay,
				IdleDays:     res.DayIdle,
			})
			log.Printf("[FinOps] Alert email sent for idle instance: %s to %s", res.ID, res.OwnerEmail)
		}
	}
}

// createAMIExtracted creates a backup AMI if specified in settings
func createAMIExtracted(ctx context.Context, client *ec2.Client, instanceID string, settings SweepSettings) error {
	if !settings.CreateAMI || strings.TrimSpace(settings.AMIName) == "" {
		return nil
	}
	amiName := fmt.Sprintf("%s-%s-%s", settings.AMIName, instanceID, time.Now().Format("20060102-150405"))
	noReboot := true
	imageOutput, imgErr := client.CreateImage(ctx, &ec2.CreateImageInput{
		InstanceId:  &instanceID,
		Name:        &amiName,
		Description: aws.String("Auto-backup before sweep by Cloud Lifecycle system"),
		NoReboot:    &noReboot,
	})
	if imgErr != nil {
		log.Printf("[AWS Error] Failed to create AMI for instance %s: %v\n", instanceID, imgErr)
		return fmt.Errorf("failed to create AMI backup: %w", imgErr)
	}
	log.Printf("[FinOps] AMI backup created: %s (ID: %s) for instance %s\n", amiName, *imageOutput.ImageId, instanceID)
	return nil
}

// retainEBSVolume disables DeleteOnTermination on all EBS mappings
func retainEBSVolume(ctx context.Context, client *ec2.Client, instanceID string) {
	descOutput, descErr := client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if descErr != nil || len(descOutput.Reservations) == 0 || len(descOutput.Reservations[0].Instances) == 0 {
		return
	}

	inst := descOutput.Reservations[0].Instances[0]
	for _, bdm := range inst.BlockDeviceMappings {
		if bdm.Ebs == nil {
			continue
		}
		deleteOnTerm := false
		_, modErr := client.ModifyInstanceAttribute(ctx, &ec2.ModifyInstanceAttributeInput{
			InstanceId: &instanceID,
			BlockDeviceMappings: []ec2types.InstanceBlockDeviceMappingSpecification{
				{
					DeviceName: bdm.DeviceName,
					Ebs: &ec2types.EbsInstanceBlockDeviceSpecification{
						VolumeId:            bdm.Ebs.VolumeId,
						DeleteOnTermination: &deleteOnTerm,
					},
				},
			},
		})
		if modErr != nil {
			log.Printf("[AWS Warning] Failed to set RetainEBS on instance %s: %v\n", instanceID, modErr)
		} else {
			log.Printf("[FinOps] EBS volume on instance %s set to retain (DeleteOnTermination=false)\n", instanceID)
		}
	}
}

// SweepEC2Instances terminate instance พร้อมรองรับ Create AMI และ Retain EBS ตาม settings
func SweepEC2Instances(ctx context.Context, instanceID string, settings SweepSettings) error {
	if IsProtectedSystemResource(models.CloudResource{ID: instanceID, Name: instanceID}) {
		return fmt.Errorf("action blocked: instance %s is critical core system infrastructure and cannot be swept", instanceID)
	}

	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		log.Printf("[AWS Error] Load Config Failed in Sweep: %v\n", err)
		return err
	}
	client := ec2.NewFromConfig(cfg)

	if err := createAMIExtracted(ctx, client, instanceID, settings); err != nil {
		return err
	}

	if settings.RetainEBS {
		retainEBSVolume(ctx, client, instanceID)
	}

	_, err = client.TerminateInstances(ctx, &ec2.TerminateInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		log.Printf("[AWS Error] Failed to terminate instance %s: %v\n", instanceID, err)
		return err
	}

	log.Printf("[FinOps Action] Instance %s terminated (CreateAMI=%v, RetainEBS=%v)\n",
		instanceID, settings.CreateAMI, settings.RetainEBS)
	return nil
}

// TerminateEC2Instances ใช้สำหรับ backward compatibility (ResolveSweepHandler)
func TerminateEC2Instances(ctx context.Context, instanceIDs []string) error {
	var allowedIDs []string
	for _, id := range instanceIDs {
		if IsProtectedSystemResource(models.CloudResource{ID: id, Name: id}) {
			log.Printf("[FinOps Protection] Blocked termination of core system instance: %s\n", id)
			continue
		}
		allowedIDs = append(allowedIDs, id)
	}

	if len(allowedIDs) == 0 {
		return nil
	}

	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		log.Printf("[AWS Error] Load Config Failed in Terminate: %v\n", err)
		return err
	}

	client := ec2.NewFromConfig(cfg)
	input := &ec2.TerminateInstancesInput{
		InstanceIds: allowedIDs,
	}

	_, err = client.TerminateInstances(ctx, input)
	if err != nil {
		log.Printf("[AWS Error] Failed to terminate instances %v: %v\n", allowedIDs, err)
		return err
	}

	log.Printf("[FinOps Action] Successfully sent termination request for instances: %v\n", allowedIDs)
	return nil
}

// StartEC2Instance สั่งเปิดเครื่อง EC2 — returns actual AWS error to caller
func StartEC2Instance(ctx context.Context, instanceID string) error {
	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		log.Printf("[AWS Error] Failed to load AWS config for StartInstances %s: %v\n", instanceID, err)
		return err
	}
	client := ec2.NewFromConfig(cfg)
	_, err = client.StartInstances(ctx, &ec2.StartInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		log.Printf("[AWS Error] StartInstances failed for %s: %v\n", instanceID, err)
		return err
	}
	log.Printf("[FinOps Action] Instance %s started successfully on AWS\n", instanceID)
	return nil
}

// StopEC2Instance สั่งปิดเครื่อง EC2 — returns actual AWS error to caller
func StopEC2Instance(ctx context.Context, instanceID string) error {
	if IsProtectedSystemResource(models.CloudResource{ID: instanceID, Name: instanceID}) {
		return fmt.Errorf("action blocked: instance %s is critical core system infrastructure and cannot be stopped", instanceID)
	}

	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		log.Printf("[AWS Error] Failed to load AWS config for StopInstances %s: %v\n", instanceID, err)
		return err
	}
	client := ec2.NewFromConfig(cfg)
	_, err = client.StopInstances(ctx, &ec2.StopInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		log.Printf("[AWS Error] StopInstances failed for %s: %v\n", instanceID, err)
		return err
	}
	log.Printf("[FinOps Action] Instance %s stopped successfully on AWS\n", instanceID)
	return nil
}

type CreateEC2InstanceInput struct {
	Name         string
	InstanceType string
	Environment  string
	OwnerTeam    string
	OwnerDept    string
	ProjectID    string
	Description  string
}

// CreateEC2Instance สร้างเครื่อง EC2 ใหม่ใน AWS
func CreateEC2Instance(ctx context.Context, input CreateEC2InstanceInput) (string, error) {
	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		return "", err
	}
	client := ec2.NewFromConfig(cfg)

	// Read AMI ID from env var (region-specific — override via AWS_EC2_AMI_ID in .env)
	amiID := os.Getenv("AWS_EC2_AMI_ID")
	if amiID == "" {
		amiID = "ami-060e277c0d4cce553" // Default: Amazon Linux 2023 (ap-southeast-1)
	}
	
	var instType ec2types.InstanceType = ec2types.InstanceType(input.InstanceType)
	if input.InstanceType == "" {
		instType = ec2types.InstanceTypeT3Micro
	}

	runInput := &ec2.RunInstancesInput{
		ImageId:      aws.String(amiID),
		InstanceType: instType,
		MinCount:     aws.Int32(1),
		MaxCount:     aws.Int32(1),
		TagSpecifications: []ec2types.TagSpecification{
			{
				ResourceType: ec2types.ResourceTypeInstance,
				Tags: []ec2types.Tag{
					{
						Key:   aws.String("Name"),
						Value: aws.String(input.Name),
					},
					{
						Key:   aws.String("Owner"),
						Value: aws.String(input.OwnerTeam),
					},
					{
						Key:   aws.String("Department"),
						Value: aws.String(input.OwnerDept),
					},
					{
						Key:   aws.String("Environment"),
						Value: aws.String(input.Environment),
					},
					{
						Key:   aws.String("ProjectID"),
						Value: aws.String(input.ProjectID),
					},
					{
						Key:   aws.String("Description"),
						Value: aws.String(input.Description),
					},
				},
			},
		},
	}

	output, err := client.RunInstances(ctx, runInput)
	if err != nil {
		log.Printf("[AWS Error] Failed to run instances: %v\n", err)
		return "", err
	}

	if len(output.Instances) == 0 {
		return "", fmt.Errorf("no instances returned from AWS RunInstances")
	}

	instanceID := *output.Instances[0].InstanceId
	log.Printf("[AWS Info] Launched instance %s successfully\n", instanceID)

	return instanceID, nil
}