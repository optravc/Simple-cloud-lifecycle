
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

 export interface AllocationInsightsProps {
  selectedDept: string;
  complianceRate: number;
  taggedCount: number;
  untaggedCount: number;
  averageMomChange: number;
}
export interface AllocationTableProps {
  allocations: AllocationItem[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}
export interface ProjectDetailModalProps {
  project: AllocationItem | null;
  onClose: () => void;
}

export interface ServiceCost {
  serviceName: string;
  usageType: string;
  cost: number;
}

 interface PieChartItem {
  name: string;
  value: number;
  fill: string;
}

export interface AllocationDonutChartProps {
  selectedDept: string;
  pieDataWithColors: PieChartItem[];
  loading: boolean;
}

export interface AllocationFilterToolbarProps {
  selectedDept: string;
  onDeptChange: (dept: string) => void;
  tagFilter: string;
  onTagFilterChange: (tag: string) => void;
  onExport: () => void;
  disableExport: boolean;
}