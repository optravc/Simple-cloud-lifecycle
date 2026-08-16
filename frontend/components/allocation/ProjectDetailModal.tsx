'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Divider, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress 
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getProjectBreakdown } from '@/lib/api';
import { ProjectDetailModalProps, ServiceCost } from '@/types/allocation';

export default function ProjectDetailModal({ 
  project, 
  onClose 
}: Readonly<ProjectDetailModalProps>) {
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceCost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </TableCell>
        </TableRow>
      );
    }

    if (serviceBreakdown.length > 0) {
      return serviceBreakdown.map((svc) => (
        <TableRow key={svc.serviceName}>
          <TableCell sx={{ fontWeight: 'medium' }}>{svc.serviceName}</TableCell>
          <TableCell sx={{ color: 'text.secondary' }}>{svc.usageType}</TableCell>
          <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>${svc.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
        </TableRow>
      ));
    }

    return (
      <TableRow>
        <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
          No service breakdown data found.
        </TableCell>
      </TableRow>
    );
  };

  // Fetch actual data from Backend when Modal opens or Project ID changes
  useEffect(() => {
    if (!project) return;

    const fetchProjectBreakdown = async () => {
      try {
        setLoading(true);
        const data = await getProjectBreakdown(project.id);
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
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Project Details: {project.projectName}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Project ID: {project.id} | Department: {project.department}</Typography>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
        {/* Basic Overview Data */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Owner</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{project.owner}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Provider</Typography>
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

        {/* Amount and Growth Rate */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Current Spend:</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>${project.spend.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>MoM Change:</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: project.momChange >= 0 ? '#d32f2f' : '#2e7d32' }}>
              {project.momChange >= 0 ? `+${project.momChange}%` : `${project.momChange}%`}
            </Typography>
          </Box>
        </Box>

        {/* Service breakdown table (fetches from actual API) */}
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
                {renderTableBody()}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* FinOps Recommendation */}
        {!project.isTagged && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fff4e5', borderRadius: 2, border: '1px solid #ffe0b2' }}>
            <WarningAmberIcon color="warning" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#663c00' }}>Governance Warning</Typography>
              <Typography variant="body2" sx={{ color: '#663c00' }}>This project has not been tagged with the mandatory tags yet. Please contact {project.owner} to update the tag correctly in accordance with corporate policy.</Typography>
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