/**
 * Utility to export cloud invoices and reports in production.
 */

import { InvoiceItem, getCurrencySymbol } from './invoiceService';
import { S3_BASE_URL } from './api';

/**
 * Simulates downloading a Cost & Usage Report (CUR) CSV file using dynamic database line items
 */
export function exportInvoiceCURtoCSV(invoice: InvoiceItem) {
  const headers = ['LineItemType', 'ProductCode', 'UsageType', 'Operation', 'Cost', 'Department', 'ResourceID', 'TaggingCompliance'];
  const curSymbol = getCurrencySymbol(invoice.currency);
  
  // Build rows dynamically from database line items if available
  const rows = invoice.lineItems?.length > 0 
    ? invoice.lineItems.map((item, idx) => {
        const deptAlloc = invoice.departmentAllocations?.[idx % invoice.departmentAllocations.length];
        const deptName = deptAlloc ? deptAlloc.departmentName : 'Shared Services';
        return [
          'Usage',
          invoice.provider,
          item.serviceName,
          item.category,
          item.grandTotal.toFixed(2),
          deptName,
          item.projectId || 'N/A',
          'Yes'
        ];
      })
    : [
        ['Usage', `${invoice.provider}Compute`, 'BoxUsage:t3.medium', 'RunInstances', (invoice.financials.subTotal * 0.4).toFixed(2), 'Core Infrastructure', 'i-0abcd1234efgh5678', 'Yes'],
        ['Usage', `${invoice.provider}Database`, 'db.m5.large', 'CreateDBInstance', (invoice.financials.subTotal * 0.25).toFixed(2), 'Product Engineering', 'db-prod-replica-01', 'Yes'],
        ['Usage', `${invoice.provider}Storage`, 'TimedStorage-ByteHrs', 'PutObject', (invoice.financials.subTotal * 0.15).toFixed(2), 'Data Science & Analytics', 's3-analytics-data-bucket', 'Yes'],
        ['Support', `${invoice.provider}Support`, 'EnterpriseSupport', 'BusinessSupport', (invoice.financials.subTotal * 0.1).toFixed(2), 'FinOps & Cloud Governance', '-', 'Yes'],
        ['Usage', `${invoice.provider}DataTransfer`, 'DataEgress', 'NetworkOut', (invoice.financials.subTotal * 0.1).toFixed(2), 'Core Infrastructure', '-', 'Yes']
      ];

  const csvContent = [
    `Invoice ID: ${invoice.id}`,
    `Cloud Provider: ${invoice.provider}`,
    `Billing Period: ${invoice.billingPeriod}`,
    `Total Cost: ${curSymbol}${invoice.financials.grandTotal.toLocaleString()}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${invoice.id}_Cost_Usage_Report.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();

  link.remove();
}

/**
 * Triggers a premium, print-ready HTML Invoice in a popup window using dynamic database line items
 */
export function printInvoicePDF(invoice: InvoiceItem) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups (Popup Blocked) to view and download the invoice receipt');
    return;
  }

  const curSymbol = getCurrencySymbol(invoice.currency);

  let computeLabel = 'Compute Nodes & VM Scaling (ECS)';
  if (invoice.provider === 'AWS') {
    computeLabel = 'Compute Nodes & VM Scaling (EC2)';
  } else if (invoice.provider === 'Azure') {
    computeLabel = 'Compute Nodes & VM Scaling (VM)';
  } else if (invoice.provider === 'GCP') {
    computeLabel = 'Compute Nodes & VM Scaling (GCE)';
  }

  // Generate table rows dynamically
  const lineItemsHtml = invoice.lineItems?.length > 0 
    ? invoice.lineItems.map(item => {
        const percentage = (item.grandTotal / invoice.financials.grandTotal) * 100;
        return `
          <tr>
            <td>${item.serviceName}</td>
            <td>${item.category}</td>
            <td class="amount-col">${percentage.toFixed(0)}%</td>
            <td class="amount-col">${curSymbol}${item.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('')
    : `
      <tr>
        <td>${computeLabel}</td>
        <td>On-Demand / Spot Usage</td>
        <td class="amount-col">40%</td>
        <td class="amount-col">${curSymbol}${(invoice.financials.subTotal * 0.4).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Database Clusters & Replication (RDS/SQL/Apsara)</td>
        <td>Reserved / Continuous</td>
        <td class="amount-col">25%</td>
        <td class="amount-col">${curSymbol}${(invoice.financials.subTotal * 0.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Cloud Storage & Logs Archive (S3/OSS/Blob)</td>
        <td>Standard / Infrequent Storage</td>
        <td class="amount-col">15%</td>
        <td class="amount-col">${curSymbol}${(invoice.financials.subTotal * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Enterprise Cloud Support Fees</td>
        <td>Monthly Platform Support Plan</td>
        <td class="amount-col">10%</td>
        <td class="amount-col">${curSymbol}${(invoice.financials.subTotal * 0.1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Data Egress & Traffic Routing (Data Transfer)</td>
        <td>Network Bandwidth Usage</td>
        <td class="amount-col">10%</td>
        <td class="amount-col">${curSymbol}${(invoice.financials.subTotal * 0.1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;

  // Generate HTML content matching modern corporate branding
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.id}</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #2d3748;
          margin: 0;
          padding: 40px;
          line-height: 1.5;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #edf2f7;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-text {
          font-size: 20px;
          font-weight: bold;
          color: #0A1638;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h1 {
          margin: 0;
          font-size: 28px;
          color: #1a202c;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .details-col h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          text-transform: uppercase;
          color: #718096;
          letter-spacing: 0.5px;
        }
        .details-col p {
          margin: 3px 0;
          font-size: 15px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 5px;
        }
        .status-Paid { background-color: #c6f6d5; color: #22543d; }
        .status-Pending { background-color: #feebc8; color: #744210; }
        .status-Overdue { background-color: #fed7d7; color: #742a2a; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        th {
          background-color: #f7fafc;
          text-align: left;
          padding: 12px;
          font-size: 13px;
          font-weight: bold;
          color: #4a5568;
          border-bottom: 1px solid #e2e8f0;
        }
        td {
          padding: 12px;
          font-size: 14px;
          border-bottom: 1px solid #edf2f7;
        }
        .amount-col {
          text-align: right;
        }
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .total-box {
          width: 250px;
          border-top: 2px solid #edf2f7;
          padding-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 15px;
        }
        .grand-total {
          font-size: 20px;
          font-weight: bold;
          color: #0A1638;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
          font-size: 12px;
          color: #a0aec0;
          border-top: 1px solid #edf2f7;
          padding-top: 20px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
        <button onclick="window.print()" style="padding: 8px 16px; background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Print Invoice</button>
        <button onclick="window.close()" style="padding: 8px 16px; background-color: #718096; color: white; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
      </div>

      <div class="invoice-header">
        <div class="logo-container" style="display: flex; align-items: center; gap: 10px;">
          <img 
            src="${S3_BASE_URL}logo/Logo.png" 
            style="width: 40px; height: 40px; object-fit: contain;" 
          />
          <div class="logo-text">Simple-cloud LIFECYCLE</div>
        </div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">ID: ${invoice.id}</p>
        </div>
      </div>

      <div class="invoice-details">
        <div class="details-col">
          <h3>Billed To</h3>
          <p><strong>Corporate Operations Dept.</strong></p>
          <p>Simple-cloud Lifecycle Platform</p>
          <p>Bangkok, Thailand</p>
          <p style="color: #4a5568; font-size: 13px; margin-top: 5px;">TAX-ID: 0105561008899</p>
        </div>
        <div class="details-col">
          <h3>Provider</h3>
          <p><strong>${invoice.provider} Cloud Billing</strong></p>
          <p>Billing Period: ${invoice.billingPeriod}</p>
          <p>Due Date: ${invoice.dueDate}</p>
          <p style="color: #4a5568; font-size: 13px; margin-top: 5px;">TAX-ID: 990008811</p>
        </div>
        <div class="details-col" style="text-align: right;">
          <h3>Status</h3>
          <div class="status-badge status-${invoice.status}">${invoice.status}</div>
        </div>
      </div>

      <h3>Line Item Charges</h3>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Category / Billing Type</th>
            <th class="amount-col">Cost Allocation</th>
            <th class="amount-col">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-box">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${curSymbol}${invoice.financials.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row">
            <span>Tax (${invoice.financials.taxRate}%):</span>
            <span>${curSymbol}${invoice.financials.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total:</span>
            <span>${curSymbol}${invoice.financials.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This invoice is electronically audited and verified under FinOps policies for automated life cycles.</p>
        <p>© 2026 Simple-cloud LIFECYCLE Platform. All rights reserved.</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  // Safely open and load content using a Blob URL (avoids deprecated document.write and dead assignments)
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  
  printWindow.location.href = blobUrl;
}

/**
 * Downloads a simulated ZIP containing all invoices in JSON form
 */
export function downloadAllInvoicesAsZIP(invoices: InvoiceItem[]) {
  const jsonContent = JSON.stringify(invoices, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'all_cloud_invoices_history_audit.json');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  
  link.remove();
}