

export interface TrendPoint {
  time: string;
  cpu: number;
  memory: number;
}

export interface ResourceItem {
  id: string;
  name: string;
  provider: string;
  type: string;
  cpuUsage: number;
  memoryUsage: number;
  status: 'Healthy' | 'Warning' | 'Critical';
}

export interface PerformanceResponse {
  summary: {
    avgCpu: number;
    avgMemory: number;
    activeNodes: number;
  };
  trend: TrendPoint[];
  instances: ResourceItem[];
}

export interface PerformanceMetricsCardsProps {
  avgCpu: number;
  avgMemory: number;
  activeNodes: number;
}

export interface TrendDataItem {
  month: string;
  aws: number;
  azure: number;
  gcp: number;
  salesforce?: number;
  ibm?: number;
  oracle?: number;
  alibaba?: number;
}

export interface ReportsTrendChartProps {
  data: TrendDataItem[];
}