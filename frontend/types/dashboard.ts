import { SelectChangeEvent } from '@mui/material';

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

export interface PieData {
  name: string;
  value: number;
  color?: string; 
}

export interface CostBreakdownCardProps {
  data?: PieData[];
  selectedDept?: string;
  onDeptChange?: (event: SelectChangeEvent) => void;
  disabled?: boolean;
}

export interface DashboardKpiCardsProps {
  totalExpenditure?: number;
  expData?: number[];          
  expChange?: number;
  totalSavings?: number;
  savData?: number[];          
  savChange?: number;
  usedAllocation?: number | string;
  allocData?: number[];        
  allocChange?: number;
}

export interface TrendProps {
  value: number;
  type: 'cost' | 'good'; // 'cost' means up is bad, down is good; 'good' means up is good, down is bad
}


