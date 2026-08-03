package finance

import (
	"automated-lifecycle/backend/internal/models"
	"context"
	"database/sql"
	"log"
	"sort"
	"strings"
	"time"
)

// ฟังก์ชันกรองข้อมูลตามเงื่อนไข Dropdown
func matchesAllocationFilter(item models.AllocationItem, selectedDept string, tagFilter string) bool {
	if selectedDept != "All" && item.Department != selectedDept {
		return false
	}
	if tagFilter == "Tagged" && !item.IsTagged {
		return false
	}
	if tagFilter == "Untagged" && item.IsTagged {
		return false
	}
	return true
}

// ฟังก์ชันคำนวณผลรวมของแต่ละแผนก (เหมือนเดิม)
func buildAllocationDepartmentSummaries(items []models.AllocationItem) ([]models.AllocationDepartmentSummary, float64, int, int, float64) {
	departments := make(map[string]*models.AllocationDepartmentSummary)
	totalSpend := 0.0
	taggedCount := 0
	untaggedCount := 0
	totalMom := 0.0

	for _, item := range items {
		totalSpend += item.Spend
		totalMom += item.MoMChange
		if item.IsTagged {
			taggedCount++
		} else {
			untaggedCount++
		}

		if _, ok := departments[item.Department]; !ok {
			departments[item.Department] = &models.AllocationDepartmentSummary{Department: item.Department}
		}
		summary := departments[item.Department]
		summary.Projects++
		summary.Spend += item.Spend
		if item.IsTagged {
			summary.Tagged++
		}
	}

	departmentSummaries := make([]models.AllocationDepartmentSummary, 0, len(departments))
	for _, summary := range departments {
		departmentSummaries = append(departmentSummaries, *summary)
	}

	sort.Slice(departmentSummaries, func(i, j int) bool {
		return departmentSummaries[i].Spend > departmentSummaries[j].Spend
	})

	return departmentSummaries, totalSpend, taggedCount, untaggedCount, totalMom
}

// GetCostAllocationData ดึงข้อมูลจาก PostgreSQL (แทนที่ของเดิมที่ใช้ Seed Data)
func GetCostAllocationData(ctx context.Context, db *sql.DB, selectedDept string, tagFilter string) (models.AllocationResponse, error) {
	
	// 1. คำสั่ง SQL สำหรับดึงและ JOIN ข้อมูลจาก 3 ตาราง
	query := `
		SELECT 
			p.id, 
			d.name as department, 
			p.name as project_name, 
			p.owner, 
			p.provider, 
			p.allocation_model, 
			pc.spend, 
			pc.mom_change, 
			pc.is_tagged
		FROM project_costs pc
		JOIN projects p ON pc.project_id = p.id
		JOIN departments d ON p.department_id = d.id
		WHERE pc.record_month = '2026-07-01' -- ดึงข้อมูลของเดือนล่าสุดที่บันทึกไว้
	`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		log.Println("Error querying cost allocation data:", err)
		return models.AllocationResponse{}, err
	}
	defer rows.Close()

	var allData []models.AllocationItem

	// 2. Map ข้อมูลจาก Database เข้าสู่ Struct AllocationItem
	for rows.Next() {
		var item models.AllocationItem
		err := rows.Scan(
			&item.ID,
			&item.Department,
			&item.ProjectName,
			&item.Owner,
			&item.Provider,
			&item.AllocationModel,
			&item.Spend,
			&item.MoMChange,
			&item.IsTagged,
		)
		if err != nil {
			log.Println("Error scanning row:", err)
			return models.AllocationResponse{}, err
		}
		allData = append(allData, item)
	}

	// 3. นำข้อมูลทั้งหมดมา Filter ตามที่หน้าบ้านส่งมา (Department, Tag)
	filtered := make([]models.AllocationItem, 0)
	for _, item := range allData {
		if matchesAllocationFilter(item, selectedDept, tagFilter) {
			filtered = append(filtered, item)
		}
	}

	// 4. นำข้อมูลทั้งหมด (allData) ไปสร้าง Summary Dashboard ด้านบน
departmentSummaries, totalSpend, taggedCount, untaggedCount, totalMom := buildAllocationDepartmentSummaries(filtered)

	complianceRate := 0.0
	if len(allData) > 0 {
		complianceRate = float64(taggedCount) / float64(len(allData)) * 100
	}

	averageMoMChange := 0.0
	if len(allData) > 0 {
		averageMoMChange = totalMom / float64(len(allData))
	}

	// 5. ส่ง Response กลับไปให้ Handler
	return models.AllocationResponse{
		Status:      "success",
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Summary: models.AllocationSummary{
			TotalSpend:       totalSpend,
			ComplianceRate:   complianceRate,
			TaggedCount:      taggedCount,
			UntaggedCount:    untaggedCount,
			AverageMoMChange: averageMoMChange,
			Departments:      departmentSummaries,
		},
		Allocations: filtered,
	}, nil
}

// GetProjectServiceBreakdown ดึงข้อมูลสัดส่วนค่าใช้จ่ายรายบริการคลาวด์แยกตาม Project ID สำหรับ Modal
func GetProjectServiceBreakdown(ctx context.Context, db *sql.DB, projectID string) ([]models.ServiceBreakdownItem, error) {
	query := `
		SELECT 
			name as service_name, 
			type as usage_type, 
			cost_per_day as cost 
		FROM cloud_resources 
		WHERE project_tag = $1
	`

	rows, err := db.QueryContext(ctx, query, projectID)
	if err != nil {
		log.Println("Error querying project service breakdown:", err)
		return nil, err
	}
	defer rows.Close()

	var items []models.ServiceBreakdownItem

	for rows.Next() {
		var item models.ServiceBreakdownItem
		err := rows.Scan(
			&item.ServiceName,
			&item.UsageType,
			&item.Cost,
		)
		if err != nil {
			log.Println("Error scanning breakdown row:", err)
			return nil, err
		}
		items = append(items, item)
	}

	return items, nil
}

func NormalizeAllocationFilter(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}