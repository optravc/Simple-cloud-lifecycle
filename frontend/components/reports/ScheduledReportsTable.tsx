'use client';

import React from 'react';
import { Card, Typography, Box, Chip } from '@mui/material';

interface ReportItem {
  id: string;
  name: string;
  frequency: string;
  recipients: string;
  status: string;
}

interface ScheduledReportsTableProps {
  reports: ReportItem[];
}

export default function ScheduledReportsTable({ reports }: ScheduledReportsTableProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Automated Report Subscriptions</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {reports.map((rep) => (
          <Box key={rep.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #eee' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a202c' }}>{rep.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Frequency: {rep.frequency} | Recipients: {rep.recipients}</Typography>
            </Box>
            <Chip 
              label={rep.status} 
              size="small" 
              color={rep.status === 'Active' ? 'success' : 'default'} 
              variant="outlined" 
            />
          </Box>
        ))}
      </Box>
    </Card>
  );
}