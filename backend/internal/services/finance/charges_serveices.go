package finance

import (
	"automated-lifecycle/backend/internal/models" 
	"database/sql"
	"log"
)

// GetRecentCharges รับค่า db เข้ามา Query
func GetRecentCharges(db *sql.DB) []models.ChargeItem {
	query := `
		SELECT id, provider, icon, usage, interval, amount, percent, is_up, projected 
		FROM recent_charges
	`

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Database query error: %v", err)
		return []models.ChargeItem{} 
	}
	defer rows.Close()

	var charges []models.ChargeItem

	for rows.Next() {
		var item models.ChargeItem
		err := rows.Scan(
			&item.ID,
			&item.Provider,
			&item.Icon,
			&item.Usage,
			&item.Interval,
			&item.Amount,
			&item.Percent,
			&item.IsUp,
			&item.Projected,
		)
		if err != nil {
			log.Printf("Row scan error: %v", err)
			continue
		}
		charges = append(charges, item)
	}

	return charges
}