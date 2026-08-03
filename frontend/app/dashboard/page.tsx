'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid, Alert, } from '@mui/material'; 
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import DashboardKpiCards from '@/components/dashboard/KpiCards';
import ChargesTable from '@/components/dashboard/ChargesTable';
import CostBreakdownCard, { PieData } from '@/components/dashboard/CostBreakdownCard'; // <-- นำเข้า PieData
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const drawerWidth = 260;

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
      }
    }
  }, [router]);

  // States เดิมของคุณ...
 

  const [dashboardStats, setDashboardStats] = useState({
    totalExpenditure: 0,
    expData: [0, 0, 0, 0, 0, 0, 0],
    totalSavings: 0,
    savData: [0, 0, 0, 0, 0, 0, 0],
    usedAllocation: 0,
    allocData: [0, 0, 0, 0, 0, 0, 0],
  });

  // 1. เพิ่ม State สำหรับ Cost Allocation และ ตัวกรองแผนก
  const [allocationData, setAllocationData] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState('All');
  useEffect(() => {
    let cancelled = false;
    
    const fetchDashboardStats = async () => {
      try {
        const response = await fetchWithAuth('http://localhost:8000/api/dashboard-stats');
        
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const data = await response.json();
        
        if (!cancelled) {
          setDashboardStats(data);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    fetchDashboardStats();

    return () => { cancelled = true; };
  }, []);

  // 2. เพิ่ม useEffect สำหรับดึงข้อมูล Cost Allocation (กราฟโดนัท)
 useEffect(() => {
    let cancelled = false;
    const loadAllocationData = async () => {
      try {
        const safeDept = encodeURIComponent(selectedDept);
        const res = await fetchWithAuth(`http://localhost:8000/api/cost-allocation?department=${safeDept}`);
        
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAllocationData(data);
      } catch (err) {
        console.error("Error fetching allocation data:", err);
      }
    };
    loadAllocationData();
    return () => { cancelled = true; };
  }, [selectedDept]);

  // 3. แปลงข้อมูล Department ให้เข้ากับ Format ของ PieChart
  const pieChartData: PieData[] = React.useMemo(() => {
    if (!allocationData?.allocations || allocationData.allocations.length === 0) return [];

    const grouped: Record<string, number> = {};

    allocationData.allocations.forEach((item: any) => {
      const keyName = selectedDept === 'All' 
        ? (item.department || 'Unknown Department') 
        : (item.projectName || 'Unknown Project'); 
        
      const spend = Number(item.currentSpend) || Number(item.spend) || 0; 
      
      grouped[keyName] = (grouped[keyName] || 0) + spend;
    });
    return Object.keys(grouped).map((name) => ({
      name: name,
      value: grouped[name],
    }));
  }, [allocationData, selectedDept]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 4 }}>
          {/* ตัวกรองแผนกด้านบน (เพิ่มเข้ามาใหม่) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Executive Summary</h1>
            </Box>
        
          </Box>

       <DashboardKpiCards
            totalExpenditure={allocationData?.summary?.totalSpend || 0}
            usedAllocation={(allocationData?.summary?.complianceRate || 0).toFixed(1)}
            expData={dashboardStats.expData}
            allocData={dashboardStats.allocData}        
            totalSavings={dashboardStats.totalSavings}
            savData={dashboardStats.savData}
          />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <ChargesTable />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                <CostBreakdownCard
                  data={pieChartData}
                  selectedDept={selectedDept}
                  onDeptChange={(e) => setSelectedDept(e.target.value)}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}