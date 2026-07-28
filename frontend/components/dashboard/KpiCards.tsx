import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import StorageIcon from '@mui/icons-material/Storage';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

interface DashboardKpiCardsProps {
  totalExpenditure?: number;
  expData?: number[];          // เพิ่มรับข้อมูลกราฟค่าใช้จ่าย
  totalSavings?: number;
  savData?: number[];          // เพิ่มรับข้อมูลกราฟเงินที่ประหยัด
  usedAllocation?: number;
  allocData?: number[];        // เพิ่มรับข้อมูลกราฟการใช้งาน
}

export default function DashboardKpiCards({ 
  totalExpenditure = 0, 
  expData = [0,0,0,0,0,0,0],
  totalSavings = 0, 
  savData = [0,0,0,0,0,0,0],
  usedAllocation = 0,
  allocData = [0,0,0,0,0,0,0]
}: DashboardKpiCardsProps) {
  
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Card 1: Total Expenditure */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
            <Box>
              <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <AccountBalanceWalletIcon sx={{ color: '#4caf50', fontSize: 16 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                ${(totalExpenditure ?? 0).toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                <ArrowUpwardIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  25% increase in total cost
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: 120, height: 70 }}>
              {/* ใช้ข้อมูลจริงที่ส่งผ่าน props */}
              <SparkLineChart data={expData} curve="natural" colors={['#4caf50']} area showHighlight={true} showTooltip={true} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 2: Total Savings */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
            <Box>
              <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#fff8e1', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <SavingsIcon sx={{ color: '#ffb300', fontSize: 16 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                ${(totalSavings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                <ArrowDownwardIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  15% decrease in total savings
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: 120, height: 70 }}>
              <SparkLineChart data={savData} curve="natural" colors={['#ffb300']} area showHighlight={true} showTooltip={true} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 3: Used Allocation */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
            <Box>
              <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <StorageIcon sx={{ color: '#2196f3', fontSize: 16 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {(usedAllocation ?? 0)}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                <ArrowUpwardIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  12% increase in allocation
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: 120, height: 70 }}>
              <SparkLineChart data={allocData} curve="natural" colors={['#2196f3']} area showHighlight={true} showTooltip={true} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}