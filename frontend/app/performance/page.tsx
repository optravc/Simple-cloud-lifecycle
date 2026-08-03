'use client';

import React, { useState } from 'react';
import { Box, Typography, Card, Button } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import PerformanceMetricsCards from '@/components/performance/PerformanceMetricsCards';
import PerformanceTable from '@/components/performance/PerformanceTable';

const drawerWidth = 260;

const cpuLoadData = [
  { time: '00:00', cpu: 35, memory: 50 },
  { time: '04:00', cpu: 28, memory: 48 },
  { time: '08:00', cpu: 65, memory: 75 },
  { time: '12:00', cpu: 85, memory: 90 },
  { time: '16:00', cpu: 70, memory: 82 },
  { time: '20:00', cpu: 45, memory: 60 },
];

interface ResourceItem {
  id: string;
  name: string;
  provider: string;
  type: string;
  cpuUsage: number;
  memoryUsage: number;
  status: 'Healthy' | 'Warning' | 'Critical';
}

export default function PerformancePage() {
  const [resources] = useState<ResourceItem[]>([
    { id: 'i-0192a83', name: 'moviex-backend-prod-01', provider: 'AWS', type: 't3.xlarge', cpuUsage: 78, memoryUsage: 85, status: 'Warning' },
    { id: 'i-0847b21', name: 'vet-clinic-db-master', provider: 'Azure', type: 'Standard_D4s_v3', cpuUsage: 42, memoryUsage: 55, status: 'Healthy' },
    { id: 'i-0392c11', name: 'sandbox-test-env', provider: 'GCP', type: 'e2-medium', cpuUsage: 12, memoryUsage: 25, status: 'Healthy' },
    { id: 'i-0994f88', name: 'ai-recommendation-worker', provider: 'AWS', type: 'g4dn.xlarge', cpuUsage: 94, memoryUsage: 92, status: 'Critical' },
  ]);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredResources = resources.filter((item) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 4 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                Cloud Performance & Health
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ตรวจสอบประสิทธิภาพการทำงาน อัตราการใช้ CPU/RAM และสุขภาพของโครงสร้างพื้นฐานคลาวด์
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={() => alert('Refreshing metrics data...')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Refresh Metrics
            </Button>
          </Box>

          {/* Top KPI Summary Cards Component */}
          <PerformanceMetricsCards 
            avgCpu={64.5} 
            avgMemory={68.0} 
            activeNodes={24} 
          />

          {/* CPU & Memory Trend Chart */}
          <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Cluster CPU & Memory Utilization Trend (24h)</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>อัตราการใช้งานเฉลี่ยของระบบในรอบ 24 ชั่วโมงที่ผ่านมา</Typography>
            
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuLoadData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="time" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip formatter={(value: any) => [`${value}%`, '']} />
                  <Line type="monotone" dataKey="cpu" stroke="#1976d2" strokeWidth={2.5} name="CPU Usage" dot={false} />
                  <Line type="monotone" dataKey="memory" stroke="#2e7d32" strokeWidth={2.5} name="Memory Usage" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Resource Performance Table Component */}
          <PerformanceTable 
            resources={filteredResources} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </Box>
      </Box>
    </Box>
  );
}