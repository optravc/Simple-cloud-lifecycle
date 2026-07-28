import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'MovieX AI Backend', value: 45.0, color: '#1976d2' },
  { name: 'Vet Clinic Management', value: 22.5, color: '#2e7d32' },
  { name: 'Sandbox / Tests', value: 7.5, color: '#ed6c02' },
];

export default function CostBreakdownCard() {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Spending by Projects
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          สัดส่วนค่าใช้จ่ายรายวันแยกตามโปรเจกต์
        </Typography>

        {/* ส่วนแสดงกราฟโดนัท */}
        <Box sx={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* รายละเอียดคำอธิบายสี (Legend) ด้านล่าง */}
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {data.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                  {item.name}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ${item.value}/day
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}