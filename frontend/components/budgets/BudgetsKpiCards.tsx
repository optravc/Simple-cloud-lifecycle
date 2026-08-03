'use client';

import React from 'react';
import { Grid, Box, Card, CardContent, Typography } from '@mui/material';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';

// --- ยุบ StatCard เข้ามาไว้ในไฟล์เดียวกันเลย ---
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: string;
  trendData?: { value: number }[];
  isWarning?: boolean;
}

function StatCard({ title, value, subtitle, icon, color = '#1976d2', trendData, isWarning = false }: StatCardProps) {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #f0f0f0', 
        borderRadius: 3, 
        height: '100%',
        transition: '0.2s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
      }}
    >
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {icon}
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                {title}
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: isWarning ? '#d32f2f' : '#1a202c' }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color: isWarning ? '#d32f2f' : 'text.secondary' }}>
              {subtitle}
            </Typography>
          </Box>

          {trendData && trendData.length > 0 && (
            <Box sx={{ width: 90, height: 45, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <Line type="monotone" dataKey="value" stroke={isWarning ? '#d32f2f' : color} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// --- Component หลักสำหรับแสดง KPI Cards ทั้งหมด ---
interface BudgetsKpiCardsProps {
  totalBudget: number;
  budgetTrend: { value: number }[];
  totalSpent: number;
  usagePercent: number;
  spentTrend: { value: number }[];
  remainingBudget: number;
  remainingTrend: { value: number }[];
}

export default function BudgetsKpiCards({
  totalBudget,
  budgetTrend,
  totalSpent,
  usagePercent,
  spentTrend,
  remainingBudget,
  remainingTrend,
}: BudgetsKpiCardsProps) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard 
          title="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          subtitle="วงเงินรวมประจำเดือน"
          icon={<AccountBalanceWalletIcon color="primary" fontSize="small" />}
          trendData={budgetTrend}
          color="#1976d2"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard 
          title="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          subtitle={`คิดเป็น ${usagePercent}% ของงบทั้งหมด`}
          icon={<Box sx={{ width: 10, height: 10, bgcolor: usagePercent > 85 ? '#d32f2f' : '#2e7d32', borderRadius: '50%' }} />}
          trendData={spentTrend}
          isWarning={usagePercent > 85}
          color="#d32f2f"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard 
          title="Remaining Budget"
          value={`$${remainingBudget.toLocaleString()}`}
          subtitle="งบประมาณคงเหลือสุทธิ"
          icon={<SavingsIcon color="success" fontSize="small" />}
          trendData={remainingTrend}
          color="#2e7d32"
        />
      </Grid>
    </Grid>
  );
}