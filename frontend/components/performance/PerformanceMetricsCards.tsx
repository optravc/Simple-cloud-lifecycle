'use client';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import DnsIcon from '@mui/icons-material/Dns';
import { PerformanceMetricsCardsProps } from '@/types/performance';

// Sub-component for drawing a Gauge Meter
function GaugeMeter({ value,
    color }:
     Readonly<{ value: number; color: string }>) {
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0;
  // Calculate needle angle (0% = -90 degrees, 100% = +90 degrees)
  const angle = (numericValue / 100) * 180 - 90;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: 110 }}>
      {/* SVG Half-circle dial */}
      <svg width="140" height="75" viewBox="0 0 140 75">
        {/* Background arc */}
        <path
          d="M 15 70 A 55 55 0 0 1 125 70"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 15 70 A 55 55 0 0 1 125 70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="172.78"
          strokeDashoffset={172.78 - (172.78 * numericValue) / 100}
        />
        {/* Gauge Needle rotates based on value */}
        <g transform={`rotate(${angle} 70 70)`}>
          <polygon points="70,20 67,70 73,70" fill="#1a202c" />
          <circle cx="70" cy="70" r="5" fill="#1a202c" />
        </g>
      </svg>
      {/* Percentage value in center */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a202c', mt: -1 }}>
        {numericValue.toFixed(1)}%
      </Typography>
    </Box>
  );
}

export default function PerformanceMetricsCards({
   avgCpu, 
   avgMemory, 
   activeNodes }:Readonly<PerformanceMetricsCardsProps>) {

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* CPU Gauge Arc Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SpeedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Average CPU Usage</Typography>
            </Box>
            <GaugeMeter value={avgCpu} color="#1976d2" />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
              Average cluster CPU utilization
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Memory Gauge Arc Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MemoryIcon color="success" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Average Memory Usage</Typography>
            </Box>
            <GaugeMeter value={avgMemory} color="#2e7d32" />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
              Average RAM memory utilization
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Standard Active Nodes Card (numeric count) */}
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
                Currently active running servers
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}