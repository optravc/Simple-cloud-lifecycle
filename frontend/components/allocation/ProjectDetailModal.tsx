'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Divider, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress 
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AllocationItem } from '@/types/cloud';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface ProjectDetailModalProps {
  project: AllocationItem | null;
  onClose: () => void;
}

interface ServiceCost {
  serviceName: string;
  usageType: string;
  cost: number;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceCost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // ดึงข้อมูลจริงจาก Backend เมื่อเปิด Modal หรือเปลี่ยน Project ID
  useEffect(() => {
    if (!project) return;

    const fetchProjectBreakdown = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`http://localhost:8000/api/project-breakdown?id=${project.id}`);
        if (!res.ok) throw new Error('Failed to fetch project breakdown');
        const data = await res.json();
        setServiceBreakdown(data || []);
      } catch (err) {
        console.error('Error fetching project breakdown:', err);
        setServiceBreakdown([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectBreakdown();
  }, [project]);

  if (!project) return null;

  return (
    <Dialog open={Boolean(project)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <BusinessIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{project.projectName}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Project ID: {project.id} | Department: {project.department}</Typography>
        </Box>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
        {/* ข้อมูลภาพรวมเบื้องต้น */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Owner</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{project.owner}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Cloud Provider</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{project.provider}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Allocation Model</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{project.allocationModel}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tag Status</Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip 
                label={project.isTagged ? 'Tagged' : 'Untagged'} 
                size="small" 
                color={project.isTagged ? 'success' : 'error'} 
                variant="outlined" 
              />
            </Box>
          </Box>
        </Box>

        {/* ยอดเงินและอัตราการเติบโต */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Current Month Spend:</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>${project.spend.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>MoM Variance Change:</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: project.momChange >= 0 ? '#d32f2f' : '#2e7d32' }}>
              {project.momChange >= 0 ? `+${project.momChange}%` : `${project.momChange}%`} from last month
            </Typography>
          </Box>
        </Box>

        {/* ส่วนตารางเจาะลึกรายบริการ (ดึงข้อมูลจาก API จริง) */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
            Resource & Service Cost Breakdown
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cloud Service</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Usage Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Estimated Spend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : serviceBreakdown.length > 0 ? (
                  serviceBreakdown.map((svc, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{svc.serviceName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{svc.usageType}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>${svc.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No service breakdown data found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ส่วนคำแนะนำการปรับปรุง (FinOps Recommendation) */}
        {!project.isTagged && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fff4e5', borderRadius: 2, border: '1px solid #ffe0b2' }}>
            <WarningAmberIcon color="warning" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#663c00' }}>Governance Warning</Typography>
              <Typography variant="body2" sx={{ color: '#663c00' }}>โปรเจกต์นี้ยังไม่ได้ติด Tag บังคับ กรุณาติดต่อ {project.owner} เพื่ออัปเดต Tag ให้ถูกต้องตามนโยบายองค์กร</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Close Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}