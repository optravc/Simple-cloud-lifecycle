export interface CloudResource {
  ID: string;
  Name: string;
  Type: string;
  Provider: string;
  Owner: string;
  DayIdle: number;
  Costperday: number;
  Status: string;
}

export interface SweepResponse {
  ID: string;
  Items_swept: number;
  saved_cost_daily: number;
  Swept_details: string[];
}

export interface ChargeItem {
  id: string;
  provider: string;
  icon: string;
  usage: string;
  interval: string;
  amount: string;
  percent: number;
  isUp: boolean;
  projected: string;
}