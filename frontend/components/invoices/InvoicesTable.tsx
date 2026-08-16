import { useState } from 'react';
import { 
  Card, CardContent, Typography, Box, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, Avatar, Button, InputAdornment, FormControl, InputLabel, Select, MenuItem, TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { printInvoicePDF } from '@/lib/invoiceExporter';
import { getCurrencySymbol } from '@/lib/invoiceService';
import { InvoicesTableProps } from '@/types/invoice';
import { S3_BASE_URL } from '@/lib/api';

function formatDueDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 3) return dateStr;
  
  let day = parts[0];
  if (day.length === 1) {
    day = '0' + day;
  }
  
  const month = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
  const year = parts[2];
  
  return `${day} ${month} ${year}`;
}

export default function InvoicesTable({ 
  invoices = [], 
  searchTerm, 
  setSearchTerm,
  selectedProvider,
  setSelectedProvider,
  selectedStatus,
  setSelectedStatus,
  onSelectInvoice
}: Readonly<InvoicesTableProps>) {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedInvoices = (invoices || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getProviderIconUrl = (provider: string) => {
    const s3BaseUrl = `${S3_BASE_URL}providers/icons/`;
    // Normalize to lowercase for matching (invoice data uses mixed case)
    const p = provider.toLowerCase().replace(/\s+/g, '');
    switch (p) {
      case 'aws':          return `${s3BaseUrl}aws.png`;
      case 'azure':        return `${s3BaseUrl}azure.png`;
      case 'gcp':          return `${s3BaseUrl}gcp.jpg`;
      case 'alibababcloud':
      case 'alibabacloud': return `${s3BaseUrl}alibaba-cloud.png`;
      case 'ibmcloud':     return `${s3BaseUrl}IBMCloud.png`;
      case 'oracle':       return `${s3BaseUrl}oraclecloud.png`;
      case 'salesforce':   return `${s3BaseUrl}salesforce.png`;
      default:             return `${s3BaseUrl}default-logo.png`;
    }
  };

  const getProviderBadgeStyle = (provider: string) => {
    const p = provider.toLowerCase().replace(/\s+/g, '');
    switch (p) {
      case 'aws':          return { bgcolor: '#FF990022', color: '#FF9900' };
      case 'azure':        return { bgcolor: '#0089D622', color: '#0089D6' };
      case 'gcp':          return { bgcolor: '#4285F422', color: '#4285F4' };
      case 'salesforce':   return { bgcolor: '#00A1E022', color: '#00A1E0' };
      case 'ibmcloud':     return { bgcolor: '#1F70C122', color: '#1F70C1' };
      case 'oracle':       return { bgcolor: '#F8000022', color: '#F80000' };
      case 'alibabacloud':
      case 'alibababcloud': return { bgcolor: '#FF6A0022', color: '#FF6A00' };
      default:             return { bgcolor: '#71809622', color: '#718096' };
    }
  };

  const getStatusChipColor = (status: string): "success" | "warning" | "error" => {
    if (status === 'Paid') return 'success';
    if (status === 'Pending') return 'warning';
    return 'error';
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 4, bgcolor: '#ffffff' }}>
      <CardContent sx={{ p: '16px !important' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a202c', mb: 1.5, fontSize: '0.95rem' }}>
          Invoice History
        </Typography>
        
        {/* Table Filters */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search ID or provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 220, '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem' } }}
          />

          <FormControl size="small" sx={{ minWidth: 140, '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem' } }}>
            <InputLabel id="provider-select-label">Provider</InputLabel>
            <Select
              labelId="provider-select-label"
              value={selectedProvider}
              label="Provider"
              onChange={(e) => setSelectedProvider(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="All">All Providers</MenuItem>
              <MenuItem value="AWS">AWS</MenuItem>
              <MenuItem value="Azure">Azure</MenuItem>
              <MenuItem value="GCP">GCP</MenuItem>
              <MenuItem value="Salesforce">Salesforce</MenuItem>
              <MenuItem value="IBM Cloud">IBM Cloud</MenuItem>
              <MenuItem value="Oracle">Oracle</MenuItem>
              <MenuItem value="Alibaba Cloud">Alibaba Cloud</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130, '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem' } }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Invoice ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Billing Period</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((row) => (
                  <TableRow 
                    key={row.id} 
                    hover 
                    onClick={() => onSelectInvoice(row)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f7fafc' } }}
                  >
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '0.78rem', py: 1 }}>{row.id}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2d3748', py: 1 }}>
                      <Chip 
                        avatar={<Avatar alt={row.provider} src={getProviderIconUrl(row.provider)} />}
                        label={row.provider} 
                        size="small" 
                        sx={{ 
                          fontWeight: 'bold',
                          ...getProviderBadgeStyle(row.provider),
                          border: 'none',
                          height: 20,
                          fontSize: '0.68rem',
                          '& .MuiChip-avatar': {
                            bgcolor: 'transparent',
                            width: 16,
                            height: 16,
                            ml: 0.5
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem', py: 1 }}>{row.billingPeriod}</TableCell>
                    <TableCell sx={{ color: '#4a5568', fontSize: '0.78rem', py: 1 }}>{formatDueDate(row.dueDate)}</TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={row.status} 
                        size="small" 
                        color={getStatusChipColor(row.status)} 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold', height: 20, fontSize: '0.68rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2d3748', fontSize: '0.78rem', py: 1 }} align="right">
                      {getCurrencySymbol(row.currency)}{row.amount.toLocaleString()}
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          startIcon={<AnalyticsIcon sx={{ fontSize: 14 }} />} 
                          sx={{ textTransform: 'none', borderRadius: 1.5, height: 26, fontSize: '0.7rem' }}
                          onClick={() => onSelectInvoice(row)}
                        >
                          FinOps
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} 
                          sx={{ textTransform: 'none', borderRadius: 1.5, height: 26, fontSize: '0.7rem' }}
                          onClick={() => printInvoicePDF(row)}
                        >
                          PDF
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No invoice data found matching the selected conditions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={invoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            '.MuiTablePagination-toolbar': { minHeight: 36 },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
          }}
        />
      </CardContent>
    </Card>
  );
}