package cloud

import (
	"context"
	"automated-lifecycle/backend/internal/models"
)

// SweepSettings คือ settings ที่รับมาจาก Frontend Dialog
type SweepSettings struct {
	CreateAMI bool   `json:"create_ami"`
	AMIName   string `json:"ami_name"`
	RetainEBS bool   `json:"retain_ebs"`
}

type CloudProvider interface {
	FetchResources(ctx context.Context) []models.CloudResource
}