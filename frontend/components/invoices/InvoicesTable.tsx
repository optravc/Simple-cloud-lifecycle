'use client';

import React from 'react';
import { 
  Card, CardContent, Typography, Box, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, InputAdornment 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

interface InvoiceItem {
  id: string;
  provider: string;
  billingPeriod: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

interface InvoicesTableProps {
  invoices: InvoiceItem[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function InvoicesTable({ invoices, searchTerm, setSearchTerm }: InvoicesTableProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Invoice History</Typography>
          <TextField 
            size="small" 
            placeholder="Search invoice or provider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cloud Provider</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Billing Period</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a202c' }}>{row.provider}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{row.billingPeriod}</TableCell>
                  <TableCell>{row.dueDate}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status} 
                      size="small" 
                      color={row.status === 'Paid' ? 'success' : row.status === 'Pending' ? 'warning' : 'error'} 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">${row.amount.toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<DownloadIcon />} sx={{ textTransform: 'none' }}>
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}