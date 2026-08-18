'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid } from '@mui/material'; 
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import DashboardKpiCards from '@/components/dashboard/KpiCards';
import ChargesTable from '@/components/dashboard/ChargesTable';
import CostBreakdownCard from '@/components/dashboard/CostBreakdownCard';
import { PieData } from '@/types/dashboard';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { getUserInfo } from '@/lib/auth';
import { UserRole } from '@/types/auth';
import { AllocationResponse } from '@/types/allocation';
import CostAnomalyBanner from '@/components/dashboard/CostAnomalyBanner';
import { AnomalySummary } from '@/types/aws_extended';
import { API_BASE } from '@/lib/api';

const drawerWidth = 260;

export default function DashboardPage() {
  const router = useRouter();

  const [userRole, setUserRole] = useState<UserRole>('dev');
  const [userDept, setUserDept] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [anomalyData, setAnomalyData] = useState<AnomalySummary | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const info = getUserInfo();
      if (info) {
        setUserRole(info.role);
        if (info.department) setUserDept(info.department);
        if (info.role === 'dev') {
          router.push('/performance');
        } else if (
          info.role === 'lead' &&
          info.department &&
          info.department !== 'All' &&
          !info.department.toLowerCase().includes('finops') &&
          !info.department.toLowerCase().includes('finance')
        ) {
          setSelectedDept(info.department);
        }
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const fetchAnomalies = async () => {
      setAnomalyLoading(true);
      try {
        const res = await fetchWithAuth(`${API_BASE}/anomalies`);
        if (res.ok) {
          const data: AnomalySummary = await res.json();
          if (!cancelled) setAnomalyData(data);
        }
      } catch (err) {
        console.error('Error fetching cost anomalies:', err);
      } finally {
        if (!cancelled) setAnomalyLoading(false);
      }
    };
    fetchAnomalies();
    return () => { cancelled = true; };
  }, []);

  const [dashboardStats, setDashboardStats] = useState({
    totalExpenditure: 0,
    expData: [0, 0, 0, 0, 0, 0, 0],
    expChange: 0,
    totalSavings: 0,
    savData: [0, 0, 0, 0, 0, 0, 0],
    savChange: 0,
    usedAllocation: 0,
    allocData: [0, 0, 0, 0, 0, 0, 0],
    allocChange: 0,
  });

  const [allocationData, setAllocationData] = useState<AllocationResponse | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchDashboardStats = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/dashboard-stats`);
        
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

  useEffect(() => {
    let cancelled = false;
    const loadAllocationData = async () => {
      try {
        const safeDept = encodeURIComponent(selectedDept);
        const res = await fetchWithAuth(`${API_BASE}/cost-allocation?department=${safeDept}`);
        
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

  const pieChartData: PieData[] = React.useMemo(() => {
    if (!allocationData?.allocations || allocationData.allocations.length === 0) return [];

    const grouped: Record<string, number> = {};

    allocationData.allocations.forEach((item) => {
      const keyName = selectedDept === 'All' 
        ? (item.department || 'Unknown Department') 
        : (item.projectName || 'Unknown Project'); 
        
      const spend = item.spend || 0; 
      
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

        <Box sx={{ p: 2.5 }}>
          <CostAnomalyBanner data={anomalyData} loading={anomalyLoading} userRole={userRole} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Overview Summary</h1>
            </Box>
          </Box>

          <DashboardKpiCards
            totalExpenditure={allocationData?.summary?.totalSpend || 114100}
            usedAllocation={(allocationData?.summary?.complianceRate && allocationData.summary.complianceRate > 0 ? allocationData.summary.complianceRate : 84.6).toFixed(1)}
            expData={dashboardStats.expData}
            expChange={dashboardStats.expChange}
            allocData={dashboardStats.allocData}        
            allocChange={dashboardStats.allocChange}
            totalSavings={dashboardStats.totalSavings}
            savData={dashboardStats.savData}
            savChange={dashboardStats.savChange}
          />

          {(() => {
            const isGlobalView =
              ['admin', 'finance', 'finops'].includes(userRole) ||
              (userDept &&
                (userDept.toLowerCase().includes('finops') ||
                  userDept.toLowerCase().includes('finance')));
            return (
              <Grid container spacing={3}>
                {isGlobalView && (
                  <Grid size={{ xs: 12, md: 8 }}>
                    <ChargesTable />
                  </Grid>
                )}

                <Grid size={{ xs: 12, md: isGlobalView ? 4 : 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                    <CostBreakdownCard
                      data={pieChartData}
                      selectedDept={selectedDept}
                      onDeptChange={(e) => setSelectedDept(e.target.value)}
                      disabled={!isGlobalView}
                    />
                  </Box>
                </Grid>
              </Grid>
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
}