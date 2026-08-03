package models

type AllocationItem struct {
	ID              string  `json:"id"`
	Department      string  `json:"department"`
	ProjectName     string  `json:"projectName"`
	Owner           string  `json:"owner"`
	Provider        string  `json:"provider"`
	AllocationModel string  `json:"allocationModel"`
	Spend           float64 `json:"spend"`
	MoMChange       float64 `json:"momChange"`
	IsTagged        bool    `json:"isTagged"`
}

type AllocationDepartmentSummary struct {
	Department string  `json:"department"`
	Projects   int     `json:"projects"`
	Spend      float64 `json:"spend"`
	Tagged     int     `json:"tagged"`
}

type AllocationSummary struct {
	TotalSpend      float64                     `json:"totalSpend"`
	ComplianceRate  float64                     `json:"complianceRate"`
	TaggedCount     int                         `json:"taggedCount"`
	UntaggedCount   int                         `json:"untaggedCount"`
	AverageMoMChange float64                    `json:"averageMomChange"`
	Departments     []AllocationDepartmentSummary `json:"departments"`
}

type AllocationResponse struct {
	Status      string           `json:"status"`
	GeneratedAt string           `json:"generatedAt"`
	Summary     AllocationSummary `json:"summary"`
	Allocations []AllocationItem `json:"allocations"`
}


type ServiceBreakdownItem struct {
	ServiceName string  `json:"serviceName"`
	UsageType   string  `json:"usageType"`
	Cost        float64 `json:"cost"`
}