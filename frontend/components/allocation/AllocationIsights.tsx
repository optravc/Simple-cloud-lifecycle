'use client';

import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface AllocationIsightsProps {
  selectedDept: string;
  complianceRate: number;
  taggedCount: number;
  untaggedCount: number;
  averageMomChange: number;
}

export default function AllocationIsights({
  selectedDept,
  complianceRate,
  taggedCount,
  untaggedCount,
  averageMomChange,
}: AllocationIsightsProps) {
  const isPositive = averageMomChange >= 0;
  const momTrendLabel = isPositive ? 'ค่าใช้จ่ายเฉลี่ยขยับขึ้นจากเดือนก่อน' : 'ค่าใช้จ่ายเฉลี่ยลดลงจากเดือนก่อน';

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #919eab3d', 
        borderRadius: 4, 
        boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)', // แก้ไขเอาคำว่า yczny ออก
        height: '100%', 
        bgcolor: '#ffffff',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: '24px !important', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        
        {/* ส่วนหัวของการ์ด */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1rem', mb: 0.5 }}>
            Allocation Insights & Governance
          </Typography>
          <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.85rem' }}>
            สถานะการติด Tag และกฎการปันส่วนงบประมาณ
          </Typography>
        </Box>
        
        {/* รายละเอียดเนื้อหา 3 ส่วนแบบ Clean Layout */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, my: 'auto' }}>
          
          {/* Item 1: Selected Scope */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#00B8D914', color: '#00B8D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LightbulbOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.9rem' }}>
                Selected Scope: {selectedDept}
              </Typography>
              <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.825rem', mt: 0.2 }}>
                {selectedDept === 'All' 
                  ? 'กำลังแสดงภาพรวมทุก Cost Center สามารถเลือกเจาะจงรายแผนกเพื่อดูรายละเอียดเชิงลึก' 
                  : `กำลังแสดงข้อมูลเฉพาะแผนก ${selectedDept} พร้อมการตรวจสอบ Tag Compliance`}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', borderColor: '#919eab3d' }} />

          {/* Item 2: Tag Compliance Rate */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#00AB5514', color: '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VerifiedOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.9rem' }}>
                Tag Compliance Rate: {complianceRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.825rem', mt: 0.2 }}>
                ทรัพยากรที่ติดแท็กครบถ้วน {taggedCount} รายการ และยังมี untagged cost {untaggedCount} รายการที่ควรจัดการ
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', borderColor: '#919eab3d' }} />

          {/* Item 3: Average MoM Change */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: isPositive ? '#FF563014' : '#00AB5514', color: isPositive ? '#FF5630' : '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.9rem' }}>
                Average MoM Change: {isPositive ? '+' : ''}{averageMomChange.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.825rem', mt: 0.2 }}>
                {momTrendLabel}
              </Typography>
            </Box>
          </Box>

        </Box>

      </CardContent>
    </Card>
  );
}