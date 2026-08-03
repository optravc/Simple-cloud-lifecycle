package models

import "time"

type CloudR struct {
	ID         string    `json:"ID"`
	Name       string    `json:"Name"`
	Type       string    `json:"Type"`
	Provider   string    `json:"Provider"`
	Owner      string    `json:"Owner"`
	OwnerEmail string    `json:"OwnerEmail"` 
	DayIdle    int       `json:"DayIdle"`
	Costperday float64   `json:"Costperday"`
	Status     string    `json:"Status"`
	Environment string   `json:"Environment"`
	Deadline   time.Time `json:"Deadline"` 

}