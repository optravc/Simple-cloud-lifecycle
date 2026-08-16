'use client';

import { Card, CardContent, Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BudgetAllocationChartProps } from '@/types/budget';

export default function BudgetAllocationChart({ 
  departments 
}: Readonly<BudgetAllocationChartProps>) {
  
  const chartData = departments.map((d) => ({
    name: d.name,
    'Spent MTD': d.spent,
    'Allocated Budget': d.allocated,
    'Forecasted Spend': Math.round(d.forecasted),
  }));

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #f0f0f0', 
        borderRadius: 3, 
        height: '100%'
      }}
    >
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Cost Center / Department Budget Allocation
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.85rem' }}>
            Compare actual spent, allocated budget, and month-end forecast per department
          </Typography>
        </Box>

        {/* Bar Chart with 3 bars for clear comparison */}
        <Box sx={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '12px', fontWeight: 600 }} />
              <Bar dataKey="Spent MTD" fill="#2065D1" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="Allocated Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="Forecasted Spend" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}