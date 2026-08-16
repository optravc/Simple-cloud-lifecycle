'use client';

import { Grid, Box, Card, CardContent, Typography,Chip } from '@mui/material';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { StatCardProps } from '@/types/budget';


function StatCard({ 
  id,
  title, 
  value, 
  subtitle, 
  icon, 
  badge,
  color = '#2065D1',
  trendData, 
  isWarning = false 
}: Readonly<StatCardProps & { id: string; badge?: React.ReactNode }>) {
  const activeColor = isWarning ? '#d32f2f' : color;
  const gradientId = `kpi-gradient-${id}`;

  // Transform raw data into smooth wave curves with date labels for tooltips
  const getSmoothWaveData = () => {
    const days = ['Jul 1', 'Jul 4', 'Jul 7', 'Jul 10', 'Jul 13', 'Jul 16', 'Jul 19', 'Jul 22', 'Jul 25', 'Jul 28', 'Jul 30', 'Aug 1'];
    if (!trendData || trendData.length === 0) {
      return [
        { day: 'Jul 1', value: 65 }, { day: 'Jul 4', value: 72 }, { day: 'Jul 7', value: 68 }, { day: 'Jul 10', value: 85 },
        { day: 'Jul 13', value: 78 }, { day: 'Jul 16', value: 92 }, { day: 'Jul 19', value: 88 }, { day: 'Jul 22', value: 105 },
        { day: 'Jul 25', value: 98 }, { day: 'Jul 28', value: 115 }, { day: 'Jul 30', value: 110 }, { day: 'Aug 1', value: 125 }
      ];
    }

    // If data is flat (all values equal like static total budget), add micro wave variations
    const allSame = trendData.every(d => d.value === trendData[0].value);
    if (allSame) {
      const base = trendData[0].value || 100;
      return [
        { day: 'Jul 1', value: Math.round(base * 0.88) }, { day: 'Jul 4', value: Math.round(base * 0.93) }, { day: 'Jul 7', value: Math.round(base * 0.90) },
        { day: 'Jul 10', value: Math.round(base * 0.96) }, { day: 'Jul 13', value: Math.round(base * 0.92) }, { day: 'Jul 16', value: Math.round(base * 0.98) },
        { day: 'Jul 19', value: Math.round(base * 0.95) }, { day: 'Jul 22', value: Math.round(base * 0.99) }, { day: 'Jul 25', value: Math.round(base * 0.97) },
        { day: 'Jul 28', value: Math.round(base * 1.01) }, { day: 'Jul 30', value: Math.round(base * 0.99) }, { day: 'Aug 1', value: Math.round(base * 1.00) }
      ];
    }

    // Expand small arrays to 12 smooth wave points with labels
    if (trendData.length < 8) {
      const expanded: { day: string; value: number }[] = [];
      trendData.forEach((item, idx) => {
        const next = trendData[idx + 1] || item;
        const mid = (item.value + next.value) / 2;
        const waveOffset = (item.value * 0.03) * (idx % 2 === 0 ? 1 : -1);
        expanded.push(
          { day: days[idx * 2] || `Day ${idx * 2 + 1}`, value: Math.round(item.value) },
          { day: days[idx * 2 + 1] || `Day ${idx * 2 + 2}`, value: Math.round(mid + waveOffset) }
        );
      });
      return expanded;
    }

    return trendData.map((d, i) => ({ day: days[i % days.length], value: Math.round(d.value) }));
  };

  const chartData = getSmoothWaveData();

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          {/* Left Side: Title, Icon, Value, Subtitle, Badge */}
          <Box sx={{ minWidth: 150, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
              {icon}
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}>
                {title}
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: isWarning ? '#d32f2f' : '#1a202c', fontSize: '1.65rem', lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color: isWarning ? '#d32f2f' : 'text.secondary', fontSize: '0.78rem', display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
            {badge && <Box sx={{ mt: 1 }}>{badge}</Box>}
          </Box>

          {/* Right Side: Fluid Smooth Wave Area Chart filling the right half */}
          <Box sx={{ flex: 1, height: 66, minWidth: 120, overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeColor} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={activeColor} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    color: '#fff', 
                    borderRadius: 8, 
                    border: 'none', 
                    fontSize: '11px',
                    padding: '4px 8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, title]}
                  labelFormatter={(label) => {
                    const text = typeof label === 'string' || typeof label === 'number' ? label : '';
                    return `Date: ${text}`;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={activeColor} 
                  strokeWidth={2} 
                  fill={`url(#${gradientId})`}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// --- Main Component to display all KPI Cards ---
interface BudgetsKpiCardsProps {
  totalBudget: number;
  budgetTrend: { value: number }[];
  totalSpent: number;
  usagePercent: number;
  spentTrend: { value: number }[];
  remainingBudget: number;
  remainingTrend: { value: number }[];
  forecastedSpend: number;
}

export default function BudgetsKpiCards({
  totalBudget,
  budgetTrend,
  totalSpent,
  usagePercent,
  spentTrend,
  remainingBudget,
  remainingTrend,
  forecastedSpend,
}: Readonly<BudgetsKpiCardsProps>) {
  const isForecastOver = forecastedSpend > totalBudget;

  // Calculate FinOps Month Pacing
  const now = new Date();
  const currentDay = now.getUTCDate();
  // Use UTC to calculate total days in the current month — avoids timezone-specific bugs
  const totalDays = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const timePercent = Math.round((currentDay / totalDays) * 100);
  const pacingDiff = usagePercent - timePercent;

  let pacingLabel = `On Track (${timePercent}% Time)`;
  let pacingBg = '#e8f5e9';
  let pacingColor = '#2e7d32';

  if (pacingDiff > 10) {
    pacingLabel = `Over-pacing (+${pacingDiff.toFixed(0)}%)`;
    pacingBg = '#ffebee';
    pacingColor = '#d32f2f';
  } else if (pacingDiff < -10) {
    pacingLabel = `Under-pacing (${pacingDiff.toFixed(0)}%)`;
    pacingBg = '#e3f2fd';
    pacingColor = '#1976d2';
  }

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard 
          id="total-budget"
          title="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          subtitle="Total monthly limit"
          icon={<AccountBalanceWalletIcon color="primary" fontSize="small" />}
          trendData={budgetTrend}
          color="#2065D1"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard 
          id="total-spent"
          title="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          subtitle={`Equivalent to ${usagePercent.toFixed(1)}% of total budget`}
          icon={<Box sx={{ width: 10, height: 10, bgcolor: usagePercent > 85 ? '#d32f2f' : '#2ea043', borderRadius: '50%' }} />}
          badge={
            <Chip 
              label={pacingLabel} 
              size="small" 
              sx={{ bgcolor: pacingBg, color: pacingColor, fontWeight: 'bold', fontSize: '0.7rem', height: 20 }} 
            />
          }
          trendData={spentTrend}
          isWarning={usagePercent > 85}
          color="#2ea043"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard 
          id="remaining-budget"
          title="Remaining Budget"
          value={`$${remainingBudget.toLocaleString()}`}
          subtitle="Net remaining budget"
          icon={<SavingsIcon color="success" fontSize="small" />}
          trendData={remainingTrend}
          color="#FFAB00"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard 
          id="forecasted-spend"
          title="Forecasted Month-End"
          value={`$${Math.round(forecastedSpend).toLocaleString()}`}
          subtitle={isForecastOver ? 'Forecast exceeds defined budget' : 'Within controlled limit'}
          icon={<TrendingUpIcon color={isForecastOver ? "error" : "info"} fontSize="small" />}
          isWarning={isForecastOver}
          trendData={spentTrend}
          color={isForecastOver ? "#d32f2f" : "#826af9"}
        />
      </Grid>
    </Grid>
  );
}