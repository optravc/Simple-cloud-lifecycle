'use client';

import React from 'react';
import { Card, Typography, Box } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TrendDataItem {
  month: string;
  aws: number;
  azure: number;
  gcp: number;
}

interface ReportsTrendChartProps {
  data: TrendDataItem[];
}

export default function ReportsTrendChart({ data }: ReportsTrendChartProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Multi-Cloud Cost Trend (YTD)</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>แนวโน้มการใช้จ่ายสะสมแยกตามผู้ให้บริการคลาวด์ย้อนหลัง 6 เดือน</Typography>
      
      <Box sx={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#888888" fontSize={12} />
            <YAxis stroke="#888888" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
            <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, '']} />
            <Area type="monotone" dataKey="aws" stackId="1" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} name="AWS" />
            <Area type="monotone" dataKey="azure" stackId="1" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.6} name="Azure" />
            <Area type="monotone" dataKey="gcp" stackId="1" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.6} name="GCP" />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}