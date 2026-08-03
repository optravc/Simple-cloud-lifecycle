'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Button, TextField, MenuItem, Alert, CircularProgress 
} from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import AllocationIsights from '@/components/allocation/AllocationIsights';
import AllocationTable from '@/components/allocation/AllocationTable';
import { AllocationItem, AllocationSummary } from '@/types/cloud';
import { getCostAllocationData } from '@/lib/api';

const drawerWidth = 260;

// 1. ประกาศ COLORS ไว้ด้านบนสุดตรงนี้ (แก้ปัญหา Uncaught ReferenceError)
const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#00bcd4'];

export default function CostAllocationPage() {
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
        setError('ไม่สามารถดึงข้อมูล Cost Allocation จาก backend ได้');
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
  }, []);

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

  // 2. ตอนนี้สามารถเรียกใช้ COLORS ด้านล่างนี้ได้อย่างถูกต้องแล้ว
  const pieDataWithColors = pieData.map((entry, index) => ({
    ...entry,
    fill: COLORS[index % COLORS.length],
  }));

  const handleExportReport = () => {
    alert('Exporting Enterprise Cost Allocation & Chargeback Report (CSV)...');
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

          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                Cost Allocation & Showback
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                วิเคราะห์และกระจายสัดส่วนค่าใช้จ่ายคลาวด์จำแนกตามแผนกและโปรเจกต์
              </Typography>
            </Box>

            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />} 
              onClick={handleExportReport}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Export Report
            </Button>
          </Box>

          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              select
              size="small"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              sx={{ minWidth: 220, bgcolor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="All">All Departments (ภาพรวมทุกแผนก)</MenuItem>
              <MenuItem value="Engineering & R&D">Engineering & R&D</MenuItem>
              <MenuItem value="Data & AI Platform">Data & AI Platform</MenuItem>
              <MenuItem value="Marketing & Analytics">Marketing & Analytics</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="All">All Tag Status</MenuItem>
              <MenuItem value="Tagged">Tagged (ติดแท็กครบถ้วน)</MenuItem>
              <MenuItem value="Untagged">Untagged (ยังไม่ติดแท็ก)</MenuItem>
            </TextField>
          </Box>

          {/* Grid: Charts & Insights Component */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, height: '100%', p: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedDept === 'All' ? 'Spending by Departments' : `Spending by Projects (${selectedDept})`}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {selectedDept === 'All' ? 'สัดส่วนค่าใช้จ่ายภาพรวมแยกตามแผนกหลัก' : 'สัดส่วนค่าใช้จ่ายรายโปรเจกต์ภายใต้แผนกที่เลือก'}
                  </Typography>
                  
                  <Box sx={{ width: '100%', height: 200 }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieDataWithColors} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} />
                          <Tooltip formatter={(value) => {
                            const numericValue = Number(value ?? 0);
                            return [`$${numericValue.toLocaleString()}`, 'Spend'];
                          }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    {pieData.map((item, idx) => (
                      <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, bgcolor: COLORS[idx % COLORS.length], borderRadius: '50%' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{item.name}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${item.value.toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* เรียกใช้งาน Insights Component ที่แยกออกมา */}
            <Grid size={{ xs: 12, md: 7 }}>
              <AllocationIsights
                selectedDept={selectedDept}
                complianceRate={summary?.complianceRate ?? 0}
                taggedCount={summary?.taggedCount ?? 0}
                untaggedCount={summary?.untaggedCount ?? 0}
                averageMomChange={summary?.averageMomChange ?? 0}
              />
            </Grid>
          </Grid>

          {/* เรียกใช้งาน Table Component ที่แยกออกมา */}
          <AllocationTable 
            allocations={filteredAllocations} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </Box>
      </Box>
    </Box>
  );
}