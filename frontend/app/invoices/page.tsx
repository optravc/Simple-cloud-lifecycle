'use client';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import InvoiceKpiCards from '@/components/invoices/InvoiceKpiCards';
import InvoicesTable from '@/components/invoices/InvoicesTable';

const drawerWidth = 260;

interface InvoiceItem {
  id: string;
  provider: string;
  billingPeriod: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export default function InvoicesPage() {
  const [invoices] = useState<InvoiceItem[]>([
    { id: 'INV-2026-001', provider: 'AWS', billingPeriod: 'JULY 1 - JULY 30', dueDate: '15 AUG 2026', amount: 30000, status: 'Paid' },
    { id: 'INV-2026-002', provider: 'Azure', billingPeriod: 'JULY 1 - JULY 30', dueDate: '20 AUG 2026', amount: 20000, status: 'Pending' },
    { id: 'INV-2026-003', provider: 'GCP', billingPeriod: 'JULY 1 - JULY 30', dueDate: '10 AUG 2026', amount: 50000, status: 'Paid' },
    { id: 'INV-2026-004', provider: 'Alibaba Cloud', billingPeriod: 'JULY 1 - JULY 30', dueDate: '01 AUG 2026', amount: 18500, status: 'Overdue' },
  ]);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredInvoices = invoices.filter((item) => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBilled = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.amount, 0);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 4 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                Cloud Invoices & Billing
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                จัดการใบแจ้งหนี้ ประวัติการชำระเงิน และเอกสารทางบัญชีจากผู้ให้บริการคลาวด์
              </Typography>
            </Box>
            <Button variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
              Download All Invoices (ZIP)
            </Button>
          </Box>

          {/* Top KPI Summary Cards Component */}
          <InvoiceKpiCards 
            totalBilled={totalBilled} 
            totalPaid={totalPaid} 
            totalPending={totalPending} 
          />

          {/* Invoices Table Component */}
          <InvoicesTable 
            invoices={filteredInvoices} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </Box>
      </Box>
    </Box>
  );
}