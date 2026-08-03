'use client';

import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress } from '@mui/material';

interface DepartmentBudget {
  department: string;
  allocated: number;
  spent: number;
}

interface ProgressProps {
  usagePercent: number;
  totalSpent: number;
  totalBudget: number;
  departments: DepartmentBudget[];
}

export default function Progress({ usagePercent, totalSpent, totalBudget, departments }: ProgressProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ p: '24px !important' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Enterprise Consumption
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total usage: <Box component="span" sx={{ fontWeight: 'bold', color: '#1a202c' }}>${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}</Box>
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ fontWeight: 'bold', color: usagePercent > 85 ? '#d32f2f' : 'primary.main' }}
          >
            {usagePercent}% Used
          </Typography>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={Math.min(usagePercent, 100)} 
          sx={{ 
            height: 10, 
            borderRadius: 5, 
            bgcolor: '#e0e0e0', 
            mb: 3,
            '& .MuiLinearProgress-bar': { bgcolor: usagePercent > 85 ? '#d32f2f' : '#1976d2' } 
          }} 
        />

        {/* รายการย่อยแต่ละแผนก สไตล์เดียวกับตัวอย่าง */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {departments.map((dept, idx) => {
            const deptPercent = Math.round((dept.spent / dept.allocated) * 100);
            return (
              <Box key={idx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                    {dept.department}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ${dept.spent.toLocaleString()} / ${dept.allocated.toLocaleString()}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(deptPercent, 100)} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3, 
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': { bgcolor: deptPercent > 90 ? '#d32f2f' : '#2e7d32' } 
                  }} 
                />
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}