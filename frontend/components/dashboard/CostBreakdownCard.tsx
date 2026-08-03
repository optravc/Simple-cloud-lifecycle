import React from 'react';
import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface PieData {
  name: string;
  value: number;
  color?: string; // เปลี่ยนเป็น Optional เพราะเดี๋ยวเรามากำหนดสีข้างในนี้
}

interface CostBreakdownCardProps {
  data: PieData[];
  selectedDept: string;
  onDeptChange: (event: SelectChangeEvent) => void;
}

const PIE_COLORS = ['#2065D1', '#826af9', '#FFAB00',];

export default function CostBreakdownCard({ data = [], selectedDept, onDeptChange }: CostBreakdownCardProps) {
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
        
        {/* ส่วนหัว: Title และ Dropdown เลือกแผนก */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1rem', mb: 0.5 }}>
              {selectedDept === 'All' ? 'Spending by Departments' : 'Spending by Projects'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.85rem' }}>
              {selectedDept === 'All' 
                ? 'Expense breakdown by department' 
                : `Project spending breakdown for ${selectedDept}`}
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="dept-select-label" sx={{ fontSize: '0.8rem' }}>Department</InputLabel>
            <Select
              labelId="dept-select-label"
              value={selectedDept}
              label="Department"
              onChange={onDeptChange}
              sx={{ fontSize: '0.85rem', borderRadius: 2, bgcolor: 'white' }}
            >
              <MenuItem value="All">All Departments</MenuItem>
              <MenuItem value="Engineering & R&D">Engineering & R&D</MenuItem>
              <MenuItem value="Data & AI Platform">Data & AI Platform</MenuItem>
              <MenuItem value="Marketing & Analytics">Marketing & Analytics</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {data.length > 0 ? (
          <>
            {/* Legend ด้านบน (ดึงสีจาก PIE_COLORS มาแสดงผลคู่กัน) */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1, mt: 2 }}>
              {data.map((item, index) => {
                const itemColor = PIE_COLORS[index % PIE_COLORS.length];
                return (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: itemColor }} />
                    <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* ส่วนแสดงกราฟโดนัท */}
            <Box sx={{ width: '100%', height: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}  
                    outerRadius={95} 
                    paddingAngle={3}   
                    dataKey="value"
                  >
                    {data.map((_, index) => {
                      const itemColor = PIE_COLORS[index % PIE_COLORS.length];
                      return <Cell key={`cell-${index}`} fill={itemColor} stroke="none" />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </>
        ) : (
          <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#637381', fontSize: '0.85rem' }}>
            No data available for the selected department.
          </Box>
        )}
      </CardContent>
    </Card>
  );
}