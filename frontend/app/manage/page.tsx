'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Alert } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import { CloudResource, SweepResponse } from '@/types/cloud';
import ManageKpiCards from '@/components/manage/ManageKpiCards';
import ResourceTable from '@/components/manage/ResourceTable';
import LifecycleStatusCard from '@/components/manage/LifecycleStatusCard';
import CostBreakdownCard from '@/components/dashboard/CostBreakdownCard';

// 1. นำเข้า Component ใหม่
import ConfirmSweepDialog from '@/components/manage/ConfirmSweepDialog';

const drawerWidth = 260;

export default function DashboardPage() {
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [deleteCount, setDeleteCount] = useState<number>(0);
  const [saveCount, setSaveCount] = useState<number>(0);
  const [sweptNames, setSweptNames] = useState<string[]>([]);
  const [isSwept, setIsSwept] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 2. เพิ่ม State สำหรับควบคุม Dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const activeResources = resources.filter(res => res.Status !== "TERMINATED" && res.Status !== "STOPPED");
  const activeCount = activeResources.length;


  const potentialSavings = resources
    .filter((res) => (res.DayIdle ?? 0) > 14)
    .reduce((sum, res) => sum + (res.Costperday ?? 0), 0);

useEffect(() => {
    let cancelled = false;

    const loadResources = async () => {
      try {
        // 1. ดึง Token จาก localStorage
        const token = localStorage.getItem('accessToken');

        // 2. แนบ Authorization Header ไปกับคำขอ
        const res = await fetch('http://localhost:8000/api/resources', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('เซสชันหมดอายุหรือยังไม่ได้เข้าสู่ระบบ (401)');
          }
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data: CloudResource[] = await res.json();
        if (cancelled) return;

        setResources(data);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Error fetching resources:", err);
        setError(err.message || 'ตรวจสอบ server backend go port');
      }
    };

    loadResources();

    return () => {
      cancelled = true;
    };
  }, [isSwept]);
  

  // ฟังก์ชันยิง API ไปที่ Backend ของ Go (/api/scan)
  // 1. เพิ่มพารามิเตอร์ settings เข้าไปในฟังก์ชัน
  const handleScanAndSweep = async (settings: { createAmi: boolean; amiName: string; retainEbs: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      // 2. เพิ่ม headers และ body สำหรับส่งข้อมูลแบบ POST ไปที่ Go
      const res = await fetch('http://localhost:8000/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // แปลงตัวแปรให้ตรงกับ JSON Struct ที่ Go คาดหวังรับ
          create_ami: settings.createAmi,
          ami_name: settings.amiName,
          retain_ebs: settings.retainEbs
        })
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data: SweepResponse = await res.json();

      // เปลี่ยนจาก data.Items_swept เป็น data.items_swept
      setDeleteCount(data.items_swept);

      setSaveCount(Number(data.saved_cost_daily ?? 0));


      setSweptNames(data.swept_details ?? []);

      setIsSwept(prev => !prev);

      setIsConfirmOpen(false);

    } catch (err) {
      console.error("Error running scan and sweep:", err);
      setError('ตรวจสอบ server backend go port');
      setIsConfirmOpen(false);
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
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              ระบบพบความผิดปกติและจัดการเครื่องเหล่านี้เรียบร้อยแล้ว: {sweptNames.join(', ')}
            </Alert>
          )}

          <ManageKpiCards
            activeCount={activeCount}
            potentialSavings={potentialSavings > 0 ? potentialSavings : saveCount}
            flaggedCount={deleteCount}
          />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              {/* 4. เปลี่ยนให้ปุ่มส่งคำสั่งมาเปิดหน้าต่าง Dialog แทนการยิง API ทันที */}
              <ResourceTable
                resources={activeResources}
                loading={loading}
                onScanAndSweep={() => setIsConfirmOpen(true)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <CostBreakdownCard />
                <LifecycleStatusCard deleteCount={deleteCount} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 5. เรียกใช้ Dialog Component ที่เราสร้างไว้ */}
      <ConfirmSweepDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleScanAndSweep}
        loading={loading}
      />

    </Box>
  );
}