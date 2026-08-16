export interface CostAnomalyItem {
  anomaly_id: string;
  start_date: string;
  end_date: string;
  anomaly_score: number;
  impact_total: number;
  impact_percentage: number;
  root_cause_service: string;
  root_cause_region: string;
}

export interface AnomalySummary {
  total_anomalies: number;
  total_impact_usd: number;
  status: 'ACTIVE' | 'OK' | 'UNAVAILABLE' | (string & {});
  status_message: string;
  anomalies: CostAnomalyItem[];
}

export interface SavingsPlanRecommendationItem {
  plan_type: string;
  term_in_years: string;
  payment_option: string;
  hourly_commitment: number;
  estimated_monthly_savings: number;
  estimated_savings_percent: number;
  estimated_on_demand_cost: number;
}

export interface SavingsPlansSummary {
  total_recommendations: number;
  total_monthly_savings_usd: number;
  status: 'ACTIVE' | 'UNAVAILABLE' | (string & {});
  status_message: string;
  recommendations: SavingsPlanRecommendationItem[];
}

export interface UnattachedVolumeItem {
  volume_id: string;
  size_gb: number;
  volume_type: string;
  state: string;
  create_time: string;
  estimated_monthly_cost: number;
}

export interface UnusedElasticIPItem {
  allocation_id: string;
  public_ip: string;
  estimated_monthly_cost: number;
}

export interface UnattachedResourceSummary {
  total_unattached_volumes: number;
  total_unused_elastic_ips: number;
  total_monthly_waste_usd: number;
  status: 'ACTIVE' | 'OK' | 'UNAVAILABLE' | (string & {});
  status_message: string;
  volumes: UnattachedVolumeItem[];
  elastic_ips: UnusedElasticIPItem[];
}
