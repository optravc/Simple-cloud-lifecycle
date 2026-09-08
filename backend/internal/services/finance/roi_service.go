package finance

import (
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/ops"
	"database/sql"
	"strings"
)

// DefaultSystemCostPerDay is the fallback value when system_settings DB has no entry
const DefaultSystemCostPerDay = 5.0

// CalROI calculates Return on Investment and savings metrics for idle resources.
// systemCostPerDay is read from DB (system_settings key: system_cost_per_day).
func CalROI(resource []models.CloudResource, db *sql.DB) models.ROIResult {
	var totalSpend float64
	var wastedCost float64
	var savingsDaily float64
	activeCount := 0
	idleCount := 0
	softDeletedCount := 0

	idleThreshold := ops.GetEffectiveThreshold(db)
	systemCostPerDay := ops.GetSettingFloat64(db, "system_cost_per_day", DefaultSystemCostPerDay)

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
	if systemCostPerDay > 0 {
		roi = ((savingsDaily - systemCostPerDay) / systemCostPerDay) * 100.0
	}

	paybackDays := -1.0
	if savingsDaily > systemCostPerDay {
		paybackDays = systemCostPerDay / (savingsDaily - systemCostPerDay)
	}

	return models.ROIResult{
		TotalSpentDaily:  totalSpend,
		WastedCostDaily:  wastedCost,
		SavingsDaily:     savingsDaily,
		SavingsMonthly:   savingsMonthly,
		WastePercent:     wastePercent,
		ROIPercent:       roi,
		PaybackDays:      paybackDays,
		SystemCostDaily:  systemCostPerDay,
		ActiveCount:      activeCount,
		IdleCount:        idleCount,
		SoftDeletedCount: softDeletedCount,
	}
}