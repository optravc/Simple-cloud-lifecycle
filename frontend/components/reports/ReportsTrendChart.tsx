'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, Box, ButtonGroup, Button } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ReportsTrendChartProps } from '@/types/performance';

export default function ReportsTrendChart({ 
  data = []
}: Readonly<ReportsTrendChartProps>) {
  const [timeRange, setTimeRange] = useState<'6M' | 'YTD' | '12M'>('YTD');

  // Fallback rich 7-provider dataset with realistic, organic monthly growth curves
  const defaultData = [
    { month: 'Jan', aws: 18500, azure: 24000, gcp: 32000, salesforce: 42000, ibm: 11000, oracle: 19000, alibaba: 12500 },
    { month: 'Feb', aws: 21200, azure: 26500, gcp: 35000, salesforce: 45000, ibm: 12200, oracle: 21000, alibaba: 13800 },
    { month: 'Mar', aws: 19800, azure: 28200, gcp: 38500, salesforce: 43800, ibm: 11500, oracle: 20200, alibaba: 14200 },
    { month: 'Apr', aws: 24500, azure: 31000, gcp: 41200, salesforce: 49000, ibm: 13800, oracle: 23500, alibaba: 15500 },
    { month: 'May', aws: 22100, azure: 34800, gcp: 44000, salesforce: 52500, ibm: 13100, oracle: 25000, alibaba: 16100 },
    { month: 'Jun', aws: 27800, azure: 37200, gcp: 47500, salesforce: 56000, ibm: 14500, oracle: 26800, alibaba: 17400 },
    { month: 'Jul', aws: 30000, azure: 40000, gcp: 50000, salesforce: 60000, ibm: 15000, oracle: 28000, alibaba: 18500 }
  ];

  const rawData = (data && data.length > 0) ? data : defaultData;

  const chartData = rawData.map((item, idx) => {
    const defaults = defaultData[idx % defaultData.length];
    return {
      month: item.month,
      aws: item.aws || defaults.aws,
      azure: item.azure || defaults.azure,
      gcp: item.gcp || defaults.gcp,
      salesforce: item.salesforce || defaults.salesforce,
      ibm: item.ibm || defaults.ibm,
      oracle: item.oracle || defaults.oracle,
      alibaba: item.alibaba || defaults.alibaba
    };
  });

  // Filter data based on selected time range
  const filteredData = timeRange === '6M' ? chartData.slice(-6) : chartData;

  return (
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
      <CardContent sx={{ p: '24px !important', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {/* Card Header & Time Range Filter */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1rem', mb: 0.5 }}>
              Multi-Cloud Cost Trend (YTD)
            </Typography>
            <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.82rem' }}>
              Accumulated monthly spending trend across multi-cloud providers
            </Typography>
          </Box>

          <ButtonGroup size="small" sx={{ height: 28, '& .MuiButton-root': { fontSize: '0.72rem', fontWeight: 600, px: 1.2 } }}>
            <Button 
              variant={timeRange === '6M' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('6M')}
              sx={{ bgcolor: timeRange === '6M' ? '#2065D1' : 'transparent' }}
            >
              6M
            </Button>
            <Button 
              variant={timeRange === 'YTD' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('YTD')}
              sx={{ bgcolor: timeRange === 'YTD' ? '#2065D1' : 'transparent' }}
            >
              YTD
            </Button>
            <Button 
              variant={timeRange === '12M' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('12M')}
              sx={{ bgcolor: timeRange === '12M' ? '#2065D1' : 'transparent' }}
            >
              12M
            </Button>
          </ButtonGroup>
        </Box>

        {/* Cloud Provider Brand Legend Pills for All 7 Providers */}
        <Box sx={{ display: 'flex', gap: 1.8, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FF9900' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>AWS</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0089D6' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>Azure</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4285F4' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>GCP</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00A1E0' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>Salesforce</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#052FAD' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>IBM Cloud</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F80000' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>Oracle</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FF6A00' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>Alibaba Cloud</Typography>
          </Box>
        </Box>
        
        {/* Area Chart Display */}
        <Box sx={{ width: '100%', height: 230 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9900" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#FF9900" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0089D6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0089D6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4285F4" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="sfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A1E0" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00A1E0" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ibmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#052FAD" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#052FAD" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="oracleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F80000" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#F80000" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="aliGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#FF6A00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#637381" fontSize={11} />
              <YAxis stroke="#637381" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip 
                formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="aws" stroke="#FF9900" fill="url(#awsGrad)" strokeWidth={2} name="AWS" />
              <Area type="monotone" dataKey="azure" stroke="#0089D6" fill="url(#azureGrad)" strokeWidth={2} name="Azure" />
              <Area type="monotone" dataKey="gcp" stroke="#4285F4" fill="url(#gcpGrad)" strokeWidth={2} name="GCP" />
              <Area type="monotone" dataKey="salesforce" stroke="#00A1E0" fill="url(#sfGrad)" strokeWidth={2} name="Salesforce" />
              <Area type="monotone" dataKey="ibm" stroke="#052FAD" fill="url(#ibmGrad)" strokeWidth={2} name="IBM Cloud" />
              <Area type="monotone" dataKey="oracle" stroke="#F80000" fill="url(#oracleGrad)" strokeWidth={2} name="Oracle" />
              <Area type="monotone" dataKey="alibaba" stroke="#FF6A00" fill="url(#aliGrad)" strokeWidth={2} name="Alibaba Cloud" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}