package finance

import (
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/ops"
	"strings"
)

// system cost per day for FinOps platform operations
const SystemCostPerDay = 5.0

// CalROI calculates Return on Investment and savings metrics for idle resources
func CalROI(resource []models.CloudResource) models.ROIResult {
	var totalSpend float64
	var wastedCost float64
	var savingsDaily float64
	activeCount := 0
	idleCount := 0
	softDeletedCount := 0

	idleThreshold := ops.GetEffectiveThreshold()

	for _, r := range resource {
		switch strings.ToLower(r.Status) {
		case "active":
			totalSpend += r.CostPerDay
			activeCount++
			if r.DayIdle > idleThreshold {
				wastedCost += r.CostPerDay
				idleCount++
			}
		case "soft-deleted":
			wastedCost += r.CostPerDay
			savingsDaily += r.CostPerDay
			softDeletedCount++
		}
	}

	savingsMonthly := savingsDaily * 30.0

	wastePercent := 0.0
	if totalSpend > 0 {
		wastePercent = (wastedCost / totalSpend) * 100.0
	}
	
	roi := 0.0
	if SystemCostPerDay > 0 {
		roi = ((savingsDaily - SystemCostPerDay) / SystemCostPerDay) * 100.0
	}
	
	paybackDays := -1.0
	if savingsDaily > SystemCostPerDay {
		paybackDays = SystemCostPerDay / (savingsDaily - SystemCostPerDay)
	}

	return models.ROIResult{
		TotalSpentDaily:  totalSpend,
		WastedCostDaily:  wastedCost,
		SavingsDaily:     savingsDaily,
		SavingsMonthly:   savingsMonthly,
		WastePercent:     wastePercent,
		ROIPercent:       roi,
		PaybackDays:      paybackDays,
		SystemCostDaily:  SystemCostPerDay,
		ActiveCount:      activeCount,
		IdleCount:        idleCount,
		SoftDeletedCount: softDeletedCount,
	}
}