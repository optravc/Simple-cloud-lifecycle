'use client';

import React from 'react';
import { 
  Card, CardContent, Typography, Box, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress, InputAdornment 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface ResourceItem {
  id: string;
  name: string;
  provider: string;
  type: string;
  cpuUsage: number;
  memoryUsage: number;
  status: 'Healthy' | 'Warning' | 'Critical';
}

interface PerformanceTableProps {
  resources: ResourceItem[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function PerformanceTable({ resources, searchTerm, setSearchTerm }: PerformanceTableProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Cloud Resource Health & Metrics</Typography>
          <TextField 
            size="small" 
            placeholder="Search instance or provider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Instance ID / Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Instance Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>CPU Usage</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Memory Usage</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c' }}>{row.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.id}</Typography>
                  </TableCell>
                  <TableCell><Chip label={row.provider} size="small" variant="outlined" /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{row.type}</TableCell>
                  <TableCell sx={{ width: '180px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={row.cpuUsage} 
                        color={row.cpuUsage > 85 ? 'error' : row.cpuUsage > 70 ? 'warning' : 'primary'} 
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 35 }}>{row.cpuUsage}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ width: '180px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={row.memoryUsage} 
                        color={row.memoryUsage > 85 ? 'error' : row.memoryUsage > 70 ? 'warning' : 'success'} 
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 35 }}>{row.memoryUsage}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status} 
                      size="small" 
                      color={row.status === 'Healthy' ? 'success' : row.status === 'Warning' ? 'warning' : 'error'} 
                      variant="outlined" 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}