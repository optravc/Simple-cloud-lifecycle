'use client';

import { Alert, AlertTitle, Typography, Box, Chip, Button } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import { useRouter } from 'next/navigation';
import { CostAnomalyBannerProps } from '@/types/budget';

const formatServiceName = (rawService: string): string => {
  if (!rawService) return 'Cloud Service';
  if (rawService.includes('Relational Database Service')) return 'Database (RDS)';
  if (rawService.includes('Elastic Compute Cloud')) return 'Compute (EC2)';
  if (rawService.includes('Simple Storage Service')) return 'Storage (S3)';
  if (rawService.includes('Container Service') || rawService.includes('Kubernetes')) return 'Containers (ECS/EKS)';
  return rawService;
};

export default function CostAnomalyBanner({ 
  data, 
  loading, 
  userRole 
}:Readonly<CostAnomalyBannerProps>) {
  const router = useRouter();

  if (loading || !data) return null;

  const isTechnicalUser = userRole === 'lead' || userRole === 'dev';

  // For Finance/Admin, filter out tiny micro-anomalies (< $1.00)
  // For Dev/Tech Lead, show all anomalies for technical visibility
  const anomaliesToDisplay = (data.anomalies || []).filter((item) =>
    isTechnicalUser ? true : (item.impact_total || 0) >= 1.0
  );

  const hasAnomalies = data.status === 'ACTIVE' && anomaliesToDisplay.length > 0;

  if (hasAnomalies) {
    if (isTechnicalUser) {
      // Tech Lead & Developer View: Show precise AWS Technical details + Direct Action Link
      return (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'warning.light' }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <AlertTitle sx={{ fontWeight: 700 }}>
                Tech Alert: AWS Resource Spike Detected ({anomaliesToDisplay.length} Incident)
              </AlertTitle>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                CloudWatch ML detected high usage spike. Total impact: <strong>+${(data.total_impact_usd || 0).toFixed(2)}</strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {anomaliesToDisplay.map((item, idx) => (
                  <Chip
                    key={item.anomaly_id || idx}
                    size="small"
                    color="warning"
                    label={`${item.root_cause_service || 'AWS Service'} (${item.root_cause_region || 'us-east-1'}): +$${(item.impact_total || 0).toFixed(2)}`}
                    sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                  />
                ))}
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="warning"
              size="small"
              endIcon={<LaunchIcon fontSize="small" />}
              onClick={() => router.push('/performance')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Inspect Metrics
            </Button>
          </Box>
        </Alert>
      );
    }

    // Finance & Executive View: High-level business summary
    return (
      <Alert
        severity="warning"
        icon={<WarningAmberIcon fontSize="inherit" />}
        sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'warning.light' }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>
          Unusual Spend Alert — {anomaliesToDisplay.length} Cost Spike(s) Detected
        </AlertTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
          <Typography variant="body2">
            Automated monitoring detected unusual spending activity totaling{' '}
            <strong>${(data.total_impact_usd || 0).toFixed(2)}</strong> over the last 30 days.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {anomaliesToDisplay.map((item, idx) => (
              <Chip
                key={item.anomaly_id || idx}
                size="small"
                color="warning"
                label={`${formatServiceName(item.root_cause_service)}: +$${(item.impact_total || 0).toFixed(2)}`}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>
        </Box>
      </Alert>
    );
  }

  return (
    <Alert
      severity="success"
      icon={<CheckCircleOutlinedIcon fontSize="inherit" />}
      sx={{ mb: 3, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}
    >
      <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600 }}>
        {isTechnicalUser
          ? 'Cloud Health Status: All AWS Services running optimal. No resource usage spikes detected.'
          : 'Cost Monitoring Status: Normal spending pattern detected across all cloud services.'}
      </Typography>
    </Alert>
  );
}
