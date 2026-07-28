'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Alert } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import { CloudResource, SweepResponse } from '@/types/cloud';
import ManageKpiCards from '@/components/manage/ManageKpiCards';
import ResourceTable from '@/components/manage/ResourceTable';
import LifecycleStatusCard from '@/components/LifecycleStatusCard';
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

  // คำนวณจำนวนเครื่อง Active ทั้งหมด
  const activeCount = resources.length;

  // คำนวณเงินที่จะประหยัดได้จากเครื่องที่ Idle เกิน 14 วัน
  const potentialSavings = resources
    .filter((res) => (res.day_idle ?? 0) > 14)
    .reduce((sum, res) => sum + (res.cost_per_day ?? 0), 0);

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

  const handleScanAndSweep = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/scan', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data: SweepResponse = await res.json();
      
      setDeleteCount(data.Items_swept);
      setSaveCount(Number(data.saved_cost_daily ?? 0));
      setSweptNames(data.Swept_details ?? []);
      setIsSwept(prev => !prev);
    } catch (err) {
      console.error("Error running scan and sweep:", err);
      setError('ตรวจสอบ server backend go port');
    } finally {
      setLoading(false);
    }
  };

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
          
          {/* ใช้ Manage KPI Cards Component สำหรับหน้า Manage */}
          <ManageKpiCards 
            activeCount={activeCount} 
            potentialSavings={potentialSavings > 0 ? potentialSavings : saveCount} 
            flaggedCount={deleteCount} 
          />

          <Grid container spacing={3}>
            {/* Table Area Component */}
           <Grid size={{ xs: 12, md: 8 }}>
              <ResourceTable 
                resources={resources} 
                loading={loading} 
                onScanAndSweep={handleScanAndSweep} 
              />
            </Grid>

            {/* Lifecycle Status Card Component */}
          <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <CostBreakdownCard />
                <LifecycleStatusCard deleteCount={deleteCount} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}