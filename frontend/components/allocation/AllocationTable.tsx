'use client';

import React, { useState } from 'react';
import { 
  Card, CardContent, Typography, Box, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, InputAdornment 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { AllocationItem } from '@/types/cloud';
import ProjectDetailModal from './ProjectDetailModal'; // นำเข้า Modal ที่แยกไว้

interface AllocationTableProps {
  allocations: AllocationItem[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function AllocationTable({ allocations, searchTerm, setSearchTerm }: AllocationTableProps) {
  // State สำหรับเปิด-ปิด และเก็บข้อมูลโปรเจกต์ที่ถูกคลิก
  const [selectedProject, setSelectedProject] = useState<AllocationItem | null>(null);

  return (
    <>
      <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Cost Allocation Details & MoM Variance</Typography>
            <TextField 
              size="small" 
              placeholder="Search project or department..." 
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Allocation Model</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tag Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>MoM Change</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Current Spend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* ใช้ allocations?.map ป้องกัน Error กรณีข้อมูลยังโหลดไม่เสร็จ */}
                {allocations?.map((row) => (
                  <TableRow 
                    key={row.id} 
                    hover 
                    onClick={() => setSelectedProject(row)} // คลิกเพื่อเปิด Modal ดูรายละเอียด
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>{row.department}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c' }}>{row.projectName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.id}</Typography>
                    </TableCell>
                    <TableCell>{row.owner}</TableCell>
                    <TableCell><Chip label={row.provider} size="small" variant="outlined" /></TableCell>
                    <TableCell>{row.allocationModel}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.isTagged ? 'Tagged' : 'Untagged'} 
                        size="small" 
                        color={row.isTagged ? 'success' : 'error'} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: row.momChange >= 0 ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' }}>
                        {row.momChange >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                        {row.momChange >= 0 ? `+${row.momChange}%` : `${row.momChange}%`}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">${row.spend.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* เรียกใช้งาน ProjectDetailModal แสดงผลเมื่อผู้ใช้คลิกแถวในตาราง */}
      <ProjectDetailModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </>
  );
}