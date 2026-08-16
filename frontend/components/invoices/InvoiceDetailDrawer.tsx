import { useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Chip, Grid, Divider,
  LinearProgress, Stack, Button, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { PieChart, Pie, ResponsiveContainer, Legend } from 'recharts';
import { exportInvoiceCURtoCSV } from '@/lib/invoiceExporter';
import { getCurrencySymbol, getFinOpsDetails } from '@/lib/invoiceService';
import { InvoiceDetailDrawerProps } from '@/types/invoice';
import ActionStatusModal from '@/components/common/ActionStatusModal';


const PIE_COLORS = ['#2065D1', '#826af9', '#FFAB00', '#FF4842', '#1890FF'];

const DEPARTMENT_COLORS: Record<string, string> = {
  'Core Infrastructure': '#2065D1',
  'Product Engineering': '#826af9',
  'Data Science & Analytics': '#00B8D9',
  'Trust & Safety': '#FFAB00',
  'Finance': '#FF4842',
  'Executive / C-Level': '#36B37E',
  'FinOps & Cloud Governance': '#7460EE',
};

const getPieColor = (name: string, index: number): string => {
  return DEPARTMENT_COLORS[name] || PIE_COLORS[index % PIE_COLORS.length];
};

export default function InvoiceDetailDrawer({
  open,
  onClose,
  invoice
}: Readonly<InvoiceDetailDrawerProps>) {

  const [modalState, setModalState] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const getPaymentStatusColor = (status: string): "success" | "warning" | "error" => {
    if (status === 'Paid') return 'success';
    if (status === 'Pending') return 'warning';
    return 'error';
  };

  const getTaggingComplianceColor = (compliance: number): "success" | "warning" | "error" => {
    if (compliance >= 90) return 'success';
    if (compliance >= 80) return 'warning';
    return 'error';
  };

  const getTaggingComplianceHexColor = (compliance: number): string => {
    if (compliance >= 90) return '#2e7d32';
    if (compliance >= 80) return '#ed6c02';
    return '#d32f2f';
  };

  if (!invoice) return null;

  const curSymbol = getCurrencySymbol(invoice.currency);

  const details = getFinOpsDetails(invoice.id, invoice.financials.subTotal, invoice.amount);

  const departmentsData = (invoice.departmentAllocations?.length > 0
    ? invoice.departmentAllocations.map((a, index) => ({ name: a.departmentName, value: a.allocatedAmount, fill: getPieColor(a.departmentName, index) }))
    : details.departments.map((d, index) => ({ name: d.name, value: d.value, fill: getPieColor(d.name, index) })));

  const servicesData = invoice.lineItems?.length > 0
    ? invoice.lineItems.map(l => ({ name: l.serviceName, value: l.grandTotal }))
    : details.services;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          style: { backgroundColor: 'rgba(0,0,0,0.1)' }
        },
        paper: {
          sx: { width: { xs: '100%', md: 620 }, p: 0, boxShadow: '-12px 0 24px rgba(0,0,0,0.15)' }
        }
      }}
    >
      {/* Drawer Header */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0A1638', color: 'white' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              FinOps Invoice Analysis
            </Typography>
            <Chip
              label={invoice.id}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 'bold' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {invoice.provider} • Billing Period: {invoice.billingPeriod}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Drawer Scrollable Body */}
      <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>

        {/* Cost Summary & Status */}
        <Box sx={{ mb: 4, p: 3, bgcolor: '#f4f6f8', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Invoice Amount (Cash)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                {curSymbol}{invoice.amount.toLocaleString()}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Amortized Cost</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1890FF' }}>
                {curSymbol}{details.amortizedCost.toLocaleString()}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  Payment Status:
                  <Chip
                    label={invoice.status}
                    size="small"
                    color={getPaymentStatusColor(invoice.status)}
                    sx={{ fontWeight: 'bold', ml: 1 }}
                  />
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Due Date: {invoice.dueDate}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Anomaly Alerts */}
        {details.anomalyDetails && (
          <Alert
            severity="warning"
            icon={<ReportProblemIcon fontSize="inherit" />}
            sx={{ mb: 4, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: 1.5 }}>
                Dispute
              </Button>
            }
          >
            {details.anomalyDetails}
          </Alert>
        )}

        {/* Department Cost Allocation */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1a202c' }}>
            Cost Allocation by Department
          </Typography>
          <Box sx={{ height: 200, mb: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                />
                <Legend {...({ layout: "vertical", align: "right", verticalAlign: "middle", iconType: "circle" } as Record<string, string>)} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Service Cost Breakdown */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1a202c' }}>
            Service Cost Breakdown
          </Typography>
          <Stack spacing={2}>
            {servicesData.map((service, index) => {
              const percentage = (service.value / invoice.financials.subTotal) * 100;
              return (
                <Box key={service.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {service.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                      {curSymbol}{service.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({percentage.toFixed(0)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: PIE_COLORS[index % PIE_COLORS.length],
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Tagging Compliance */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
              Tagging Compliance (Cost Attribution)
            </Typography>
            <Chip
              label={`${details.taggingCompliance}% Compliant`}
              color={getTaggingComplianceColor(details.taggingCompliance)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            FinOps Requires 100% cost allocation. You have <b style={{ color: '#d32f2f' }}>{curSymbol}{details.untaggedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b> in resources untagged or missing owner tags in this invoice period.
          </Typography>
          <LinearProgress
            variant="determinate"
            value={details.taggingCompliance}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                bgcolor: getTaggingComplianceHexColor(details.taggingCompliance),
                borderRadius: 5
              }
            }}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* FinOps Cost Optimization Opportunities */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1a202c' }}>
            Optimization Recommendations for this Period
          </Typography>
          <Stack spacing={2}>
            {details.recommendations.map((rec) => (
              <Box
                key={rec.title}
                sx={{
                  p: 2.5,
                  border: '1px dashed #2065D1',
                  borderRadius: 3,
                  bgcolor: 'rgba(32, 101, 209, 0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ flexGrow: 1, mr: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a202c', mb: 0.5 }}>
                    {rec.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Potential Savings: +{curSymbol}{rec.saving.toLocaleString()}/month
                  </Typography>
                  {/* FinOps Financial Metrics Badges */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {rec.roiPercent && (
                      <Chip
                        label={`ROI: +${rec.roiPercent}%`}
                        size="small"
                        sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                    {rec.paybackMonths && (
                      <Chip
                        label={`Payback: ${rec.paybackMonths} mo`}
                        size="small"
                        sx={{ bgcolor: '#EDE7F6', color: '#512DA8', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                    {rec.annualizedSavings && (
                      <Chip
                        label={`Annualized: +${curSymbol}${rec.annualizedSavings.toLocaleString()}/yr`}
                        size="small"
                        sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                    {rec.npvUSD && (
                      <Chip
                        label={`NPV: +${curSymbol}${rec.npvUSD.toLocaleString()}`}
                        size="small"
                        sx={{ bgcolor: '#FFF8E1', color: '#F57F17', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                  onClick={() => setModalState({
                    open: true,
                    type: 'success',
                    title: 'Recommendation Triggered',
                    message: `Action triggered successfully: ${rec.action}`,
                  })}
                >
                  {rec.action}
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>

      </Box>

      {/* Drawer Action Bar */}
      <Box sx={{ p: 3, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 2, bgcolor: '#fafafa' }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<FileDownloadIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', py: 1.2 }}
          onClick={() => exportInvoiceCURtoCSV(invoice)}
        >
          Download CUR CSV
        </Button>
        <Button
          variant="contained"
          color="success"
          fullWidth
          startIcon={<AssignmentTurnedInIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', py: 1.2 }}
          onClick={() => {
            setModalState({
              open: true,
              type: 'success',
              title: 'Audit Verified',
              message: 'This invoice has been verified and logged in the system audit trail!',
            });
          }}
        >
          Audit Verified
        </Button>
      </Box>

      <ActionStatusModal
        open={modalState.open}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => {
          setModalState(prev => ({ ...prev, open: false }));
          if (modalState.title === 'Audit Verified') {
            onClose();
          }
        }}
      />
    </Drawer>
  );
}
