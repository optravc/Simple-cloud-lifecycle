package models

import "time"

type CloudResource struct {
	ID          string    `json:"ID"`
	Name        string    `json:"Name"`
	Type        string    `json:"Type"`
	Provider    string    `json:"Provider"`
	Owner       string    `json:"Owner"`
	OwnerEmail  string    `json:"OwnerEmail"` 
	Department  string    `json:"Department"`
	DayIdle     int       `json:"DayIdle"`
	CostPerDay  float64   `json:"Costperday"` 
	Status      string    `json:"Status"`
	Environment string    `json:"Environment"`
	Description string    `json:"Description,omitempty"`
	Deadline    time.Time `json:"Deadline"` 
}