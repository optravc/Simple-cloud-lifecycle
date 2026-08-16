import { UserRole } from "./auth";
import { AnomalySummary } from "./aws_extended";

export interface ProjectBudget {
  id: string;
  name: string;
  owner: string;
  provider: string;
  spent: number;
}

export interface BudgetGovernanceToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  userRole: UserRole;
  onOpenAdjustModal: () => void;
}
export interface DepartmentBudget {
  id: number;
  name: string;
  allocated: number;
  spent: number;
  forecasted: number;
  owner: string;
  status: string; 
  slack: string;
  email: string;
  projects: ProjectBudget[];
}

export interface BudgetsData {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  forecastedSpend: number;
  usagePercent: number;
  budgetTrend: { value: number }[];
  spentTrend: { value: number }[];
  remainingTrend: { value: number }[];
  departments: DepartmentBudget[];
}

export interface BudgetAllocationChartProps {
  departments: DepartmentBudget[];
}

export interface CostCentersGovernanceTableProps {
  departments: DepartmentBudget[];
  totalCount: number;
  filteredCount: number;
  page: number;
  rowsPerPage: number;
  userRole: UserRole;
  onPageChange: (_: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenAdjustModal: (deptId?: number) => void;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: string;
  trendData?: { value: number }[];
  isWarning?: boolean;
}

export interface ProgressProps {
  usagePercent: number;
  totalSpent: number;
  totalBudget: number;
  departments: DepartmentBudget[];
}

export interface CostAnomalyBannerProps {
  data: AnomalySummary | null;
  loading: boolean;
  userRole?: string;
}
