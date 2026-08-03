'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReportsTrendChart from '@/components/reports/ReportsTrendChart';
import ScheduledReportsTable from '@/components/reports/ScheduledReportsTable';

const drawerWidth = 260;

// ข้อมูลจำลองสำหรับกราฟแนวโน้มค่าใช้จ่ายย้อนหลัง
const trendData = [
  { month: 'Jan', aws: 12000, azure: 8000, gcp: 5000 },
  { month: 'Feb', aws: 13500, azure: 8500, gcp: 5200 },
  { month: 'Mar', aws: 15000, azure: 9200, gcp: 6000 },
  { month: 'Apr', aws: 14200, azure: 9000, gcp: 5800 },
  { month: 'May', aws: 16800, azure: 10500, gcp: 6500 },
  { month: 'Jun', aws: 18000, azure: 11000, gcp: 7000 },
];

export default function ReportsPage() {
  const [scheduledReports] = useState([
    { id: 'REP-001', name: 'Executive Monthly Cost & FinOps Summary', frequency: 'Monthly (1st)', recipients: 'executives@enterprise.com', status: 'Active' },
    { id: 'REP-002', name: 'Departmental Chargeback Breakdown', frequency: 'Weekly (Every Mon)', recipients: 'finance-team@enterprise.com', status: 'Active' },
    { id: 'REP-003', name: 'Untagged Resources & Governance Alert', frequency: 'Daily', recipients: 'devops-leads@enterprise.com', status: 'Paused' },
  ]);

  const handleGenerateReport = () => {
    alert('Generating Enterprise Executive PDF Report...');
  };

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
                Enterprise Reports & Analytics
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ศูนย์รวมรายงานเชิงวิเคราะห์ข้ามคลาวด์และการตั้งเวลาส่งออกข้อมูลอัตโนมัติ
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />} 
              onClick={handleGenerateReport}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Generate Executive PDF
            </Button>
          </Box>

          {/* Quick Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AssessmentIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Total Cloud Growth</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a202c' }}>+14.2%</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>อัตราการเติบโตเทียบกับไตรมาสที่แล้ว</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Scheduled Reports</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>3 Active</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>รายงานอัตโนมัติที่กำลังทำงานอยู่</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AssessmentIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Optimization Potential</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>$4,250 /mo</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>งบประมาณที่สามารถประหยัดได้เพิ่ม</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* เรียกใช้งาน Reports Trend Chart Component */}
          <ReportsTrendChart data={trendData} />

          {/* เรียกใช้งาน Scheduled Reports Table Component */}
          <ScheduledReportsTable reports={scheduledReports} />
        </Box>
      </Box>
    </Box>
  );
}