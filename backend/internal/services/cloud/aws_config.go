package cloud

import (
	"context"
	"log"
	"os"

	"automated-lifecycle/backend/internal/middleware"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials/stscreds"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

// GetAWSConfig โหลด AWS Config และทำ Assume Role ตามสิทธิ์บทบาทของผู้ใช้งาน (RBAC)
func GetAWSConfig(ctx context.Context) (aws.Config, error) {
	// 1. โหลด Default Configuration (ซึ่งใช้ Credentials ใน .env หรือเครื่องนั้นๆ เป็นฐาน)
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return aws.Config{}, err
	}

	// 2. ดึงบทบาทจาก Context ที่ผ่านการแปลงใน auth middleware
	userRole := middleware.GetUserRole(ctx)
	if userRole == "" {
		return cfg, nil
	}

	// 3. ดึง IAM Role ARN สำหรับสิทธิ์บทบาทนั้นๆ จาก .env
	var roleARN string
	switch userRole {
	case "admin":
		roleARN = os.Getenv("ROLE_ARN_ADMIN")
	case "finance":
		roleARN = os.Getenv("ROLE_ARN_FINANCE")
	case "finops":
		roleARN = os.Getenv("ROLE_ARN_finops")
	case "lead":
		roleARN = os.Getenv("ROLE_ARN_LEAD")
	case "dev":
		roleARN = os.Getenv("ROLE_ARN_DEV")
	}

	// 4. หากไม่มีการระบุ IAM Role ARN ใน .env ให้ทำงานตามสิทธิ์ดิบปกติ (สำหรับทำ Local Testing/Development)
	if roleARN == "" {
		return cfg, nil
	}

	// 5. ดำเนินการสร้าง Credentials ชั่วคราวด้วยการ Assume Role ผ่าน STS
	log.Printf("[AWS STS] User role '%s' is assuming IAM Role: %s\n", userRole, roleARN)
	stsClient := sts.NewFromConfig(cfg)
	
	// สร้าง Provider สำหรับ Assume Role ชั่วคราว
	provider := stscreds.NewAssumeRoleProvider(stsClient, roleARN)
	cfg.Credentials = aws.NewCredentialsCache(provider)

	return cfg, nil
}
