package cloud

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer/types"
)

// SyncAWSCostData ดึงข้อมูลจาก AWS Cost Explorer และอัปเดตลง Database
func SyncAWSCostData(db *sql.DB) error {
	ctx := context.TODO()
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return fmt.Errorf("unable to load SDK config: %v", err)
	}

	ceClient := costexplorer.NewFromConfig(cfg)

	// 2. time 
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	// AWS Cost Explorer กำหนดให้ End Date ต้องเป็น Exclusive (วันถัดไป)
	endOfPeriod := now.AddDate(0, 0, 1).Format("2006-01-02") 

	// 3.  Request ให้ AWS Group ตาม Tag ที่ชื่อ "Project"
	req := &costexplorer.GetCostAndUsageInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(startOfMonth),
			End:   aws.String(endOfPeriod),
		},
		Granularity: types.GranularityMonthly,
		Metrics:     []string{"UnblendedCost"},
		GroupBy: []types.GroupDefinition{
			{
				Type: types.GroupDefinitionTypeTag,
				Key:  aws.String("Project"),
			},
		},
	}
	resp, err := ceClient.GetCostAndUsage(ctx, req)
	if err != nil {
		return fmt.Errorf("failed to get cost and usage: %v", err)
	}

	// 5. save to Database
	recordMonth := startOfMonth

	for _, resultByTime := range resp.ResultsByTime {
		for _, group := range resultByTime.Groups {
			if len(group.Keys) == 0 {
				continue
			}

			keyParts := strings.Split(group.Keys[0], "$")
			if len(keyParts) < 2 {
				continue
			}
			
			projectID := keyParts[1]
			if projectID == "" {
				// ข้ามค่าใช้จ่ายที่ไม่ได้ติด Tag Project (ในอนาคตจะเขียน Logic โยนเข้าแผนกส่วนกลางแทน)
				continue
			}

			spend := group.Metrics["UnblendedCost"].Amount
			isTagged := true
			query := `
				INSERT INTO project_costs (project_id, record_month, spend, is_tagged)
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (project_id, record_month) 
				DO UPDATE SET 
					spend = EXCLUDED.spend,
					updated_at = CURRENT_TIMESTAMP
			`
			_, err := db.ExecContext(ctx, query, projectID, recordMonth, spend, isTagged)
			if err != nil {
				log.Printf("[AWS Sync] Failed to update cost for project %s: %v\n", projectID, err)
			}
		}
	}

	log.Println("[AWS Sync] Successfully synced cost data from AWS Cost Explorer")
	return nil
}