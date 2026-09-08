package finance

import (
	"automated-lifecycle/backend/internal/models"
	"automated-lifecycle/backend/internal/services/ops"
	"database/sql"
	"fmt"
	"math"
)

type NPVResult struct {
	ResourceID   string  `json:"ResourceID"`
	ResourceName string  `json:"ResourceName"`
	DayIdle      int     `json:"DayIdle"`
	CostPerDay   float64 `json:"CostPerDay"`

	PVifKept  float64 `json:"PVifKept"`
	PVifSwept float64 `json:"PVifSwept"` // always 0: cloud resource termination is free
	NPV       float64 `json:"NPV"`

	ShouldSweep bool   `json:"ShouldSweep"`
	Reason      string `json:"Reason"`
}

// NPVSummary aggregates NPV results across all resources
type NPVSummary struct {
	TotalResources      int     `json:"TotalResources"`      // all resources evaluated
	SweepCandidates     int     `json:"SweepCandidates"`     // count where ShouldSweep = true
	EstimatedSavingsDay float64 `json:"EstimatedSavingsDay"` // sum of costPerDay for sweep candidates
	TotalNPV            float64 `json:"TotalNPV"`            // sum of NPV across all candidates
	DiscountRate        float64 `json:"DiscountRate"`        // annual rate used
}

// GetDefaultDiscountRate reads npv_discount_rate from system_settings (default 5%)
func GetDefaultDiscountRate(db *sql.DB) float64 {
	return ops.GetSettingFloat64(db, "npv_discount_rate", 0.05)
}

// CalNPVPerInstance calculates NPV for each cloud resource to decide if it should be swept.
// Only resources with DayIdle >= idleThreshold are considered sweep candidates.
// PVifSwept = 0 because cloud resource termination has no monetary cost.
func CalNPVPerInstance(resource []models.CloudResource, discountRate float64, db *sql.DB) ([]NPVResult, NPVSummary) {
	results := make([]NPVResult, 0, len(resource))
	if discountRate < 0 {
		discountRate = 0
	}

	idleThreshold := ops.GetEffectiveThreshold(db)
	dailyDiscountRate := discountRate / 365.0

	var sweepCandidates int
	var estimatedSavingsDay float64
	var totalNPV float64

	for _, r := range resource {
		// PVifKept: discounted present value of all future idle days
		pvIfKept := 0.0
		for day := 1; day <= r.DayIdle; day++ {
			factor := math.Pow(1+dailyDiscountRate, float64(day))
			pvIfKept += r.CostPerDay / factor
		}

		// PVifSwept = 0: terminating a cloud resource has no cost
		pvIfSwept := 0.0
		npv := pvIfKept - pvIfSwept

		// Only flag as ShouldSweep if resource has passed the idle threshold gate
		shouldSweep := false
		reason := "Keep resource — idle days below threshold"
		if r.DayIdle >= idleThreshold && npv > 0 {
			shouldSweep = true
			reason = fmt.Sprintf("Sweep saves %.2f USD (PV of %d idle days at %.1f%%/yr)", npv, r.DayIdle, discountRate*100)
			sweepCandidates++
			estimatedSavingsDay += r.CostPerDay
			totalNPV += npv
		}

		results = append(results, NPVResult{
			ResourceID:   r.ID,
			ResourceName: r.Name,
			DayIdle:      r.DayIdle,
			CostPerDay:   r.CostPerDay,
			PVifKept:     pvIfKept,
			PVifSwept:    pvIfSwept,
			NPV:          npv,
			ShouldSweep:  shouldSweep,
			Reason:       reason,
		})
	}

	summary := NPVSummary{
		TotalResources:      len(resource),
		SweepCandidates:     sweepCandidates,
		EstimatedSavingsDay: estimatedSavingsDay,
		TotalNPV:            totalNPV,
		DiscountRate:        discountRate,
	}

	return results, summary
}
