package cloud

import "automated-lifecycle/backend/internal/models"


type CloudProvider interface {
	FetchResources() []models.CloudR
}