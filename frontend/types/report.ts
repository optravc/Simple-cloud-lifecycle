

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

 export interface RoiSummary {
  WastedCostDaily: number;
}

export interface ReportsResponse {
  cost_trend: ReportTrendItem[];
  scheduled_reports: ScheduledReport[];
  roi_summary: RoiSummary;
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