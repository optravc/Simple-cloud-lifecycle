'use client';

import {
  Card, CardContent, Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, Paper, Chip, Button, TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { CostCentersGovernanceTableProps } from '@/types/budget';

const DEPARTMENT_COLORS: Record<string, string> = {
  'Core Infrastructure': '#2065D1',
  'Product Engineering': '#826af9',
  'Data Science & Analytics': '#FFAB00',
  'Trust & Safety': '#2ea043',
  'Finance': '#d32f2f',
  'Executive / C-Level': '#00bcd4',
  'FinOps & Cloud Governance': '#9c27b0',
};

const DEPARTMENT_SLACK_CHANNELS: Record<string, string> = {
  'Core Infrastructure': '#core-infrastructure',
  'Product Engineering': '#product-engineering',
  'Data Science & Analytics': '#data-science-analytics',
  'Trust & Safety': '#trust-safety',
  'Finance': '#finance',
  'Executive / C-Level': '#executive',
  'FinOps & Cloud Governance': '#finops',
};

export default function CostCentersGovernanceTable({
  departments,
  totalCount,
  filteredCount,
  page,
  rowsPerPage,
  userRole,
  onPageChange,
  onRowsPerPageChange,
  onOpenAdjustModal,
}: CostCentersGovernanceTableProps) {
  const canAdjust = userRole === 'admin' || userRole === 'finance' || userRole === 'finops';

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Critical':
        return (
          <Chip
            size="small"
            icon={<WarningIcon style={{ color: '#d32f2f', fontSize: '14px' }} />}
            label="Critical (Exceeded)"
            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 'bold', fontSize: '0.75rem', height: 24 }}
          />
        );
      case 'Warning':
        return (
          <Chip
            size="small"
            icon={<WarningAmberIcon style={{ color: '#ed6c02', fontSize: '14px' }} />}
            label="Warning (Near Limit)"
            sx={{ bgcolor: '#fff3e0', color: '#ed6c02', fontWeight: 'bold', fontSize: '0.75rem', height: 24 }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            icon={<CheckCircleIcon style={{ color: '#2e7d32', fontSize: '14px' }} />}
            label="OK (Within Limit)"
            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', fontSize: '0.75rem', height: 24 }}
          />
        );
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent sx={{ p: '16px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#1a202c' }}>
            Cost Centers Detailed Governance ({filteredCount})
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Showing {filteredCount} of {totalCount} cost centers
          </Typography>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4 }}>Department (Cost Center)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4 }}>Department Lead</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4, color: '#64748b' }}>Allocated Budget</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4, color: '#2065D1' }}>Spent MTD</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4, color: '#f97316' }}>Forecasted Spend</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4 }}>Alert Channel (Slack)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.86rem', py: 1.4 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((dept) => {
                const deptColor = DEPARTMENT_COLORS[dept.name] || '#1976d2';
                const slackChannel = DEPARTMENT_SLACK_CHANNELS[dept.name] || dept.slack;

                const getChannelChip = () => {
                  if (dept.status === 'Critical') {
                    return (
                      <Chip 
                        icon={<ReportProblemIcon style={{ color: '#d32f2f', fontSize: '15px' }} />}
                        label={slackChannel} 
                        size="small" 
                        sx={{ bgcolor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.75rem', height: 26 }} 
                      />
                    );
                  }
                  if (dept.status === 'Warning') {
                    return (
                      <Chip 
                        icon={<WarningAmberIcon style={{ color: '#ed6c02', fontSize: '15px' }} />}
                        label={slackChannel} 
                        size="small" 
                        sx={{ bgcolor: '#fff3e0', color: '#ed6c02', border: '1px solid #ffe0b2', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.75rem', height: 26 }} 
                      />
                    );
                  }
                  return (
                    <Chip 
                      icon={<NotificationsActiveIcon style={{ color: '#d97706', fontSize: '15px' }} />}
                      label={slackChannel} 
                      size="small" 
                      sx={{ bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem', height: 26 }} 
                    />
                  );
                };

                return (
                  <TableRow key={dept.id} hover>
                    <TableCell sx={{ py: 1.4 }}>
                      <Box sx={{ display: 'inline-block', px: 1.4, py: 0.5, borderRadius: 1.5, fontSize: '0.84rem', fontWeight: 'bold', bgcolor: `${deptColor}15`, color: deptColor }}>
                        {dept.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.88rem', py: 1.4 }}>{dept.owner || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.88rem', fontWeight: '600', color: '#64748b', py: 1.4 }}>
                      ${dept.allocated.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#2065D1', py: 1.4 }}>
                      ${dept.spent.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ color: '#f97316', fontWeight: 'bold', fontSize: '0.88rem', py: 1.4 }}>
                      ${Math.round(dept.forecasted).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 1.4 }}>
                      {getChannelChip()}
                    </TableCell>
                    <TableCell sx={{ py: 1.4 }}>{getStatusChip(dept.status)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.4 }}>
                      {canAdjust ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                          onClick={() => onOpenAdjustModal(dept.id)}
                          sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.78rem', height: 30, px: 1.5 }}
                        >
                          Adjust
                        </Button>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          Read Only
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={filteredCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={{
            '.MuiTablePagination-toolbar': { minHeight: 44 },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.8rem' },
          }}
        />
      </CardContent>
    </Card>
  );
}
