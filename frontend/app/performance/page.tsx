'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, Button, CircularProgress, Alert } from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import PerformanceMetricsCards from '@/components/performance/PerformanceMetricsCards';
import PerformanceTable from '@/components/performance/PerformanceTable';
import { getPerformanceData } from '@/lib/api';
import { PerformanceResponse } from '@/types/performance';

const drawerWidth = 260;

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await getPerformanceData();
      setData(result);
    } catch (err: unknown) {
      console.error('Failed to fetch performance data:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch performance metrics';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (active) {
        await fetchData();
      }
    }
    load();
    return () => { active = false; };
  }, [fetchData]);

  const filteredResources = (data?.instances ?? []).filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Fetching data from AWS CloudWatch...
            </Typography>
          </Box>
        </Box>
      );
    }

    if (!data) return null;

    return (
      <>
        {/* Top KPI Summary Cards */}
        <PerformanceMetricsCards 
          avgCpu={data.summary.avgCpu} 
          avgMemory={data.summary.avgMemory} 
          activeNodes={data.summary.activeNodes} 
        />

        {/* CPU & Memory Trend Chart */}
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem', mb: 0.2 }}>
            Cluster CPU & Memory Utilization Trend (24h)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
            Average utilization over the past 24 hours
          </Typography>
          
          <Box sx={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, '']} />
                <Line type="monotone" dataKey="cpu" stroke="#1976d2" strokeWidth={2} name="CPU Usage" dot={false} />
                <Line type="monotone" dataKey="memory" stroke="#2e7d32" strokeWidth={2} name="Memory Usage" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Resource Performance Table */}
        <PerformanceTable 
          resources={filteredResources} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
      </>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 2.5 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '1.15rem' }}>
                Cloud Performance & Health
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Monitor resource utilization, CPU/RAM usage, and infrastructure health
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 18 }} />} 
              onClick={() => fetchData(true)}
              disabled={refreshing}
              sx={{ borderRadius: 2, textTransform: 'none', height: 34, fontSize: '0.8rem' }}
            >
              {refreshing ? 'Loading...' : 'Refresh Metrics'}
            </Button>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Content Body */}
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}