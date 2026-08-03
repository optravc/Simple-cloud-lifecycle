import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

interface DashboardKpiCardsProps {
  totalExpenditure?: number;
  expData?: number[];          
  totalSavings?: number;
  savData?: number[];          
  usedAllocation?: number | string;
  allocData?: number[];        
}

export default function DashboardKpiCards({ 
  totalExpenditure = 0, 
  expData = [0, 0, 0, 0, 0, 0, 0],
  totalSavings = 0, 
  savData = [0, 0, 0, 0, 0, 0, 0],
  usedAllocation = 0,
  allocData = [0, 0, 0, 0, 0, 0, 0]
}: DashboardKpiCardsProps) {
  
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>

      {/* Card 1: Total Expenditure (สีเขียว) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 4,
            border: '1px solid #919eab3d',
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: '24px !important' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.9rem' }}>
                Total Expenditure
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.8rem' }}>
                ${(totalExpenditure ?? 0).toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#00AB5514', color: '#00AB55', borderRadius: '50%', width: 22, height: 22 }}>
                  <TrendingUpIcon sx={{ fontSize: 14 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.85rem' }}>
                  25%
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.85rem' }}>
                  last week
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: 120, height: 60 }}>
              <SparkLineChart
                data={expData}
                curve="natural"
                color="#00AB55" // สีเส้นกราฟ
                area={true}  
                showHighlight={true}
                showTooltip={true}
                sx={{
                  '& .MuiArea-root': { fill: '#00AB55', fillOpacity: 0.12 }, // สีพื้นที่ใต้กราฟแบบจางๆ
                  '& .MuiLine-root': { strokeWidth: 3 },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 2: Total Savings (สีเหลือง/ส้ม) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 4,
            border: '1px solid #919eab3d',
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: '24px !important' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.9rem' }}>
                Total Savings
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.8rem' }}>
                ${(totalSavings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#FFAB0014', color: '#FFAB00', borderRadius: '50%', width: 22, height: 22 }}>
                  <TrendingDownIcon sx={{ fontSize: 14 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.85rem' }}>
                  15%
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.85rem' }}>
                  last week
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: 120, height: 60 }}>
              <SparkLineChart
                data={savData}
                curve="natural"
                color="#FFAB00" // สีเส้นกราฟ
                area={true}  
                showHighlight={true}
                showTooltip={true}
                sx={{
                  '& .MuiArea-root': { fill: '#FFAB00', fillOpacity: 0.12 }, // สีพื้นที่ใต้กราฟแบบจางๆ
                  '& .MuiLine-root': { strokeWidth: 3 },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 3: Used Allocation (สีฟ้า) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 4,
            border: '1px solid #919eab3d',
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: '24px !important' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#637381', fontWeight: 600, fontSize: '0.9rem' }}>
                Used Allocation
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.8rem' }}>
                {usedAllocation}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#00B8D914', color: '#00B8D9', borderRadius: '50%', width: 22, height: 22 }}>
                  <TrendingUpIcon sx={{ fontSize: 14 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.85rem' }}>
                  12%
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.85rem' }}>
                  last week
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: 120, height: 60 }}>
              <SparkLineChart
                data={allocData}
                curve="natural"
                color="#00B8D9" 
                area={true}
                showHighlight={true}
                showTooltip={true}
                sx={{
                  '& .MuiArea-root': { fill: '#00B8D9', fillOpacity: 0.22 }, 
                  '& .MuiLine-root': { strokeWidth: 3},
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  );
}