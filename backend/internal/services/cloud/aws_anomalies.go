package cloud

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer/types"
)

type CostAnomalyItem struct {
	AnomalyID        string  `json:"anomaly_id"`
	StartDate        string  `json:"start_date"`
	EndDate          string  `json:"end_date"`
	AnomalyScore     float64 `json:"anomaly_score"`
	ImpactTotal      float64 `json:"impact_total"`
	ImpactPercentage float64 `json:"impact_percentage"`
	RootCauseService string  `json:"root_cause_service"`
	RootCauseRegion  string  `json:"root_cause_region"`
}

type AnomalySummary struct {
	TotalAnomalies int               `json:"total_anomalies"`
	TotalImpactUSD float64           `json:"total_impact_usd"`
	Status         string            `json:"status"`
	StatusMessage  string            `json:"status_message"`
	Anomalies      []CostAnomalyItem `json:"anomalies"`
}

func GetCostAnomalies(ctx context.Context) (*AnomalySummary, error) {
	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS config: %w", err)
	}

	client := costexplorer.NewFromConfig(cfg)

	now := time.Now().UTC()
	thirtyDaysAgo := now.AddDate(0, 0, -30).Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	input := &costexplorer.GetAnomaliesInput{
		DateInterval: &types.AnomalyDateInterval{
			StartDate: aws.String(thirtyDaysAgo),
			EndDate:   aws.String(yesterday),
		},
	}

	output, err := client.GetAnomalies(ctx, input)
	if err != nil {
		log.Printf("[AWS Anomalies] API Info/Warning: %v\n", err)
		return &AnomalySummary{
			Status:        "UNAVAILABLE",
			StatusMessage: fmt.Sprintf("Cost Anomaly Detection: %v", err.Error()),
			Anomalies:     []CostAnomalyItem{},
		}, nil
	}

	summary := &AnomalySummary{
		Status:    "OK",
		Anomalies: make([]CostAnomalyItem, 0),
	}

	for _, anomaly := range output.Anomalies {
		item := CostAnomalyItem{
			AnomalyID: aws.ToString(anomaly.AnomalyId),
			StartDate: aws.ToString(anomaly.AnomalyStartDate),
			EndDate:   aws.ToString(anomaly.AnomalyEndDate),
		}

		if anomaly.AnomalyScore != nil {
			item.AnomalyScore = anomaly.AnomalyScore.CurrentScore
		}

		if anomaly.Impact != nil {
			item.ImpactTotal = anomaly.Impact.TotalImpact
			if anomaly.Impact.TotalImpactPercentage != nil {
				item.ImpactPercentage = *anomaly.Impact.TotalImpactPercentage
			}
			summary.TotalImpactUSD += item.ImpactTotal
		}

		if len(anomaly.RootCauses) > 0 {
			item.RootCauseService = aws.ToString(anomaly.RootCauses[0].Service)
			item.RootCauseRegion = aws.ToString(anomaly.RootCauses[0].Region)
		}

		summary.Anomalies = append(summary.Anomalies, item)
		summary.TotalAnomalies++
	}

	if summary.TotalAnomalies > 0 {
		summary.Status = "ACTIVE"
		summary.StatusMessage = fmt.Sprintf("%d cost anomaly/anomalies detected by AWS ML in the last 30 days", summary.TotalAnomalies)
	} else {
		summary.StatusMessage = "No cost anomalies detected by AWS ML in the last 30 days"
	}

	return summary, nil
}
