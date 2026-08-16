'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid, Alert } from '@mui/material';
import { getUserInfo } from '@/lib/auth';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import AllocationInsights from '@/components/allocation/AllocationInsights';
import AllocationTable from '@/components/allocation/AllocationTable';
import AllocationFilterToolbar from '@/components/allocation/AllocationFilterToolbar';
import AllocationDonutChart from '@/components/allocation/AllocationDonutChart';
import { AllocationItem, AllocationSummary } from '@/types/allocation';
import { getCostAllocationData } from '@/lib/api';

const drawerWidth = 260;
const COLORS = ['#2065D1', '#826af9', '#FFAB00', '#2ea043', '#d32f2f', '#00bcd4', '#9c27b0'];
const DEPARTMENT_COLORS: Record<string, string> = {
  'Core Infrastructure': '#2065D1',
  'Product Engineering': '#826af9',
  'Data Science & Analytics': '#FFAB00',
  'Trust & Safety': '#2ea043',
  'Finance': '#d32f2f',
  'Executive / C-Level': '#00bcd4',
  'FinOps & Cloud Governance': '#9c27b0',
};

export default function CostAllocationPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [summary, setSummary] = useState<AllocationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAllocationData = async () => {
      const info = getUserInfo();
      if (!info) {
        router.push('/login');
        return;
      }
      if (info.role === 'dev') {
        router.push('/dashboard');
        return;
      }
      setIsAuthorized(true);

      try {
        setLoading(true);
        const data = await getCostAllocationData();
        if (cancelled) {
          return;
        }

        setAllocations(data.allocations);
        setSummary(data.summary);
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error('Error fetching allocation data:', err);
        setError('Failed to fetch Cost Allocation data from backend');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAllocationData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredAllocations = allocations.filter((item) => {
    const matchDept = selectedDept === 'All' || item.department === selectedDept;
    const matchTag = tagFilter === 'All' || (tagFilter === 'Tagged' ? item.isTagged : !item.isTagged);
    const matchSearch = item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDept && matchTag && matchSearch;
  });

  const pieData = selectedDept === 'All'
    ? (summary?.departments ?? []).map((item) => ({ name: item.department, value: item.spend }))
    : filteredAllocations.map((item) => ({ name: item.projectName, value: item.spend }));

  const pieDataWithColors = pieData.map((entry, index) => {
    if (selectedDept === 'All') {
      return {
        ...entry,
        fill: DEPARTMENT_COLORS[entry.name] || COLORS[index % COLORS.length],
      };
    }
    return {
      ...entry,
      fill: COLORS[index % COLORS.length],
    };
  });

  // Calculate statistics by selected department
  const deptAllocations = allocations.filter(
    (item) => selectedDept === 'All' || item.department === selectedDept
  );
  const deptTaggedCount = deptAllocations.filter((item) => item.isTagged).length;
  const deptUntaggedCount = deptAllocations.length - deptTaggedCount;
  const deptComplianceRate = deptAllocations.length > 0 
    ? (deptTaggedCount / deptAllocations.length) * 100 
    : 0;
  const deptAverageMomChange = deptAllocations.length > 0 
    ? deptAllocations.reduce((sum, item) => sum + item.momChange, 0) / deptAllocations.length 
    : 0;

  const handleExportReport = () => {
    if (filteredAllocations.length === 0) return;

    const headers = ['Department', 'Project Name', 'Project ID', 'Owner', 'Provider', 'Allocation Model', 'Tag Status', 'MoM Change', 'Current Spend'];
    const csvContent = [
      headers.join(','),
      ...filteredAllocations.map(item => [
        `"${item.department}"`,
        `"${item.projectName}"`,
        `"${item.id}"`,
        `"${item.owner}"`,
        `"${item.provider}"`,
        `"${item.allocationModel}"`,
        item.isTagged ? 'Tagged' : 'Untagged',
        `"${item.momChange}%"`,
        item.spend
      ].join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cost_Allocation_Report_${selectedDept.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
              {error}
            </Alert>
          )}

          {/* Header & Filter Bar Toolbar Component */}
          <AllocationFilterToolbar
            selectedDept={selectedDept}
            onDeptChange={setSelectedDept}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            onExport={handleExportReport}
            disableExport={filteredAllocations.length === 0}
          />

          {/* Top Component: Horizontal Governance Stat Banner Bar */}
          <AllocationInsights
            selectedDept={selectedDept}
            complianceRate={deptComplianceRate}
            taggedCount={deptTaggedCount}
            untaggedCount={deptUntaggedCount}
            averageMomChange={deptAverageMomChange}
          />

          {/* Main 2-Column Split: AllocationTable on Left (7.5), Donut Chart on Right (4.5) */}
          <Grid container spacing={2.5}>
            {/* Left Column: Cost Allocation Details Table */}
            <Grid size={{ xs: 12, md: 7.5 }}>
              <AllocationTable 
                allocations={filteredAllocations} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
              />
            </Grid>

            {/* Right Column: Spending Donut Chart Component */}
            <Grid size={{ xs: 12, md: 4.5 }}>
              <AllocationDonutChart
                selectedDept={selectedDept}
                pieDataWithColors={pieDataWithColors}
                loading={loading}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}