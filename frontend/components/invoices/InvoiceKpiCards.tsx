'use client';

import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SavingsIcon from '@mui/icons-material/Savings';
import { InvoiceKpiCardsProps } from '@/types/invoice';

export default function InvoiceKpiCards({ 
  totalBilled, 
  totalPaid, 
  totalPending,
  avgTaggingCompliance = 84.6,
  savingsPotential = 12850
}: Readonly<InvoiceKpiCardsProps>) {

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* 1. Total Billed */}
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ReceiptLongIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Billed Amount</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a202c', mb: 0.5 }}>
              ${totalBilled.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total billing of all clouds this month</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 2. Paid Invoices */}
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <CheckCircleIcon color="success" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Paid Invoices</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 0.5 }}>
              ${totalPaid.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Invoices paid successfully</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 3. Pending & Overdue */}
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <HourglassEmptyIcon color="warning" fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Pending & Overdue</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02', mb: 0.5 }}>
              ${totalPending.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Pending and overdue amount</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 4. Tagging Compliance (FinOps) */}
      <Grid size={{ xs: 12, sm: 6, md: 6, lg: 2.4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LocalOfferIcon sx={{ color: '#1890FF' }} fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Tagging Compliance</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1890FF', mb: 0.5 }}>
              {avgTaggingCompliance}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tagging compliance rate identifying owners</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 5. Savings Potential (FinOps) */}
      <Grid size={{ xs: 12, sm: 6, md: 6, lg: 2.4 }}>
        <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <SavingsIcon sx={{ color: '#54D62C' }} fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Savings Potential</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#54D62C', mb: 0.5 }}>
              ${savingsPotential.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>YTD total realized savings from FinOps optimization</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}