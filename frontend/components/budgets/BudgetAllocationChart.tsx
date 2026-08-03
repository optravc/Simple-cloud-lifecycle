'use client';

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DepartmentBudget {
  department: string;
  owner: string;
  allocated: number;
  spent: number;
}

interface BudgetAllocationChartProps {
  departments: DepartmentBudget[];
}

export default function BudgetAllocationChart({ departments }: BudgetAllocationChartProps) {
  const chartData = departments.map((d) => ({
    name: d.department,
    Spent: d.spent,
    Remaining: Math.max(0, d.allocated - d.spent),
    Allocated: d.allocated,
  }));

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #f0f0f0', 
        borderRadius: 3, 
        p: 2,
        height: '100%'
      }}
    >
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Cost Center / Department Budget Allocation
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            เปรียบเทียบยอดการใช้จริง (Spent) กับงบประมาณที่จัดสรร (Allocated) แยกตามแผนกประจำเดือนนี้
          </Typography>
        </Box>

        {/* กราฟแท่ง (Bar Chart) แบบเต็มพื้นที่ สะอาดตา */}
        <Box sx={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 12 }} />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: 15, fontSize: '12px' }} />
              <Bar dataKey="Spent" name="Spent (ใช้ไปแล้ว)" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="Remaining" name="Remaining Budget (งบที่เหลือ)" fill="#e0e0e0" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}