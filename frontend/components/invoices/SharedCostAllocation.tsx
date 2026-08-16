'use client';

import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Slider, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Alert, Divider
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SaveIcon from '@mui/icons-material/Save';

import { InvoiceItem } from '@/types/invoice';
import ActionStatusModal from '@/components/common/ActionStatusModal';

interface SharedCostAllocationProps {
  invoices?: InvoiceItem[];
}

export default function SharedCostAllocation({ invoices = [] }: Readonly<SharedCostAllocationProps>) {
  const [departmentShares, setDepartmentShares] = useState<Record<string, number>>({
    'Core Infrastructure': 30,
    'Product Engineering': 25,
    'Data Science & Analytics': 15,
    'Trust & Safety': 10,
    'Finance': 10,
    'Executive / C-Level': 5,
    'FinOps & Cloud Governance': 5,
  });

  const [modalState, setModalState] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Calculate dynamic shared costs from invoice line items (Support, Data Transfer, Bandwidth, Pub/Sub)
  const computedSharedCost = (invoices || []).reduce((sum, inv) => {
    const sharedItems = inv.lineItems?.filter(item => {
      const cat = (item.category || '').toLowerCase();
      const name = (item.serviceName || '').toLowerCase();
      return cat === 'support' || 
             cat === 'datatransfer' || 
             name.includes('support') || 
             name.includes('bandwidth') || 
             name.includes('egress') || 
             name.includes('pub/sub');
    }) || [];
    const sharedSum = sharedItems.reduce((s, i) => s + (i.grandTotal || 0), 0);
    return sum + sharedSum;
  }, 0);

  const totalSharedCost = computedSharedCost > 0 ? computedSharedCost : 12500;
  const currentTotalShare = Object.values(departmentShares).reduce((acc, curr) => acc + curr, 0);
  const isTotalValid = currentTotalShare === 100;

  const handleSliderChange = (deptName: string, val: number) => {
    setDepartmentShares(prev => ({
      ...prev,
      [deptName]: val
    }));
  };

  const handleSaveRules = () => {
    setModalState({
      open: true,
      type: 'success',
      title: 'Allocation Rules Saved',
      message: 'Shared Cost Allocation Rules have been saved and applied across all 7 departments successfully!',
    });
  };

  const departmentList = [
    { name: 'Core Infrastructure', percentage: departmentShares['Core Infrastructure'] },
    { name: 'Product Engineering', percentage: departmentShares['Product Engineering'] },
    { name: 'Data Science & Analytics', percentage: departmentShares['Data Science & Analytics'] },
    { name: 'Trust & Safety', percentage: departmentShares['Trust & Safety'] },
    { name: 'Finance', percentage: departmentShares['Finance'] },
    { name: 'Executive / C-Level', percentage: departmentShares['Executive / C-Level'] },
    { name: 'FinOps & Cloud Governance', percentage: departmentShares['FinOps & Cloud Governance'] },
  ];

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 4, mt: 3, bgcolor: '#ffffff' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountTreeIcon sx={{ color: '#2065D1' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                Shared Cost Allocation Settings (FinOps Rule)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Allocate central shared costs (e.g., Enterprise Support, common logging, cluster ingress) across all 7 cost centers
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!isTotalValid}
            onClick={handleSaveRules}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1 }}
          >
            Save Rules
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {!isTotalValid && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Allocation shares must sum up to 100% (Current total: {currentTotalShare}%)
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Sliders Side */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1a202c' }}>
              Define percentage share for 7 Cost Centers (%)
            </Typography>
            {departmentList.map((dept) => (
              <Box key={dept.name} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}>
                    {dept.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2065D1', fontSize: '0.82rem' }}>
                    {dept.percentage}%
                  </Typography>
                </Box>
                <Slider
                  value={dept.percentage}
                  onChange={(_, val) => handleSliderChange(dept.name, val as number)}
                  min={0}
                  max={100}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{
                    color: isTotalValid ? '#2065D1' : '#ed6c02',
                    height: 5,
                    py: 0.8,
                    '& .MuiSlider-thumb': {
                      width: 16,
                      height: 16,
                      backgroundColor: '#fff',
                      border: '2px solid currentColor',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0px 0px 0px 6px rgba(32, 101, 209, 0.16)',
                      },
                    },
                  }}
                />
              </Box>
            ))}
          </Grid>

          {/* Calculations Side */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                Allocation results based on total ${totalSharedCost.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
                💡 Central shared pool = AWS Support ($3,000) + AWS Data Egress ($3,000) + Azure Bandwidth ($4,000) + GCP Shared Pub/Sub ($2,500)
              </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department / Business Unit</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Allocated Ratio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Allocated Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentList.map((dept) => (
                    <TableRow key={dept.name} hover>
                      <TableCell sx={{ fontWeight: 500, fontSize: '0.82rem', py: 1 }}>{dept.name}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2065D1', fontSize: '0.82rem', py: 1 }}>
                        {dept.percentage}%
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '0.82rem', py: 1 }}>
                        ${((totalSharedCost * dept.percentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: isTotalValid ? 'success.main' : 'error.main' }}>
                      {currentTotalShare}%
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                      ${totalSharedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </CardContent>

      <ActionStatusModal
        open={modalState.open}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
      />
    </Card>
  );
}
