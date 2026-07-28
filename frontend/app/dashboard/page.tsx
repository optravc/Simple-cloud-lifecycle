'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Alert } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import { CloudResource } from '@/types/cloud';

import DashboardKpiCards from '@/components/dashboard/KpiCards'; 
import ChargesTable from '@/components/dashboard/ChargesTable';
import CostBreakdownCard from '@/components/dashboard/CostBreakdownCard';

const drawerWidth = 260;

export default function DashboardPage() {
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [deleteCount, setDeleteCount] = useState<number>(0);
  const [saveCount, setSaveCount] = useState<number>(0);
  const [sweptNames, setSweptNames] = useState<string[]>([]);
  const [isSwept, setIsSwept] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับเก็บข้อมูลสถิติและกราฟที่ดึงมาจาก Go Backend
  const [dashboardStats, setDashboardStats] = useState({
    totalExpenditure: 0,
    expData: [0, 0, 0, 0, 0, 0, 0],
    totalSavings: 0,
    savData: [0, 0, 0, 0, 0, 0, 0],
    usedAllocation: 0,
    allocData: [0, 0, 0, 0, 0, 0, 0],
  });

  // ดึงข้อมูล Cloud Resources
  useEffect(() => {
    let cancelled = false;

    const loadResources = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/resources');
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const data: CloudResource[] = await res.json();
        if (cancelled) return;

        setResources(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching resources:", err);
        setError('ตรวจสอบ server backend go port');
      }
    };

    loadResources();

    return () => {
      cancelled = true;
    };
  }, [isSwept]);

  // ดึงข้อมูล Dashboard Stats และกราฟ 7 วันจาก Go Backend
  useEffect(() => {
    let cancelled = false;

    const loadDashboardStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/dashboard-stats');
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        setDashboardStats(data);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching dashboard stats:", err);
      }
    };

    loadDashboardStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />
        
        <Box sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {isSwept && sweptNames.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              ระบบพบความผิดปกติและ Soft-deleted เครื่องเหล่านี้แล้ว: {sweptNames.join(', ')}
            </Alert>
          )}
          
          {/* ส่งข้อมูลจริงและกราฟจาก State เข้าไปที่ DashboardKpiCards[cite: 2] */}
          <DashboardKpiCards 
            totalExpenditure={dashboardStats.totalExpenditure}
            expData={dashboardStats.expData}
            totalSavings={saveCount > 0 ? saveCount : dashboardStats.totalSavings}
            savData={dashboardStats.savData}
            usedAllocation={dashboardStats.usedAllocation}
            allocData={dashboardStats.allocData}
          />

          <Grid container spacing={3}>
            {/* Table Area Component */}
            <Grid size={{ xs: 12, md: 8 }}>
              <ChargesTable />
            </Grid>

            {/* Lifecycle Status Card Component */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <CostBreakdownCard />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}