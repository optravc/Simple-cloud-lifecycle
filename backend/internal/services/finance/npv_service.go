package finance

import (
	"automated-lifecycle/backend/internal/models"
	"fmt"
	"math"
)

type NPVResult struct {
	ResourceID   string  `json:"ResourceID"`
	ResourceName string  `json:"ResourceName"`
	DayIdle      int     `json:"DayIdle"`
	CostPerDay   float64 `json:"CostPerDay"`

	PVifKept  float64 `json:"PVifKept"`
	PVifSwept float64 `json:"PVifSwept"`
	NPV       float64 `json:"NPV"`

	ShouldSweep bool   `json:"ShouldSweep"`
	Reason      string `json:"Reason"`
}

func CalNPVPerInstance(resource []models.CloudResource, discountRate float64) []NPVResult {
	results := make([]NPVResult, 0, len(resource))
	if discountRate < 0 {
		discountRate = 0
	}

	dailyDiscountRate := discountRate / 365.0

	for _, r := range resource {
		pvIfKept := 0.0
		for day := 1; day <= r.DayIdle; day++ {
			factor := math.Pow(1+dailyDiscountRate, float64(day))
			pvIfKept += r.CostPerDay / factor
		}

		pvIfSwept := r.CostPerDay
		npv := pvIfKept - pvIfSwept

		reason := "Keep resource"
		shouldSweep := false
		if npv > 0 {
			shouldSweep = true
			reason = fmt.Sprintf("Sweeping reduces present value cost by %.2f", npv)
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

	return results
}
