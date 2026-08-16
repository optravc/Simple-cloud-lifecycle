'use client';

import { useState } from 'react';
import { 
  Card, CardContent, Typography, Box, TextField, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, InputAdornment, TablePagination 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ProjectDetailModal from './ProjectDetailModal';
import { AllocationTableProps, AllocationItem } from '@/types/allocation';

export default function AllocationTable({ 
  allocations = [], 
  searchTerm, 
  setSearchTerm 
}: Readonly<AllocationTableProps>) {
  // State to open/close and hold selected project detail
  const [selectedProject, setSelectedProject] = useState<AllocationItem | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAllocations = allocations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <Card 
        elevation={0} 
        sx={{ 
          border: '1px solid #919eab3d', 
          borderRadius: 4, 
          boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
          bgcolor: '#ffffff'
        }}
      >
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1rem' }}>
              Cost Allocation Details & MoM Variance
            </Typography>
            <TextField 
              size="small" 
              placeholder="Search project or dept..." 
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
              sx={{ width: 240, '& .MuiInputBase-root': { fontSize: '0.82rem', height: 36, borderRadius: 2 } }}
            />
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }}>Tag Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }}>MoM Change</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }} align="right">Current Spend</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.78rem', py: 1 }} align="center">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAllocations.map((row) => (
                  <TableRow 
                    key={row.id} 
                    hover 
                    onClick={() => setSelectedProject(row)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '0.78rem', py: 1 }}>{row.department}</TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '0.78rem', lineHeight: 1.2 }}>{row.projectName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>{row.id}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', py: 1, whiteSpace: 'nowrap' }}>{row.owner}</TableCell>
                    <TableCell sx={{ py: 1 }}><Chip label={row.provider} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} /></TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={row.isTagged ? 'Tagged' : 'Untagged'} 
                        size="small" 
                        color={row.isTagged ? 'success' : 'error'} 
                        variant="outlined" 
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: row.momChange >= 0 ? '#FF5630' : '#00AB55', fontWeight: 'bold', fontSize: '0.78rem' }}>
                        {row.momChange >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                        {row.momChange >= 0 ? `+${row.momChange}%` : `${row.momChange}%`}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 1, color: '#212b36' }} align="right">${row.spend.toLocaleString()}</TableCell>
                    <TableCell sx={{ py: 1 }} align="center">
                      <Tooltip title="View Project & Allocation Details">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(row);
                          }}
                          sx={{ 
                            color: '#1976d2', 
                            bgcolor: '#e3f2fd', 
                            p: 0.6, 
                            '&:hover': { bgcolor: '#bbdefb' } 
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={allocations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              '.MuiTablePagination-toolbar': { minHeight: 44 },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.8rem' },
            }}
          />
        </CardContent>
      </Card>

      {/* Render ProjectDetailModal when user clicks a row */}
      <ProjectDetailModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </>
  );
}