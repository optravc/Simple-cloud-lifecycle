'use client';

import React, { useState } from 'react';
import { 
  Card, CardContent, Typography, Box, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress, InputAdornment, TablePagination 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ResourceItem } from '@/types/performance';

interface PerformanceTableProps {
  resources: ResourceItem[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function PerformanceTable({ 
  resources = [], 
  searchTerm, 
  setSearchTerm 
}: Readonly<PerformanceTableProps>) {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedResources = resources.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getCpuColor = (usage: number): 'error' | 'warning' | 'primary' => {
    if (usage > 85) return 'error';
    if (usage > 70) return 'warning';
    return 'primary';
  };

  const getMemoryColor = (usage: number): 'error' | 'warning' | 'success' => {
    if (usage > 85) return 'error';
    if (usage > 70) return 'warning';
    return 'success';
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
    if (status === 'Healthy') return 'success';
    if (status === 'Warning') return 'warning';
    return 'error';
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent sx={{ p: '16px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Cloud Resource Health & Metrics</Typography>
          <TextField 
            size="small" 
            placeholder="Search instance or provider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem' } }}
          />
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Instance ID / Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Instance Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>CPU Usage</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Memory Usage</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedResources.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '0.78rem' }}>{row.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{row.id}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}><Chip label={row.provider} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem', py: 1 }}>{row.type}</TableCell>
                  <TableCell sx={{ width: '160px', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={Number(row.cpuUsage) || 0} 
                        color={getCpuColor(row.cpuUsage)} 
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 32, fontSize: '0.72rem' }}>
                        {(Number(row.cpuUsage) || 0).toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ width: '160px', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={Number(row.memoryUsage) || 0} 
                        color={getMemoryColor(row.memoryUsage)} 
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 32, fontSize: '0.72rem' }}>
                        {(Number(row.memoryUsage) || 0).toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip 
                      label={row.status} 
                      size="small" 
                      color={getStatusColor(row.status)} 
                      variant="outlined" 
                      sx={{ height: 20, fontSize: '0.68rem' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={resources.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            '.MuiTablePagination-toolbar': { minHeight: 36 },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
          }}
        />
      </CardContent>
    </Card>
  );
}