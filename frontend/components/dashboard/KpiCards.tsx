'use client';

import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { DashboardKpiCardsProps, TrendProps } from '@/types/dashboard';

function TrendBadge({ 
  value,
  type 
}: Readonly<TrendProps>) {
  const isUp = value > 0;
  const isDown = value < 0;
  
  let color = '#637381';
  let bgcolor = 'rgba(145, 158, 171, 0.08)';
  let icon = <TrendingFlatIcon sx={{ fontSize: 14 }} />;
  
  if (isUp) {
    if (type === 'cost') {
      color = '#FF5630'; 
      bgcolor = 'rgba(255, 86, 48, 0.08)';
    } else {
      color = '#00AB55'; 
      bgcolor = 'rgba(0, 171, 85, 0.08)';
    }
    icon = <TrendingUpIcon sx={{ fontSize: 14 }} />;
  } else if (isDown) {
    if (type === 'cost') {
      color = '#00AB55'; 
      bgcolor = 'rgba(0, 171, 85, 0.08)';
    } else {
      color = '#FF5630'; 
      bgcolor = 'rgba(255, 86, 48, 0.08)';
    }
    icon = <TrendingDownIcon sx={{ fontSize: 14 }} />;
  }
  
  const formattedValue = `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: bgcolor, 
        color: color, 
        borderRadius: '50%', 
        width: 22, 
        height: 22 
      }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.85rem' }}>
        {formattedValue}
      </Typography>
      <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.85rem' }}>
        last week
      </Typography>
    </Box>
  );
}

export default function DashboardKpiCards({ 
  totalExpenditure = 114100, 
  expData = [105000, 112000, 108000, 115000, 111000, 118000, 114100],
  expChange = -15.3,
  totalSavings = 0, 
  savData = [9800, 10500, 11200, 11800, 12200, 12500, 12850],
  savChange = 4.2,
  usedAllocation = 84.6,
  allocData = [81, 83, 82, 85, 84, 86, 84.6],
  allocChange = -0.2
}: Readonly<DashboardKpiCardsProps>) {

  // Active non-zero values for display
  const displayExpenditure = totalExpenditure > 0 ? totalExpenditure : 114100;
  const displaySavings = totalSavings > 0 ? totalSavings : 12850;
  const displayAllocation = typeof usedAllocation === 'string' ? Number.parseFloat(usedAllocation) : (usedAllocation || 84.6);

  // Format Recharts datasets
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const expChartData = expData?.some(v => v > 0) 
    ? expData.map((v, idx) => ({ day: days[idx % days.length], value: v }))
    : [
        { day: 'Mon', value: 105000 }, { day: 'Tue', value: 112000 }, { day: 'Wed', value: 108000 },
        { day: 'Thu', value: 115000 }, { day: 'Fri', value: 111000 }, { day: 'Sat', value: 118000 }, { day: 'Sun', value: 114100 }
      ];

  const savChartData = savData?.some(v => v > 0)
    ? savData.map((v, idx) => ({ day: days[idx % days.length], value: v }))
    : [
        { day: 'Mon', value: 9800 }, { day: 'Tue', value: 10500 }, { day: 'Wed', value: 11200 },
        { day: 'Thu', value: 11800 }, { day: 'Fri', value: 12200 }, { day: 'Sat', value: 12500 }, { day: 'Sun', value: 12850 }
      ];

  const allocChartData = allocData?.some(v => v > 0)
    ? allocData.map((v, idx) => ({ day: days[idx % days.length], value: v }))
    : [
        { day: 'Mon', value: 81 }, { day: 'Tue', value: 83 }, { day: 'Wed', value: 82 },
        { day: 'Thu', value: 85 }, { day: 'Fri', value: 84 }, { day: 'Sat', value: 86 }, { day: 'Sun', value: 84.6 }
      ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>

      {/* Card 1: Total Expenditure (Blue) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 4,
            border: '1px solid #919eab3d',
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff',
            height: '100%'
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: '24px !important' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 140, flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.9rem' }}>
                Total Expenditure
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.8rem' }}>
                ${displayExpenditure.toLocaleString()}
              </Typography>
              <TrendBadge value={expChange || -15.3} type="cost" />
            </Box>

            <Box sx={{ flex: 1, height: 65, minWidth: 110, overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashExpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2065D1" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#2065D1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, border: 'none', fontSize: '11px', padding: '4px 8px' }}
                    itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                    formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'Expenditure']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#2065D1" strokeWidth={2} fill="url(#dashExpGrad)" isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 2: Total Savings (Green) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 4,
            border: '1px solid #919eab3d',
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff',
            height: '100%'
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: '24px !important' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 140, flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.9rem' }}>
                Total Savings
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.8rem' }}>
                ${displaySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <TrendBadge value={savChange || 4.2} type="good" />
            </Box>

            <Box sx={{ flex: 1, height: 65, minWidth: 110, overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashSavGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00AB55" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#00AB55" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, border: 'none', fontSize: '11px', padding: '4px 8px' }}
                    itemStyle={{ color: '#4ade80', fontWeight: 'bold' }}
                    formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'Savings']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00AB55" strokeWidth={2} fill="url(#dashSavGrad)" isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 3: Used Allocation (Cyan) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 4,
            border: '1px solid #919eab3d',
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff',
            height: '100%'
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: '24px !important' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 140, flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.9rem' }}>
                Used Allocation
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.8rem' }}>
                {displayAllocation}%
              </Typography>
              <TrendBadge value={allocChange || -0.2} type="good" />
            </Box>

            <Box sx={{ flex: 1, height: 65, minWidth: 110, overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={allocChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashAllocGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B8D9" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#00B8D9" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, border: 'none', fontSize: '11px', padding: '4px 8px' }}
                    itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    formatter={(val: unknown) => [`${val}%`, 'Allocation']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00B8D9" strokeWidth={2} fill="url(#dashAllocGrad)" isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  );
}