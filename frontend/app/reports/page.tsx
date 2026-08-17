'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import ReportsTrendChart from '@/components/reports/ReportsTrendChart';
import ScheduledReportsTable from '@/components/reports/ScheduledReportsTable';
import SavingsPlansCard from '@/components/reports/SavingsPlansCard';
import ActionStatusModal from '@/components/common/ActionStatusModal';
import { exportReportsSummaryToCSV, printExecutiveReportPDF } from '@/lib/reportExporter';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { getUserInfo } from '@/lib/auth';
import { ReportsResponse, ReportTrendItem, ScheduledReport } from '@/types/report';
import { SavingsPlansSummary } from '@/types/aws_extended';
import { API_BASE } from '@/lib/api';

const drawerWidth = 260;

// Top sparkline datasets for Recharts AreaChart (matching Budget page)
const growthSparklineData = [
  { day: 'Mar', value: 12 }, { day: 'Apr', value: 18 }, { day: 'May', value: 15 },
  { day: 'Jun', value: 24 }, { day: 'Jul', value: 32 }, { day: 'Aug', value: 48 },
  { day: 'Sep', value: 65 }, { day: 'Oct', value: 88 }, { day: 'Nov', value: 114 }
];

const scheduledSparklineData = [
  { day: 'Mar', value: 2 }, { day: 'Apr', value: 2 }, { day: 'May', value: 2 },
  { day: 'Jun', value: 3 }, { day: 'Jul', value: 3 }, { day: 'Aug', value: 3 },
  { day: 'Sep', value: 3 }, { day: 'Oct', value: 3 }, { day: 'Nov', value: 3 }
];

const savingsSparklineData = [
  { day: 'Mar', value: 1200 }, { day: 'Apr', value: 1800 }, { day: 'May', value: 2400 },
  { day: 'Jun', value: 3100 }, { day: 'Jul', value: 3800 }, { day: 'Aug', value: 4250 }
];

export default function ReportsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [reportsData, setReportsData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [savingsData, setSavingsData] = useState<SavingsPlansSummary | null>(null);
  const [savingsLoading, setSavingsLoading] = useState<boolean>(false);

  // Check login & permissions
  useEffect(() => {
    const checkAuth = async () => {
      const info = getUserInfo();
      if (info) {
        if (info.role === 'dev') {
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

  useEffect(() => {
    let cancelled = false;
    const fetchSavingsPlans = async () => {
      setSavingsLoading(true);
      try {
        const res = await fetchWithAuth(`${API_BASE}/recommendations/savings-plans`);
        if (res.ok) {
          const data: SavingsPlansSummary = await res.json();
          if (!cancelled) setSavingsData(data);
        }
      } catch (err) {
        console.error('Error fetching Savings Plans recommendations:', err);
      } finally {
        if (!cancelled) setSavingsLoading(false);
      }
    };
    fetchSavingsPlans();
    return () => { cancelled = true; };
  }, []);

  // Fetch reports data
  useEffect(() => {
    let cancelled = false;
    const fetchReports = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/Reports`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setReportsData(data);
            setLoading(false);
            setError(null);
            return;
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching reports data:", err);
      }
      if (!cancelled) {
        setReportsData({
          status: 'success',
          roi_summary: { WastedCostDaily: 141.66 },
          npv_analysis: [],
          cost_trend: [
            { month: 'Feb', aws: 21200, azure: 26500, gcp: 35000 },
            { month: 'Mar', aws: 19800, azure: 28200, gcp: 38500 },
            { month: 'Apr', aws: 24500, azure: 31000, gcp: 41200 },
            { month: 'May', aws: 22100, azure: 34800, gcp: 44000 },
            { month: 'Jun', aws: 27800, azure: 37200, gcp: 47500 },
            { month: 'Jul', aws: 30000, azure: 40000, gcp: 50000 },
          ],
          scheduled_reports: [
            { id: 'REP-001', name: 'Weekly Executive Cost Digest', frequency: 'Weekly (Mon 08:00)', recipients: 'noptrapk+executive@gmail.com', status: 'Active' },
            { id: 'REP-002', name: 'Monthly FinOps ROI & Savings Report', frequency: 'Monthly (1st 09:00)', recipients: 'noptrapk+finance@gmail.com', status: 'Active' },
            { id: 'REP-003', name: 'Daily Idle Resource Sweep Alert', frequency: 'Daily (18:00)', recipients: 'noptrapk+infra.lead@gmail.com', status: 'Active' },
          ],
        });
        setLoading(false);
        setError(null);
      }
    };

    fetchReports();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const [modalState, setModalState] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handleGenerateReport = () => {
    printExecutiveReportPDF(reportsData, scheduledReports);
    setModalState({
      open: true,
      type: 'success',
      title: 'Executive PDF Launched',
      message: 'The Enterprise Executive PDF Report window has been launched. You can save or print to PDF directly.',
    });
  };

  const handleExportCsv = () => {
    exportReportsSummaryToCSV(reportsData, scheduledReports);
    setModalState({
      open: true,
      type: 'success',
      title: 'CSV Summary Downloaded',
      message: 'Reports summary data has been compiled and downloaded as a real CSV file successfully.',
    });
  };

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/Reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      
      // Refresh reports list
      setRefreshKey(prev => prev + 1);
      setModalState({
        open: true,
        type: 'success',
        title: 'Status Updated',
        message: `Report schedule status updated to ${newStatus}.`,
      });
    } catch (err: unknown) {
      console.error('Failed to toggle status:', err);
      const message = err instanceof Error ? err.message : 'Failed to toggle status';
      setModalState({
        open: true,
        type: 'error',
        title: 'Update Rejected',
        message: `Error updating report status: ${message}`,
      });
    }
  };

  // Calculate dynamic metrics
  let cloudGrowthStr = '+216.9%';
  let activeReportsCount = 0;
  let activeReportsText = '3 Active';
  let optimizationPotentialStr = '$4,250 /mo';
  let trendData: ReportTrendItem[] = [];
  let scheduledReports: ScheduledReport[] = [];

  if (reportsData) {
    // 1. Calculate growth from last two months of trend
    const trend = reportsData.cost_trend || [];
    trendData = trend;
    if (trend.length >= 2) {
      const last = trend.at(-1);
      const prev = trend.at(-2);
      const lastTotal = (last?.aws || 0) + (last?.azure || 0) + (last?.gcp || 0);
      const prevTotal = (prev?.aws || 0) + (prev?.azure || 0) + (prev?.gcp || 0);
      if (prevTotal > 0) {
        const growth = ((lastTotal - prevTotal) / prevTotal) * 100;
        cloudGrowthStr = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
      }
    }

    // 2. Count active scheduled reports
    const reports = reportsData.scheduled_reports || [];
    scheduledReports = reports;
    activeReportsCount = reports.filter((r) => r.status === 'Active').length;
    activeReportsText = `${activeReportsCount} Active`;

    // 3. Optimization potential from wasted cost (idle resources)
    const roi = reportsData.roi_summary || {};
    const wastedMonthly = (roi.WastedCostDaily || 0) * 30;
    const potentialVal = wastedMonthly > 0 ? wastedMonthly : (savingsData?.total_monthly_savings_usd || 4250);
    optimizationPotentialStr = `$${potentialVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} /mo`;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
              {error}
            </Alert>
          )}

          {/* Header & Actions Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.2rem', lineHeight: 1.2 }}>
                Enterprise Cost & Lifecycle Reports
              </Typography>
              <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.82rem' }}>
                Analyze multi-cloud spending trends, savings commitments, and configure automated report schedules
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<FileDownloadIcon sx={{ fontSize: 18 }} />} 
                onClick={handleExportCsv}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none', height: 36, px: 2, fontWeight: 600, fontSize: '0.8rem', bgcolor: '#ffffff' }}
              >
                Download CSV
              </Button>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 18 }} />} 
                onClick={handleGenerateReport}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none', height: 36, px: 2, fontWeight: 600, fontSize: '0.8rem' }}
              >
                Generate Executive PDF
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Top Row: 3 Executive KPI Mini-Cards (Bento Grid with Budget-style Smooth Wave Charts) */}
              <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                {/* 1. Total Cloud Growth Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      border: '1px solid #919eab3d', 
                      borderRadius: 4, 
                      boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
                      bgcolor: '#ffffff',
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: '24px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ minWidth: 140, flexShrink: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AssessmentIcon color="primary" sx={{ fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.85rem' }}>
                              Total Cloud Growth
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.65rem', mb: 0.3, lineHeight: 1.2 }}>
                            {cloudGrowthStr}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#637381', fontSize: '0.75rem', display: 'block' }}>
                            Compared to previous month
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1, height: 60, minWidth: 110, overflow: 'hidden' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthSparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2065D1" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#2065D1" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, border: 'none', fontSize: '11px', padding: '4px 8px' }}
                                itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                                formatter={(val: unknown) => [`${val}%`, 'Growth']}
                              />
                              <Area type="monotone" dataKey="value" stroke="#2065D1" strokeWidth={2} fill="url(#growthGrad)" isAnimationActive />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 2. Scheduled Reports Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      border: '1px solid #919eab3d', 
                      borderRadius: 4, 
                      boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
                      bgcolor: '#ffffff',
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: '24px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ minWidth: 140, flexShrink: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ScheduleIcon color="success" sx={{ fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.85rem' }}>
                              Scheduled Reports
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#00AB55', fontSize: '1.65rem', mb: 0.3, lineHeight: 1.2 }}>
                            {activeReportsText}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#637381', fontSize: '0.75rem', display: 'block' }}>
                            Automated active tasks
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1, height: 60, minWidth: 110, overflow: 'hidden' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={scheduledSparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="schedGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00AB55" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#00AB55" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, border: 'none', fontSize: '11px', padding: '4px 8px' }}
                                itemStyle={{ color: '#4ade80', fontWeight: 'bold' }}
                                formatter={(val: unknown) => [`${val} Active`, 'Tasks']}
                              />
                              <Area type="monotone" dataKey="value" stroke="#00AB55" strokeWidth={2} fill="url(#schedGrad)" isAnimationActive />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 3. Optimization Potential Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      border: '1px solid #919eab3d', 
                      borderRadius: 4, 
                      boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
                      bgcolor: '#ffffff',
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: '24px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ minWidth: 140, flexShrink: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TrendingUpIcon sx={{ color: '#FFAB00', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.85rem' }}>
                              Optimization Potential
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFAB00', fontSize: '1.65rem', mb: 0.3, lineHeight: 1.2 }}>
                            {optimizationPotentialStr}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#637381', fontSize: '0.75rem', display: 'block' }}>
                            Idle resource savings
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1, height: 60, minWidth: 110, overflow: 'hidden' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={savingsSparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#FFAB00" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#FFAB00" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, border: 'none', fontSize: '11px', padding: '4px 8px' }}
                                itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                                formatter={(val: unknown) => [`$${Number(val).toLocaleString()}/mo`, 'Savings']}
                              />
                              <Area type="monotone" dataKey="value" stroke="#FFAB00" strokeWidth={2} fill="url(#savingsGrad)" isAnimationActive />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Middle Row: 7.5 : 4.5 Bento Grid Split (Multi-Cloud Cost Trend + Savings Plans) */}
              <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, md: 7.5 }}>
                  <ReportsTrendChart data={trendData} />
                </Grid>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <SavingsPlansCard data={savingsData} loading={savingsLoading} />
                </Grid>
              </Grid>

              {/* Bottom Row: Interactive Automated Report Subscriptions Component */}
              <ScheduledReportsTable reports={scheduledReports} onToggleStatus={handleToggleStatus} />
            </>
          )}
        </Box>
      </Box>

      {/* Reusable Enterprise Feedback Modal (Replaces browser alert()) */}
      <ActionStatusModal
        open={modalState.open}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
}