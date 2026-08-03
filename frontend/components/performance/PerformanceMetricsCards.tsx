'use client';

import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import DnsIcon from '@mui/icons-material/Dns';

interface PerformanceMetricsCardsProps {
  avgCpu: number;
  avgMemory: number;
  activeNodes: number;
}

// คอมโพเนนต์ย่อยสำหรับวาดหน้าปัดแบบเข็ม (Gauge Meter)
function GaugeMeter({ value, label, color }: { value: number; label: string; color: string }) {
  // คำนวณองศาของเข็ม (0% = -90 องศา, 100% = +90 องศา)
  const angle = (value / 100) * 180 - 90;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: 110 }}>
      {/* SVG หน้าปัดครึ่งวงกลม */}
      <svg width="140" height="75" viewBox="0 0 140 75">
        {/* เส้นพื้นหลังโค้ง */}
        <path
          d="M 15 70 A 55 55 0 0 1 125 70"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* เส้นแสดงค่าจริง */}
        <path
          d="M 15 70 A 55 55 0 0 1 125 70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="172.78"
          strokeDashoffset={172.78 - (172.78 * value) / 100}
        />
        {/* เข็มชี้ (Gauge Needle) หมุนตามค่า value */}
        <g transform={`rotate(${angle} 70 70)`}>
          <polygon points="70,20 67,70 73,70" fill="#1a202c" />
          <circle cx="70" cy="70" r="5" fill="#1a202c" />
        </g>
      </svg>
      {/* ตัวเลขบอกค่าเปอร์เซ็นต์ตรงกลาง */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a202c', mt: -1 }}>
        {value}%
      </Typography>
    </Box>
  );
}

export default function PerformanceMetricsCards({ avgCpu, avgMemory, activeNodes }: PerformanceMetricsCardsProps) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* การ์ด CPU Gauge */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SpeedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Average CPU Usage</Typography>
            </Box>
            <GaugeMeter value={avgCpu} label="CPU" color="#1976d2" />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
              อัตราการใช้ซีพียูเฉลี่ยของคลัสเตอร์
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* การ์ด Memory Gauge */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MemoryIcon color="success" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Average Memory Usage</Typography>
            </Box>
            <GaugeMeter value={avgMemory} label="Memory" color="#2e7d32" />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
              อัตราการใช้หน่วยความจำ RAM เฉลี่ย
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* การ์ด Active Nodes ปกติ (เพราะเป็นจำนวนนับ ไม่ใช่เปอร์เซ็นต์) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DnsIcon color="warning" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Active Nodes / Instances</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 110 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1a202c', my: 'auto' }}>
                {activeNodes}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                เซิร์ฟเวอร์ที่กำลังเปิดใช้งานจริง
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}