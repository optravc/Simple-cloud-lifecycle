
export interface Financials {
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
}

export interface InvoiceLineItem {
  id: number;
  invoiceId: string;
  serviceName: string;
  category: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  projectId?: string;
}

export interface InvoiceDepartmentAllocation {
  id: number;
  invoiceId: string;
  departmentId: number;
  departmentName: string;
  ratio: number;
  allocatedAmount: number;
}

export interface InvoiceItem {
  id: string;
  provider: string;
  billingPeriod: string;
  dueDate: string;
  amount: number; 
  status: 'Paid' | 'Pending' | 'Overdue';
  currency: 'USD' | 'THB';
  financials: Financials;
  lineItems: InvoiceLineItem[];
  departmentAllocations: InvoiceDepartmentAllocation[];
}

export interface InvoiceDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceItem | null;
}

export interface InvoiceKpiCardsProps {
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  avgTaggingCompliance?: number;
  savingsPotential?: number;
}

export interface InvoicesTableProps {
  invoices: InvoiceItem[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedProvider: string;
  setSelectedProvider: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  onSelectInvoice: (invoice: InvoiceItem) => void;
}

export interface TrendItem {
  name: string;
  AWS: number;
  Azure: number;
  GCP: number;
  Alibaba?: number;
}

export interface FinOpsRecommendation {
  title: string;
  saving: number;
  action: string;
  roiPercent?: number;
  paybackMonths?: number;
  annualizedSavings?: number;
  npvUSD?: number;
  irrPercent?: number;
}

export interface FinOpsDetails {
  departments: { name: string; value: number }[];
  services: { name: string; value: number }[];
  recommendations: FinOpsRecommendation[];
  taggingCompliance: number;
  untaggedCost: number;
  anomalyDetails: string | null;
  amortizedCost: number;
}
