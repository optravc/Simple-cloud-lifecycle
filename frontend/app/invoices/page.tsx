'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Button, Tabs, Tab, Card, CardContent 
} from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import InvoiceKpiCards from '@/components/invoices/InvoiceKpiCards';
import InvoicesTable from '@/components/invoices/InvoicesTable';
import InvoiceDetailDrawer from '@/components/invoices/InvoiceDetailDrawer';
import SharedCostAllocation from '@/components/invoices/SharedCostAllocation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadAllInvoicesAsZIP } from '@/lib/invoiceExporter';
import { getUserInfo } from '@/lib/auth';
import { getInvoices, getCostTrends, getFinOpsDetails } from '@/lib/invoiceService';
import { InvoiceItem, TrendItem } from '@/types/invoice';

const drawerWidth = 260;

export default function InvoicesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const info = getUserInfo();
      if (info) {
        if (info.role !== 'admin' && info.role !== 'finance' && info.role !== 'finops') {
          router.push('/dashboard');
          return;
        }
        setIsAuthorized(true);
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [costTrends, setCostTrends] = useState<TrendItem[]>([]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [invoiceData, trendData] = await Promise.all([
        getInvoices(),
        getCostTrends()
      ]);
      if (active) {
        setInvoices(invoiceData);
        setCostTrends(trendData);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  // Handle Invoice Selection
  const handleSelectInvoice = (invoice: InvoiceItem) => {
    setSelectedInvoice(invoice);
    setIsDrawerOpen(true);
  };

  // Filtered Invoices logic
  const filteredInvoices = invoices.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = selectedProvider === 'All' || item.provider === selectedProvider;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    
    return matchesSearch && matchesProvider && matchesStatus;
  });

  const totalBilled = invoices.reduce((sum, i) => {
    const val = i.currency === 'THB' ? i.amount / 35 : i.amount;
    return sum + val;
  }, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => {
    const val = i.currency === 'THB' ? i.amount / 35 : i.amount;
    return sum + val;
  }, 0);
  const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => {
    const val = i.currency === 'THB' ? i.amount / 35 : i.amount;
    return sum + val;
  }, 0);

  // Dynamic FinOps KPI calculations
  const avgTaggingCompliance = invoices.length > 0 
    ? Math.round((invoices.reduce((sum, i) => {
        const details = getFinOpsDetails(i.id, i.financials?.subTotal || i.amount, i.amount);
        return sum + (details.taggingCompliance || 84.6);
      }, 0) / invoices.length) * 10) / 10
    : 84.6;

  const savingsPotential = invoices.length > 0
    ? invoices.reduce((sum, i) => {
        const details = getFinOpsDetails(i.id, i.financials?.subTotal || i.amount, i.amount);
        const recSavings = details.recommendations?.reduce((s, r) => s + r.saving, 0) || 0;
        return sum + recSavings;
      }, 0)
    : 12850;

  if (!isAuthorized) {
    return null; 
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 2.5 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '1.15rem' }}>
                Cloud Invoices & Billing
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Track cloud provider billing history, trends, and showback allocation
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
              onClick={() => downloadAllInvoicesAsZIP(filteredInvoices)}
              sx={{ borderRadius: 2, textTransform: 'none', height: 36, px: 2, fontWeight: 600, fontSize: '0.8rem' }}
            >
              Download All Invoices (ZIP)
            </Button>
          </Box>

          {/* Top KPI Summary Cards Component */}
          <InvoiceKpiCards 
            totalBilled={totalBilled} 
            totalPaid={totalPaid} 
            totalPending={totalPending}
            avgTaggingCompliance={avgTaggingCompliance}
            savingsPotential={savingsPotential}
          />

          {/* Navigation Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)} 
              aria-label="billing tabs"
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 'bold', fontSize: '0.95rem' }
              }}
            >
              <Tab icon={<HistoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" label=" History"/>
              <Tab icon={<AssessmentIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Cloud Spending Trends" />
              <Tab icon={<SettingsInputComponentIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Shared Cost Rules" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <InvoicesTable 
              invoices={filteredInvoices} 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              onSelectInvoice={handleSelectInvoice}
            />
          )}

          {activeTab === 1 && (
            <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 4, bgcolor: '#ffffff', p: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c', mb: 1 }}>
                  6-Month Cloud Invoice History Trend
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                  Compare billing trends of each cloud provider over the past 6 months to analyze spending growth
                </Typography>
                <Box sx={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={costTrends}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(val) => `$${val / 1000}k`} tick={{ fill: '#718096', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                      />
                      <Legend position="top" height={36} iconType="circle" />
                      <Bar dataKey="AWS"        stackId="a" fill="#FF9900" radius={[0, 0, 0, 0]} barSize={40} />
                      <Bar dataKey="Azure"      stackId="a" fill="#0089D6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="GCP"        stackId="a" fill="#4285F4" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Salesforce" stackId="a" fill="#00A1E0" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="IBMCloud"   stackId="a" fill="#1F70C1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Oracle"     stackId="a" fill="#F80000" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Alibaba"    stackId="a" fill="#FF6A00" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <SharedCostAllocation invoices={invoices} />
          )}

          {/* FinOps Analysis Slide-out Drawer */}
          <InvoiceDetailDrawer 
            open={isDrawerOpen} 
            onClose={() => setIsDrawerOpen(false)} 
            invoice={selectedInvoice}
          />
        </Box>
      </Box>
    </Box>
  );
}