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
  items_swept: number;
  saved_cost_daily: number;
  swept_details: string[];
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

export interface AllocationItem {
  id: string;
  department: string;
  projectName: string;
  owner: string;
  provider: string;
  allocationModel: string;
  spend: number;
  momChange: number;
  isTagged: boolean;
}

export interface AllocationDepartmentSummary {
  department: string;
  projects: number;
  spend: number;
  tagged: number;
}

export interface AllocationSummary {
  totalSpend: number;
  complianceRate: number;
  taggedCount: number;
  untaggedCount: number;
  averageMomChange: number;
  departments: AllocationDepartmentSummary[];
}

export interface AllocationResponse {
  status: string;
  generatedAt: string;
  summary: AllocationSummary;
  allocations: AllocationItem[];
}