import  { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, FormControl, Select, MenuItem } from '@mui/material';
import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import { CostBreakdownCardProps, PieData, ChargeItem } from '@/types/dashboard';
import { API_BASE } from '@/lib/api';

const getProviderColor = (name: string): string => {
  const p = (name || '').toLowerCase().replace(/\s+/g, '');
  if (p.includes('aws')) return '#FF9900';
  if (p.includes('gcp') || p.includes('google')) return '#4285F4';
  if (p.includes('azure')) return '#0089D6';
  if (p.includes('salesforce')) return '#00A1E0';
  if (p.includes('ibm')) return '#1F70C1';
  if (p.includes('oracle')) return '#F80000';
  if (p.includes('alibaba')) return '#FF6A00';
  return '#1890FF';
};

const DEFAULT_PROVIDER_DATA: PieData[] = [
  { name: 'Salesforce',    value: 60000 },
  { name: 'GCP',          value: 50000 },
  { name: 'Azure',        value: 40000 },
  { name: 'Oracle',       value: 28000 },
  { name: 'AWS',          value: 30000 },
  { name: 'Alibaba Cloud',value: 18500 },
  { name: 'IBM Cloud',    value: 15000 },
];

export default function CostBreakdownCard({ 
  data,
  selectedDept = 'All', 
  onDeptChange = () => {},
  disabled = false 
}: Readonly<CostBreakdownCardProps>) {
  const [dynamicData, setDynamicData] = useState<PieData[]>([]);

  useEffect(() => {
    if (data && data.length > 0) return;
    let cancelled = false;
    async function fetchChargesBreakdown() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/charges`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const charges: ChargeItem[] = await res.json();
          if (!cancelled && charges && charges.length > 0) {
            const map: Record<string, number> = {};
            charges.forEach(c => {
              const rawAmt = c.amount ? c.amount.replace(/[^0-9.]/g, '') : '0';
              const val = Number.parseFloat(rawAmt) || 0;
              map[c.provider] = (map[c.provider] || 0) + val;
            });
            const list: PieData[] = Object.entries(map).map(([name, value]) => ({ name, value }));
            list.sort((a, b) => b.value - a.value);
            setDynamicData(list);
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic cost breakdown:', err);
      }
    }
    fetchChargesBreakdown();
    return () => { cancelled = true; };
  }, [data]);

  let rawProviderData = DEFAULT_PROVIDER_DATA;
  if (data && data.length > 0) {
    rawProviderData = data;
  } else if (dynamicData.length > 0) {
    rawProviderData = dynamicData;
  }

  const providerData = rawProviderData.map((item) => ({
    ...item,
    fill: getProviderColor(item.name),
  }));

  const totalSpend = providerData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #919eab3d', 
        borderRadius: 4, 
        boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
        mb: 3, 
        height: '100%',
        bgcolor: '#ffffff'
      }}
    >
      <CardContent sx={{ p: '24px !important' }}>
        
        {/* Header: Title and Provider / Dept Filter */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1rem', mb: 0.5 }}>
              Cloud Provider Cost Share
            </Typography>
            <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.82rem', lineHeight: 1.3 }}>
              Multi-cloud vendor expenditure breakdown
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 130, flexShrink: 0 }}>
            <Select
              value={selectedDept}
              onChange={onDeptChange}
              disabled={disabled}
              sx={{ fontSize: '0.8rem', borderRadius: 2, bgcolor: 'white', height: 32 }}
            >
              <MenuItem value="All">All Providers</MenuItem>
              <MenuItem value="AWS">AWS</MenuItem>
              <MenuItem value="GCP">GCP</MenuItem>
              <MenuItem value="Azure">Azure</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Legend pills */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1, mt: 1 }}>
          {providerData.map((item) => {
            const pct = Math.round((item.value / totalSpend) * 100);
            return (
              <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.fill }} />
                <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>
                  {item.name} ({pct}%)
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Donut Chart display */}
        <Box sx={{ width: '100%', height: 230, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={providerData}
                cx="50%"
                cy="50%"
                innerRadius={65}  
                outerRadius={95} 
                paddingAngle={3}   
                dataKey="value"
              />
              <Tooltip 
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}