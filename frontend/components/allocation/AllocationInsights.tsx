import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { AllocationInsightsProps } from '@/types/allocation';

export default function AllocationInsights({
  complianceRate,
  taggedCount,
  untaggedCount,
  averageMomChange,
}: Readonly<AllocationInsightsProps>) {
  const isPositive = averageMomChange >= 0;

  return (
    <Grid container spacing={2} sx={{ mb: 2.5 }}>
      {/* Metric Card 1: Tag Compliance Rate */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card 
          elevation={0} 
          sx={{ 
            border: '1px solid #919eab3d', 
            borderRadius: 4, 
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff'
          }}
        >
          <CardContent sx={{ p: '18px 20px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#00AB5514', color: '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VerifiedOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.85rem' }}>
                  Tag Compliance Rate
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.78rem' }}>
                  {taggedCount} of {taggedCount + untaggedCount} projects tagged
                </Typography>
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#00AB55', fontSize: '1.4rem' }}>
              {complianceRate.toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Metric Card 2: Untagged Resource Alerts */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card 
          elevation={0} 
          sx={{ 
            border: '1px solid #919eab3d', 
            borderRadius: 4, 
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff'
          }}
        >
          <CardContent sx={{ p: '18px 20px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: untaggedCount > 0 ? '#FFAB0014' : '#00AB5514', color: untaggedCount > 0 ? '#FFAB00' : '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WarningAmberIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.85rem' }}>
                  Untagged Resource Costs
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.78rem' }}>
                  {untaggedCount > 0 ? 'Requires tag governance review' : 'All resources tagged'}
                </Typography>
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: untaggedCount > 0 ? '#FFAB00' : '#00AB55', fontSize: '1.3rem' }}>
              {untaggedCount} {untaggedCount === 1 ? 'Project' : 'Projects'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Metric Card 3: Average MoM Cost Change */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card 
          elevation={0} 
          sx={{ 
            border: '1px solid #919eab3d', 
            borderRadius: 4, 
            boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
            bgcolor: '#ffffff'
          }}
        >
          <CardContent sx={{ p: '18px 20px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: isPositive ? '#FF563014' : '#00AB5514', color: isPositive ? '#FF5630' : '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.85rem' }}>
                  Average MoM Cost Variance
                </Typography>
                <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.78rem' }}>
                  {isPositive ? 'Increased spend vs last month' : 'Savings vs last month'}
                </Typography>
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: isPositive ? '#FF5630' : '#00AB55', fontSize: '1.4rem' }}>
              {(isPositive ? '+' : '') + averageMomChange.toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
