/**
 * Invoice Service - Decouples cost calculations from the Frontend views (Dumb UI compliance).
 */

import { fetchWithAuth } from './fetchWithAuth';
import { InvoiceItem, TrendItem, FinOpsDetails} from '@/types/invoice';
import { API_BASE } from './api';

export type { Financials, InvoiceLineItem, InvoiceDepartmentAllocation, InvoiceItem, TrendItem, FinOpsDetails, FinOpsRecommendation } from '@/types/invoice';



const MOCK_INVOICES: InvoiceItem[] = [
  {
    id: 'INV-2026-001',
    provider: 'AWS',
    billingPeriod: 'JULY 1 - JULY 30',
    dueDate: '15 Aug 2026',
    amount: 30000,
    status: 'Paid',
    currency: 'USD',
    financials: {
      subTotal: 28037.38,
      taxRate: 7, // 7%
      taxAmount: 1962.62,
      grandTotal: 30000.00
    },
    lineItems: [
      { id: 1, invoiceId: 'INV-2026-001', serviceName: 'Amazon EC2', category: 'Compute', subtotal: 11214.95, taxAmount: 785.05, grandTotal: 12000.00, projectId: 'PRJ-001' },
      { id: 2, invoiceId: 'INV-2026-001', serviceName: 'Amazon RDS', category: 'Database', subtotal: 7009.35, taxAmount: 490.65, grandTotal: 7500.00, projectId: 'PRJ-001' },
      { id: 3, invoiceId: 'INV-2026-001', serviceName: 'Amazon S3', category: 'Storage', subtotal: 4205.61, taxAmount: 294.39, grandTotal: 4500.00, projectId: 'PRJ-001' },
      { id: 4, invoiceId: 'INV-2026-001', serviceName: 'AWS Support & Fees', category: 'Support', subtotal: 2803.74, taxAmount: 196.26, grandTotal: 3000.00, projectId: 'PRJ-001' },
      { id: 5, invoiceId: 'INV-2026-001', serviceName: 'AWSDataTransfer (Data Egress)', category: 'DataTransfer', subtotal: 2803.74, taxAmount: 196.26, grandTotal: 3000.00, projectId: 'PRJ-001' }
    ],
    departmentAllocations: [
      { id: 1, invoiceId: 'INV-2026-001', departmentId: 1, departmentName: 'Core Infrastructure', ratio: 45, allocatedAmount: 13500 },
      { id: 2, invoiceId: 'INV-2026-001', departmentId: 2, departmentName: 'Product Engineering', ratio: 30, allocatedAmount: 9000 },
      { id: 3, invoiceId: 'INV-2026-001', departmentId: 3, departmentName: 'Data Science & Analytics', ratio: 15, allocatedAmount: 4500 },
      { id: 4, invoiceId: 'INV-2026-001', departmentId: 7, departmentName: 'FinOps & Cloud Governance', ratio: 10, allocatedAmount: 3000 }
    ]
  },
  {
    id: 'INV-2026-002',
    provider: 'Azure',
    billingPeriod: 'JULY 1 - JULY 30',
    dueDate: '20 Aug 2026',
    amount: 40000,
    status: 'Pending',
    currency: 'USD',
    financials: {
      subTotal: 37383.18,
      taxRate: 7,
      taxAmount: 2616.82,
      grandTotal: 40000.00
    },
    lineItems: [
      { id: 6, invoiceId: 'INV-2026-002', serviceName: 'Azure Virtual Machines', category: 'Compute', subtotal: 16822.43, taxAmount: 1177.57, grandTotal: 18000.00, projectId: 'PRJ-002' },
      { id: 7, invoiceId: 'INV-2026-002', serviceName: 'Azure SQL Database', category: 'Database', subtotal: 11214.95, taxAmount: 785.05, grandTotal: 12000.00, projectId: 'PRJ-002' },
      { id: 8, invoiceId: 'INV-2026-002', serviceName: 'Azure Blob Storage', category: 'Storage', subtotal: 5607.48, taxAmount: 392.52, grandTotal: 6000.00, projectId: 'PRJ-002' },
      { id: 9, invoiceId: 'INV-2026-002', serviceName: 'Bandwidth & IP', category: 'DataTransfer', subtotal: 3738.32, taxAmount: 261.68, grandTotal: 4000.00, projectId: 'PRJ-002' }
    ],
    departmentAllocations: [
      { id: 5, invoiceId: 'INV-2026-002', departmentId: 1, departmentName: 'Core Infrastructure', ratio: 40, allocatedAmount: 16000 },
      { id: 6, invoiceId: 'INV-2026-002', departmentId: 2, departmentName: 'Product Engineering', ratio: 40, allocatedAmount: 16000 },
      { id: 7, invoiceId: 'INV-2026-002', departmentId: 3, departmentName: 'Data Science & Analytics', ratio: 20, allocatedAmount: 8000 }
    ]
  },
  {
    id: 'INV-2026-003',
    provider: 'GCP',
    billingPeriod: 'JULY 1 - JULY 30',
    dueDate: '10 Aug 2026',
    amount: 50000,
    status: 'Paid',
    currency: 'USD',
    financials: {
      subTotal: 46728.97,
      taxRate: 7,
      taxAmount: 3271.03,
      grandTotal: 50000.00
    },
    lineItems: [
      { id: 10, invoiceId: 'INV-2026-003', serviceName: 'Google Compute Engine', category: 'Compute', subtotal: 23364.49, taxAmount: 1635.51, grandTotal: 25000.00, projectId: 'PRJ-003' },
      { id: 11, invoiceId: 'INV-2026-003', serviceName: 'Google Cloud Storage', category: 'Storage', subtotal: 9345.79, taxAmount: 654.21, grandTotal: 10000.00, projectId: 'PRJ-003' },
      { id: 12, invoiceId: 'INV-2026-003', serviceName: 'BigQuery Analytics', category: 'Database', subtotal: 11214.95, taxAmount: 785.05, grandTotal: 12000.00, projectId: 'PRJ-003' },
      { id: 13, invoiceId: 'INV-2026-003', serviceName: 'Cloud Pub/Sub', category: 'DataTransfer', subtotal: 2803.74, taxAmount: 196.26, grandTotal: 3000.00, projectId: 'PRJ-003' }
    ],
    departmentAllocations: [
      { id: 8, invoiceId: 'INV-2026-003', departmentId: 2, departmentName: 'Product Engineering', ratio: 35, allocatedAmount: 17500 },
      { id: 9, invoiceId: 'INV-2026-003', departmentId: 3, departmentName: 'Data Science & Analytics', ratio: 35, allocatedAmount: 17500 },
      { id: 10, invoiceId: 'INV-2026-003', departmentId: 1, departmentName: 'Core Infrastructure', ratio: 15, allocatedAmount: 7500 },
      { id: 11, invoiceId: 'INV-2026-003', departmentId: 4, departmentName: 'Trust & Safety', ratio: 10, allocatedAmount: 5000 },
      { id: 12, invoiceId: 'INV-2026-003', departmentId: 6, departmentName: 'Executive / C-Level', ratio: 5, allocatedAmount: 2500 }
    ]
  },
  {
    id: 'INV-2026-004',
    provider: 'Alibaba Cloud',
    billingPeriod: 'JULY 1 - JULY 30',
    dueDate: '01 Aug 2026',
    amount: 18500,
    status: 'Overdue',
    currency: 'USD',
    financials: {
      subTotal: 17289.72,
      taxRate: 7,
      taxAmount: 1210.28,
      grandTotal: 18500.00
    },
    lineItems: [
      { id: 14, invoiceId: 'INV-2026-004', serviceName: 'ECS Instances', category: 'Compute', subtotal: 9345.79, taxAmount: 654.21, grandTotal: 10000.00, projectId: 'PRJ-004' },
      { id: 15, invoiceId: 'INV-2026-004', serviceName: 'ApsaraDB for RDS', category: 'Database', subtotal: 5607.48, taxAmount: 392.52, grandTotal: 6000.00, projectId: 'PRJ-004' },
      { id: 16, invoiceId: 'INV-2026-004', serviceName: 'Object Storage Service', category: 'Storage', subtotal: 2336.45, taxAmount: 163.55, grandTotal: 2500.00, projectId: 'PRJ-004' }
    ],
    departmentAllocations: [
      { id: 13, invoiceId: 'INV-2026-004', departmentId: 1, departmentName: 'Core Infrastructure', ratio: 65, allocatedAmount: 12025 },
      { id: 14, invoiceId: 'INV-2026-004', departmentId: 2, departmentName: 'Product Engineering', ratio: 35, allocatedAmount: 6475 }
    ]
  },
  {
    id: 'INV-2026-005',
    provider: 'Salesforce',
    billingPeriod: 'JULY 1 - JULY 30',
    dueDate: '25 Aug 2026',
    amount: 60000,
    status: 'Paid',
    currency: 'USD',
    financials: {
      subTotal: 56074.77,
      taxRate: 7,
      taxAmount: 3925.23,
      grandTotal: 60000.00
    },
    lineItems: [
      { id: 17, invoiceId: 'INV-2026-005', serviceName: 'Sales Cloud Platform', category: 'Platform', subtotal: 28037.38, taxAmount: 1962.62, grandTotal: 30000.00, projectId: undefined },
      { id: 18, invoiceId: 'INV-2026-005', serviceName: 'Marketing Cloud', category: 'Marketing', subtotal: 18691.59, taxAmount: 1308.41, grandTotal: 20000.00, projectId: undefined },
      { id: 19, invoiceId: 'INV-2026-005', serviceName: 'Tableau Analytics', category: 'Analytics', subtotal: 9345.79, taxAmount: 654.21, grandTotal: 10000.00, projectId: undefined }
    ],
    departmentAllocations: [
      { id: 15, invoiceId: 'INV-2026-005', departmentId: 2, departmentName: 'Product Engineering', ratio: 40, allocatedAmount: 24000 },
      { id: 16, invoiceId: 'INV-2026-005', departmentId: 5, departmentName: 'Finance', ratio: 25, allocatedAmount: 15000 },
      { id: 17, invoiceId: 'INV-2026-005', departmentId: 6, departmentName: 'Executive / C-Level', ratio: 20, allocatedAmount: 12000 },
      { id: 18, invoiceId: 'INV-2026-005', departmentId: 3, departmentName: 'Data Science & Analytics', ratio: 15, allocatedAmount: 9000 }
    ]
  },
  {
    id: 'INV-2026-006',
    provider: 'IBM Cloud',
    billingPeriod: 'JULY 1 - JULY 30',
    dueDate: '18 Aug 2026',
    amount: 15000,
    status: 'Pending',
    currency: 'USD',
    financials: {
      subTotal: 14018.69,
      taxRate: 7,
      taxAmount: 981.31,
      grandTotal: 15000.00
    },
    lineItems: [
      { id: 20, invoiceId: 'INV-2026-006', serviceName: 'IBM Virtual Servers', category: 'Compute', subtotal: 9345.79, taxAmount: 654.21, grandTotal: 10000.00, projectId: undefined },
      { id: 21, invoiceId: 'INV-2026-006', serviceName: 'IBM Cloud Object Storage', category: 'Storage', subtotal: 4672.90, taxAmount: 327.10, grandTotal: 5000.00, projectId: undefined }
    ],
    departmentAllocations: [
      { id: 19, invoiceId: 'INV-2026-006', departmentId: 1, departmentName: 'Core Infrastructure', ratio: 50, allocatedAmount: 7500 },
      { id: 20, invoiceId: 'INV-2026-006', departmentId: 3, departmentName: 'Data Science & Analytics', ratio: 30, allocatedAmount: 4500 },
      { id: 21, invoiceId: 'INV-2026-006', departmentId: 7, departmentName: 'FinOps & Cloud Governance', ratio: 20, allocatedAmount: 3000 }
    ]
  },
  {
    id: 'INV-2026-007',
    provider: 'Oracle',
    billingPeriod: 'JULY 1 - JULY 30',
    dueDate: '12 Aug 2026',
    amount: 28000,
    status: 'Paid',
    currency: 'USD',
    financials: {
      subTotal: 26168.22,
      taxRate: 7,
      taxAmount: 1831.78,
      grandTotal: 28000.00
    },
    lineItems: [
      { id: 22, invoiceId: 'INV-2026-007', serviceName: 'Oracle Compute', category: 'Compute', subtotal: 14018.69, taxAmount: 981.31, grandTotal: 15000.00, projectId: undefined },
      { id: 23, invoiceId: 'INV-2026-007', serviceName: 'Oracle Autonomous DB', category: 'Database', subtotal: 12149.53, taxAmount: 850.47, grandTotal: 13000.00, projectId: undefined }
    ],
    departmentAllocations: [
      { id: 22, invoiceId: 'INV-2026-007', departmentId: 1, departmentName: 'Core Infrastructure', ratio: 35, allocatedAmount: 9800 },
      { id: 23, invoiceId: 'INV-2026-007', departmentId: 5, departmentName: 'Finance', ratio: 30, allocatedAmount: 8400 },
      { id: 24, invoiceId: 'INV-2026-007', departmentId: 6, departmentName: 'Executive / C-Level', ratio: 20, allocatedAmount: 5600 },
      { id: 25, invoiceId: 'INV-2026-007', departmentId: 4, departmentName: 'Trust & Safety', ratio: 15, allocatedAmount: 4200 }
    ]
  }
];

/**
 * Fetches all invoices with their pre-calculated financial data.
 * Simulates a server payload return.
 */
export async function getInvoices(): Promise<InvoiceItem[]> {
  try {

    const res = await fetchWithAuth(`${API_BASE}/invoices`);
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [...MOCK_INVOICES];
  } catch (err) {
    console.warn("Backend /api/invoices failed, falling back to mock data:", err);
    return [...MOCK_INVOICES];
  }
}

// HISTORICAL_TREND_DATA — 7 providers, 6 months, matching defaultTrendData in reportExporter.ts
// Jul 2026 totals: AWS $30k + Azure $40k + GCP $50k + SF $60k + IBM $15k + Oracle $28k + Alibaba $18.5k = $241,500
export const HISTORICAL_TREND_DATA = [
  { name: 'Feb 2026', AWS: 21200, Azure: 26500, GCP: 35000, Salesforce: 45000, IBMCloud: 12200, Oracle: 21000, Alibaba: 13800 },
  { name: 'Mar 2026', AWS: 19800, Azure: 28200, GCP: 38500, Salesforce: 43800, IBMCloud: 11500, Oracle: 20200, Alibaba: 14200 },
  { name: 'Apr 2026', AWS: 24500, Azure: 31000, GCP: 41200, Salesforce: 49000, IBMCloud: 13800, Oracle: 23500, Alibaba: 15500 },
  { name: 'May 2026', AWS: 22100, Azure: 34800, GCP: 44000, Salesforce: 52500, IBMCloud: 13100, Oracle: 25000, Alibaba: 16100 },
  { name: 'Jun 2026', AWS: 27800, Azure: 37200, GCP: 47500, Salesforce: 56000, IBMCloud: 14500, Oracle: 26800, Alibaba: 17400 },
  { name: 'Jul 2026', AWS: 30000, Azure: 40000, GCP: 50000, Salesforce: 60000, IBMCloud: 15000, Oracle: 28000, Alibaba: 18500 },
];

interface RawTrendItem {
  month: string;
  aws: number;
  azure: number;
  gcp: number;
  salesforce?: number;
  ibm?: number;
  oracle?: number;
  alibaba?: number;
}

export async function getCostTrends(): Promise<TrendItem[]> {
  try {

    const res = await fetchWithAuth(`${API_BASE}/reports`);
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    const data = await res.json();
    const rawTrend = data.cost_trend || [];
    return rawTrend.map((item: RawTrendItem) => ({
      name: `${item.month} 2026`,
      AWS: item.aws || 0,
      Azure: item.azure || 0,
      GCP: item.gcp || 0,
      Salesforce: item.salesforce || 0,
      IBMCloud: item.ibm || 0,
      Oracle: item.oracle || 0,
      Alibaba: item.alibaba || 0
    }));
  } catch (err) {
    console.warn("Backend /api/reports failed, falling back to mock trend data:", err);
    return [...HISTORICAL_TREND_DATA];
  }
}

/**
 * Maps currency code to standard symbols
 */
export function getCurrencySymbol(currency: 'USD' | 'THB'): string {
  switch (currency) {
    case 'THB':
      return '฿';
    case 'USD':
    default:
      return '$';
  }
}

/**
 * Generates FinOps optimization recommendations, tagging compliance metrics, 
 * anomalies, and amortized cost scaled dynamically to matching currency totals.
 */
export function getFinOpsDetails(invoiceId: string, subTotal: number, amount: number): FinOpsDetails {
  const finopsData: Record<string, FinOpsDetails> = {
    'INV-2026-001': {
      departments: [
        { name: 'Core Infrastructure', value: subTotal * 0.45 },
        { name: 'Product Engineering', value: subTotal * 0.30 },
        { name: 'Data Science & Analytics', value: subTotal * 0.15 },
        { name: 'FinOps & Cloud Governance', value: subTotal * 0.10 },
      ],
      services: [
        { name: 'Amazon EC2', value: subTotal * 0.4 },
        { name: 'Amazon RDS', value: subTotal * 0.25 },
        { name: 'Amazon S3', value: subTotal * 0.15 },
        { name: 'AWS Support & Fees', value: subTotal * 0.1 },
        { name: 'Data Transfer', value: subTotal * 0.1 },
      ],
      recommendations: [
        { title: 'Terminate 4 Idle EC2 Instances', saving: 450, action: 'Terminated', roiPercent: 810, paybackMonths: 1.3, annualizedSavings: 5400 },
        { title: 'Upgrade 12 EBS volumes from gp2 to gp3', saving: 180, action: 'Upgraded', roiPercent: 360, paybackMonths: 2.0, annualizedSavings: 2160 },
        { title: 'Delete 5 unattached Elastic IPs', saving: 25, action: 'Deleted', roiPercent: 1200, paybackMonths: 0.1, annualizedSavings: 300 },
      ],
      taggingCompliance: 92,
      untaggedCost: subTotal * 0.08,
      anomalyDetails: null,
      amortizedCost: amount * 0.95,
    },
    'INV-2026-002': {
      departments: [
        { name: 'Core Infrastructure', value: subTotal * 0.40 },
        { name: 'Product Engineering', value: subTotal * 0.40 },
        { name: 'Data Science & Analytics', value: subTotal * 0.20 },
      ],
      services: [
        { name: 'Azure Virtual Machines', value: subTotal * 0.45 },
        { name: 'Azure SQL Database', value: subTotal * 0.3 },
        { name: 'Azure Blob Storage', value: subTotal * 0.15 },
        { name: 'Bandwidth & IP', value: subTotal * 0.1 },
      ],
      recommendations: [
        { title: 'Rightsize 2 underutilized VM sizes', saving: 320, action: 'Right-sized', roiPercent: 540, paybackMonths: 1.8, annualizedSavings: 3840 },
        { title: 'Clean up unused Azure Disk snapshots', saving: 120, action: 'Cleaned', roiPercent: 480, paybackMonths: 1.0, annualizedSavings: 1440 },
      ],
      taggingCompliance: 81,
      untaggedCost: subTotal * 0.19,
      anomalyDetails: 'Warning: Detected unusual Azure SQL Database billing increase of +24% compared to the previous month',
      amortizedCost: amount,
    },
    'INV-2026-003': {
      departments: [
        { name: 'Product Engineering', value: subTotal * 0.35 },
        { name: 'Data Science & Analytics', value: subTotal * 0.35 },
        { name: 'Core Infrastructure', value: subTotal * 0.15 },
        { name: 'Trust & Safety', value: subTotal * 0.10 },
        { name: 'Executive / C-Level', value: subTotal * 0.05 },
      ],
      services: [
        { name: 'Google Compute Engine', value: subTotal * 0.5 },
        { name: 'Google Cloud Storage', value: subTotal * 0.2 },
        { name: 'BigQuery Analytics', value: subTotal * 0.24 },
        { name: 'Cloud Pub/Sub', value: subTotal * 0.06 },
      ],
      recommendations: [
        { title: 'Setup BigQuery slot reservations', saving: 1200, action: 'Reserved', roiPercent: 960, paybackMonths: 1.1, annualizedSavings: 14400, npvUSD: 11800, irrPercent: 185 },
        { title: 'Setup GCS lifecycle rule to archive logs', saving: 350, action: 'Configured', roiPercent: 420, paybackMonths: 2.2, annualizedSavings: 4200 },
      ],
      taggingCompliance: 96,
      untaggedCost: subTotal * 0.04,
      anomalyDetails: null,
      amortizedCost: amount * 0.92,
    },
    'INV-2026-004': {
      departments: [
        { name: 'Core Infrastructure', value: subTotal * 0.65 },
        { name: 'Product Engineering', value: subTotal * 0.35 },
      ],
      services: [
        { name: 'ECS Instances', value: subTotal * 0.54 },
        { name: 'ApsaraDB for RDS', value: subTotal * 0.32 },
        { name: 'Object Storage Service', value: subTotal * 0.14 },
      ],
      recommendations: [
        { title: 'Release 3 unassociated EIPs', saving: 1500, action: 'Released', roiPercent: 750, paybackMonths: 0.8, annualizedSavings: 18000 },
        { title: 'Purchase ECS Savings Plan', saving: 2200, action: 'Purchased', roiPercent: 380, paybackMonths: 3.1, annualizedSavings: 26400, npvUSD: 21500, irrPercent: 142 },
      ],
      taggingCompliance: 74,
      untaggedCost: subTotal * 0.26,
      anomalyDetails: 'Warning: Detected unusual ECS cost spike during the weekend (instances were not shut down during holidays)',
      amortizedCost: amount,
    },
    'INV-2026-005': {
      departments: [
        { name: 'Product Engineering', value: subTotal * 0.40 },
        { name: 'Finance', value: subTotal * 0.25 },
        { name: 'Executive / C-Level', value: subTotal * 0.20 },
        { name: 'Data Science & Analytics', value: subTotal * 0.15 },
      ],
      services: [
        { name: 'Sales Cloud Platform', value: subTotal * 0.50 },
        { name: 'Marketing Cloud', value: subTotal * 0.33 },
        { name: 'Tableau Analytics', value: subTotal * 0.17 },
      ],
      recommendations: [
        { title: 'Reclaim 15 inactive Salesforce licenses', saving: 850, action: 'Reclaimed', roiPercent: 680, paybackMonths: 0.5, annualizedSavings: 10200 },
        { title: 'Consolidate Tableau Enterprise seats', saving: 450, action: 'Consolidated', roiPercent: 320, paybackMonths: 1.5, annualizedSavings: 5400 },
      ],
      taggingCompliance: 88,
      untaggedCost: subTotal * 0.12,
      anomalyDetails: null,
      amortizedCost: amount,
    },
    'INV-2026-006': {
      departments: [
        { name: 'Core Infrastructure', value: subTotal * 0.50 },
        { name: 'Data Science & Analytics', value: subTotal * 0.30 },
        { name: 'FinOps & Cloud Governance', value: subTotal * 0.20 },
      ],
      services: [
        { name: 'IBM Virtual Servers', value: subTotal * 0.67 },
        { name: 'IBM Cloud Object Storage', value: subTotal * 0.33 },
      ],
      recommendations: [
        { title: 'Power off non-prod IBM VSIs on weekends', saving: 380, action: 'Scheduled', roiPercent: 510, paybackMonths: 1.0, annualizedSavings: 4560 },
      ],
      taggingCompliance: 83,
      untaggedCost: subTotal * 0.17,
      anomalyDetails: null,
      amortizedCost: amount,
    },
    'INV-2026-007': {
      departments: [
        { name: 'Core Infrastructure', value: subTotal * 0.35 },
        { name: 'Finance', value: subTotal * 0.30 },
        { name: 'Executive / C-Level', value: subTotal * 0.20 },
        { name: 'Trust & Safety', value: subTotal * 0.15 },
      ],
      services: [
        { name: 'Oracle Compute', value: subTotal * 0.54 },
        { name: 'Oracle Autonomous DB', value: subTotal * 0.46 },
      ],
      recommendations: [
        { title: 'Auto-scaling schedule for Autonomous DB', saving: 620, action: 'Automated', roiPercent: 440, paybackMonths: 1.6, annualizedSavings: 7440 },
      ],
      taggingCompliance: 90,
      untaggedCost: subTotal * 0.10,
      anomalyDetails: null,
      amortizedCost: amount,
    },
  };

  return finopsData[invoiceId] || {
    departments: [
      { name: 'Core Infrastructure', value: subTotal * 0.50 },
      { name: 'Product Engineering', value: subTotal * 0.30 },
      { name: 'Data Science & Analytics', value: subTotal * 0.20 },
    ],
    services: [
      { name: 'Compute', value: subTotal * 0.7 },
      { name: 'Storage', value: subTotal * 0.3 },
    ],
    recommendations: [
      { title: 'Configure resource tags to identify owners', saving: 150, action: 'Configured', roiPercent: 300, paybackMonths: 1.0, annualizedSavings: 1800 },
    ],
    taggingCompliance: 80,
    untaggedCost: subTotal * 0.2,
    anomalyDetails: null,
    amortizedCost: amount,
  };
}
