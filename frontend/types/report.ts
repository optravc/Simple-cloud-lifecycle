export interface ReportTrendItem {
  month: string;
  aws: number;
  azure: number;
  gcp: number;
  salesforce?: number;
  ibm?: number;
  oracle?: number;
  alibaba?: number;
  other?: number;
}

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  recipients: string;
  status: string;
  lastRun?: string;
}

/** Per-resource NPV result from backend npv_analysis[] */
export interface NPVResult {
  ResourceID: string;
  ResourceName: string;
  DayIdle: number;
  CostPerDay: number;
  PVifKept: number;
  PVifSwept: number; // always 0 — cloud termination is free
  NPV: number;
  ShouldSweep: boolean;
  Reason: string;
}

/** Aggregated NPV summary from backend npv_summary */
export interface NPVSummary {
  TotalResources: number;
  SweepCandidates: number;
  EstimatedSavingsDay: number;
  TotalNPV: number;
  DiscountRate: number;
}

/** Full ROI result from backend roi_summary */
export interface RoiSummary {
  TotalSpentDaily: number;
  WastedCostDaily: number;
  SavingsDaily: number;
  SavingsMonthly: number;
  WastePercent: number;
  ROIPercent: number;
  PaybackDays: number;   // -1 means not break-even yet
  SystemCostDaily: number;
  ActiveCount: number;
  IdleCount: number;
  SoftDeletedCount: number;
}

export interface ReportsResponse {
  status?: string;
  cost_trend: ReportTrendItem[];
  scheduled_reports: ScheduledReport[];
  roi_summary: RoiSummary;
  npv_analysis?: NPVResult[];
  npv_summary?: NPVSummary;
}

export interface TrendDataItem {
  month: string;
  aws: number;
  azure: number;
  gcp: number;
}

export interface ReportItem {
  id: string;
  name: string;
  frequency: string;
  recipients: string;
  status: string;
}