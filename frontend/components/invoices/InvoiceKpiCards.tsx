'use client';

import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

interface InvoiceKpiCardsProps {
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
}

export default function InvoiceKpiCards({ totalBilled, totalPaid, totalPending }: InvoiceKpiCardsProps) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ReceiptLongIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Total Billed Amount</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
              ${totalBilled.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>ยอดบิลรวมทุกคลาวด์ประจำเดือนนี้</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleIcon color="success" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Paid Invoices</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              ${totalPaid.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>ชำระเงินเรียบร้อยแล้ว</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HourglassEmptyIcon color="warning" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Pending & Overdue</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
              ${totalPending.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>ยอดรอชำระและเกินกำหนด</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}