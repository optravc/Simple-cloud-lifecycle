import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import DnsIcon from '@mui/icons-material/Dns';
import SavingsIcon from '@mui/icons-material/Savings';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

interface ManageKpiCardsProps {
  activeCount: number;
  potentialSavings: number;
  flaggedCount: number;
}

export default function ManageKpiCards({ activeCount, potentialSavings, flaggedCount }: ManageKpiCardsProps) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>

      {/* Card 1: Active Resources */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <DnsIcon sx={{ color: '#2196f3', fontSize: 20 }} />
            </Box>
            <Typography color="text.secondary" gutterBottom variant="subtitle2">
              Active Cloud Resources
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {activeCount} <Typography component="span" variant="h6" color="text.secondary">เครื่อง</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              จำนวนทรัพยากรที่กำลังทำงานอยู่ในระบบ
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 2: Potential Savings */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <SavingsIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            </Box>
            <Typography color="text.secondary" gutterBottom variant="subtitle2">
              Potential Savings / Day
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
             ${(potentialSavings ?? 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ยอดเงินที่คาดว่าจะประหยัดได้หากเคลียร์เครื่อง Idle
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 3: Flagged / Swept Instances */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <DeleteSweepIcon sx={{ color: '#f44336', fontSize: 20 }} />
            </Box>
            <Typography color="text.secondary" gutterBottom variant="subtitle2">
              Swept Instances
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
              {flaggedCount} <Typography component="span" variant="h6" color="text.secondary">ตัว</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              จำนวนเครื่องที่ถูกดำเนินการลบออกจากระบบ
            </Typography>
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  );
}