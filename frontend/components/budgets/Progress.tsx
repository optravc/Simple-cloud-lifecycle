import { useState } from 'react';
import { Card, CardContent, Box, Typography, LinearProgress, Chip, Select, MenuItem, FormControl } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ProgressProps } from '@/types/budget';

export default function Progress({ 
  usagePercent, 
  totalSpent, 
  totalBudget,
  departments = []
}: Readonly<ProgressProps>) {
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>('all');

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Critical':
        return (
          <Chip
            size="small"
            icon={<WarningIcon style={{ color: '#d32f2f', fontSize: '13px' }} />}
            label="Exceeded"
            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 'bold', border: '1px solid #ffcdd2', height: 20, fontSize: '0.68rem' }}
          />
        );
      case 'Warning':
        return (
          <Chip
            size="small"
            icon={<WarningAmberIcon style={{ color: '#ed6c02', fontSize: '13px' }} />}
            label="Warning (>80%)"
            sx={{ bgcolor: '#fff3e0', color: '#ed6c02', fontWeight: 'bold', border: '1px solid #ffe0b2', height: 20, fontSize: '0.68rem' }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            icon={<CheckCircleIcon style={{ color: '#2e7d32', fontSize: '13px' }} />}
            label="Within Limit"
            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', border: '1px solid #c8e6c9', height: 20, fontSize: '0.68rem' }}
          />
        );
    }
  };

  const getBarColor = (status: string) => {
    if (status === 'Critical') return '#d32f2f';
    if (status === 'Warning') return '#ed6c02';
    return '#2e7d32';
  };

  const activeDepts = selectedDeptId === 'all' 
    ? departments.slice(0, 4) // Show top 4 spenders to fill vertical height elegantly
    : departments.filter(d => d.id === selectedDeptId);

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Enterprise Consumption
          </Typography>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value as number | 'all')}
              sx={{ height: 30, fontSize: '0.8rem', borderRadius: 1.5, bgcolor: '#f8fafc' }}
            >
              <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>Top Spenders (Default)</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id} sx={{ fontSize: '0.8rem' }}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
            Total usage: <Box component="span" sx={{ fontWeight: 'bold', color: '#1a202c' }}>${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}</Box>
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ fontWeight: 'bold', color: usagePercent > 85 ? '#d32f2f' : 'primary.main', fontSize: '0.85rem' }}
          >
            {usagePercent.toFixed(1)}% Used
          </Typography>
        </Box>
 
        <LinearProgress 
          variant="determinate" 
          value={Math.min(usagePercent, 100)} 
          sx={{ 
            height: 8, 
            borderRadius: 4, 
            bgcolor: '#e0e0e0', 
            mb: 2,
            '& .MuiLinearProgress-bar': { bgcolor: usagePercent > 85 ? '#d32f2f' : '#1976d2' } 
          }} 
        />
 
        {/* Department status details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeDepts.map((dept, idx) => {
            const deptPercent = dept.allocated > 0 ? Math.round((dept.spent / dept.allocated) * 100) : 0;
            return (
              <Box key={dept.id} sx={{ pb: idx !== activeDepts.length - 1 ? 1.2 : 0, borderBottom: idx !== activeDepts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '0.85rem' }}>
                    {dept.name}
                  </Typography>
                  {getStatusChip(dept.status)}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                    Spent MTD: <strong>${dept.spent.toLocaleString()}</strong> of ${dept.allocated.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: '0.78rem' }}>
                    {deptPercent}%
                  </Typography>
                </Box>
 
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(deptPercent, 100)} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3, 
                    bgcolor: '#f0f0f0',
                    mb: 0.6,
                    '& .MuiLinearProgress-bar': { bgcolor: getBarColor(dept.status) } 
                  }} 
                />
 
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#0288d1', fontWeight: 'bold', fontSize: '0.75rem' }}>
                    Forecast: ${Math.round(dept.forecasted).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                    Alerts: {dept.slack}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}