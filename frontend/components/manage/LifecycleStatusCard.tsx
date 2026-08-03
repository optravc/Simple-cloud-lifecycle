import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface LifecycleStatusCardProps {
  deleteCount: number;
}

export default function LifecycleStatusCard({ deleteCount }: LifecycleStatusCardProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #bbdefb', bgcolor: '#e3f2fd', borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "text.primary" }} gutterBottom>
          Automated Lifecycle Status
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          {deleteCount} Servers Flagged
        </Typography>
        <Typography color="text.secondary" variant="body2">
          กำลังรอให้ทีมผู้ดูแลตรวจสอบรายละเอียด และกดยืนยันการเคลียร์ลบข้อมูลบนโปรเจกต์ Sandbox
        </Typography>
      </CardContent>
    </Card>
  );
}