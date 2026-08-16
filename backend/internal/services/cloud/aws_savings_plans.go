package cloud

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer/types"
)

type SavingsPlanRecommendationItem struct {
	PlanType                string  `json:"plan_type"`                  // COMPUTE_SP, EC2_INSTANCE_SP
	TermInYears             string  `json:"term_in_years"`              // ONE_YEAR, THREE_YEARS
	PaymentOption           string  `json:"payment_option"`             // NO_UPFRONT, PARTIAL_UPFRONT, ALL_UPFRONT
	HourlyCommitment        float64 `json:"hourly_commitment"`
	EstimatedMonthlySavings float64 `json:"estimated_monthly_savings"`
	EstimatedSavingsPercent float64 `json:"estimated_savings_percent"`
	EstimatedOnDemandCost   float64 `json:"estimated_on_demand_cost"`
}

type SavingsPlansSummary struct {
	TotalRecommendations   int                              `json:"total_recommendations"`
	TotalMonthlySavingsUSD float64                          `json:"total_monthly_savings_usd"`
	Status                 string                           `json:"status"` // ACTIVE, UNAVAILABLE
	StatusMessage          string                           `json:"status_message"`
	Recommendations        []SavingsPlanRecommendationItem `json:"recommendations"`
}

func GetSavingsPlansRecommendations(ctx context.Context) (*SavingsPlansSummary, error) {
	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS config: %w", err)
	}

	client := costexplorer.NewFromConfig(cfg)

	input := &costexplorer.GetSavingsPlansPurchaseRecommendationInput{
		SavingsPlansType:     types.SupportedSavingsPlansTypeComputeSp,
		TermInYears:          types.TermInYearsOneYear,
		PaymentOption:        types.PaymentOptionNoUpfront,
		LookbackPeriodInDays: types.LookbackPeriodInDaysThirtyDays,
	}

	output, err := client.GetSavingsPlansPurchaseRecommendation(ctx, input)
	if err != nil {
		log.Printf("[AWS Savings Plans] API Info/Warning: %v\n", err)
		return &SavingsPlansSummary{
			Status:          "UNAVAILABLE",
			StatusMessage:   fmt.Sprintf("Savings Plans: %v", err.Error()),
			Recommendations: []SavingsPlanRecommendationItem{},
		}, nil
	}

	summary := &SavingsPlansSummary{
		Status:          "ACTIVE",
		StatusMessage:   "Retrieved AWS Savings Plans recommendations successfully",
		Recommendations: make([]SavingsPlanRecommendationItem, 0),
	}

	rec := output.SavingsPlansPurchaseRecommendation
	if rec == nil {
		return summary, nil
	}

	for _, detail := range rec.SavingsPlansPurchaseRecommendationDetails {
		item := parseRecommendationDetail(detail, rec)
		summary.TotalMonthlySavingsUSD += item.EstimatedMonthlySavings
		summary.Recommendations = append(summary.Recommendations, item)
		summary.TotalRecommendations++
	}

	return summary, nil
}

func parseRecommendationDetail(
	detail types.SavingsPlansPurchaseRecommendationDetail,
	rec *types.SavingsPlansPurchaseRecommendation,
) SavingsPlanRecommendationItem {
	item := SavingsPlanRecommendationItem{
		PlanType:      string(rec.SavingsPlansType),
		TermInYears:   string(rec.TermInYears),
		PaymentOption: string(rec.PaymentOption),
	}

	if detail.HourlyCommitmentToPurchase != nil {
		item.HourlyCommitment = parseStringToFloat(aws.ToString(detail.HourlyCommitmentToPurchase))
	}
	if detail.EstimatedMonthlySavingsAmount != nil {
		item.EstimatedMonthlySavings = parseStringToFloat(aws.ToString(detail.EstimatedMonthlySavingsAmount))
	}
	if detail.EstimatedSavingsPercentage != nil {
		item.EstimatedSavingsPercent = parseStringToFloat(aws.ToString(detail.EstimatedSavingsPercentage))
	}
	if detail.EstimatedOnDemandCost != nil {
		item.EstimatedOnDemandCost = parseStringToFloat(aws.ToString(detail.EstimatedOnDemandCost))
	}

	return item
}

func parseStringToFloat(val string) float64 {
	var f float64
	fmt.Sscanf(val, "%f", &f)
	return f
}
