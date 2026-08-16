'use client';


import { Card, CardContent, Box, Typography, CircularProgress } from '@mui/material';
import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import { AllocationDonutChartProps } from '@/types/allocation';

export default function AllocationDonutChart({
  selectedDept,
  pieDataWithColors,
  loading,
}: Readonly<AllocationDonutChartProps>) {
  const isAllDepts = selectedDept === 'All';

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #919eab3d', 
        borderRadius: 4, 
        boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
        bgcolor: '#ffffff',
      }}
    >
      <CardContent sx={{ p: '24px !important' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1rem', mb: 0.5 }}>
            {isAllDepts ? 'Spending by Departments' : `Spending by Projects (${selectedDept})`}
          </Typography>
          <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.82rem', lineHeight: 1.3 }}>
            {isAllDepts ? 'Overall spending share by main departments' : 'Project spending share under selected department'}
          </Typography>
        </Box>

        {/* Legend Pills */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 2 }}>
          {pieDataWithColors.map((item) => (
            <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.fill, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.75rem' }}>
                {item.name} (${item.value.toLocaleString()})
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Donut Chart Display */}
        <Box sx={{ width: '100%', height: 260, position: 'relative' }}>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieDataWithColors} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={68} 
                  outerRadius={98} 
                  paddingAngle={3}
                  stroke="none"
                />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
