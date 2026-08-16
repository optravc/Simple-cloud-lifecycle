export interface EC2OptimizerRecommendation {
  instance_id: string;
  instance_name: string;
  current_instance_type: string;
  finding: 'OVER_PROVISIONED' | 'UNDER_PROVISIONED' | 'OPTIMAL' | (string & {});
  finding_reason_codes: string[];
  recommended_type: string;
  estimated_monthly_savings: number;
  currency: string;
}

export interface OptimizerSummary {
  total_recommendations: number;
  over_provisioned_count: number;
  under_provisioned_count: number;
  optimal_count: number;
  total_monthly_savings: number;
  status: 'ACTIVE' | 'UNAVAILABLE' | (string & {});
  status_message: string;
  recommendations: EC2OptimizerRecommendation[];
}
