// Logic Roi value
package services

import (
	"automated-lifecycle/backend/internal/models"
)

// infra cost
const SystemCostPerDay =5.0

//CalROI

func CalROI(resource[]models.CloudR) models.ROIResult  {
	var totalSpend float64
	var wastedCost float64
	var savingsDaily float64
	activeCount := 0
	idleCount := 0
	softDeletedCount :=0

	for _, r:= range resource{
		switch r.Status {
		case "active":
			totalSpend += r.Costperday
			activeCount++
					//resource >14 =waste
			if r.DayIdle >14 {
				wastedCost += r.Costperday
				idleCount++
			}
		case "soft-deleted":
				//soft-deleted = savings
			wastedCost += r.Costperday
			savingsDaily += r.Costperday
			softDeletedCount++
		}
	}

	// savings = ค่าที่ประหยัดได้จาก soft-deleted resources
	savingsMonthly := savingsDaily *30

	wastePercent := 0.0
	if totalSpend > 0{
		wastePercent = (wastedCost / totalSpend)*100
		}
		roi :=0.0

		if SystemCostPerDay > 0{
			roi =((savingsDaily -SystemCostPerDay)/ SystemCostPerDay)*100
		}
		
		paybackDays := -1.0
		if savingsDaily > SystemCostPerDay{
		paybackDays = SystemCostPerDay / (savingsDaily - SystemCostPerDay)
		}

		return models.ROIResult{
			TotalSpentDaily: totalSpend,
			WastedCostDaily: wastedCost,
			SavingsDaily: savingsDaily,
			SavingsMonthly: savingsMonthly,
			WastePercent: wastePercent,
			ROIPercent: roi,
			PaybackDays: paybackDays,
			SystemCostDaily: SystemCostPerDay,
			ActiveCount: activeCount,
			IdleCount: idleCount,
			SoftDeletedCount: softDeletedCount,

		}
}