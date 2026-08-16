'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box,
  CircularProgress, Alert, TextField, TablePagination, InputAdornment
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SearchIcon from '@mui/icons-material/Search';
import { ChargeItem } from '@/types/dashboard';
import { API_BASE } from '@/lib/api';

const COLOR_PRIMARY = '#212b36';
const COLOR_SECONDARY = '#637381';
const COLOR_SUCCESS = '#00AB55';
const COLOR_ERROR = '#FF5630';
const BG_PROJECTED = '#919eab14';

export default function ChargesTable() {
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  useEffect(() => {
    let cancelled = false;

    const fetchCharges = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/charges`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Session expired or not logged in (401)');
          }
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data: ChargeItem[] = await res.json();
        if (cancelled) return;

        setCharges(data || []);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("Error fetching charges:", err);
        const message = err instanceof Error ? err.message : 'Unable to load charges data';
        setError(message || 'Unable to load charges data. Check server status.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCharges();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCharges = charges.filter((item) =>
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCharges = filteredCharges.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
            <CircularProgress size={30} />
            <Typography variant="body2" sx={{ mt: 1, color: COLOR_SECONDARY }}>
              Loading data...
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    if (displayedCharges.length > 0) {
      return displayedCharges.map((row, index) => (
        <TableRow key={`${row.id}-${index}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          <TableCell sx={{ color: COLOR_PRIMARY, fontWeight: 500 }}>
            {row.id}
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.icon} alt={row.provider} style={{ width: 20, height: 20, objectFit: 'contain' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: COLOR_PRIMARY }}>{row.provider}</Typography>
            </Box>
          </TableCell>

          <TableCell sx={{ color: COLOR_SECONDARY, fontSize: '0.85rem' }}>{row.usage}</TableCell>
          <TableCell sx={{ color: COLOR_SECONDARY, fontSize: '0.85rem' }}>{row.interval}</TableCell>

          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: COLOR_PRIMARY }}>{row.amount}</Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: row.isUp ? COLOR_SUCCESS : COLOR_ERROR
              }}>
                {row.isUp ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                {row.percent}%
              </Box>
            </Box>
          </TableCell>

          <TableCell>
            <Box
              sx={{
                display: 'inline-block',
                bgcolor: BG_PROJECTED,
                color: COLOR_PRIMARY,
                fontWeight: 700,
                fontSize: '0.85rem',
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5
              }}
            >
              {row.projected}
            </Box>
          </TableCell>
        </TableRow>
      ));
    }

    return (
      <TableRow>
        <TableCell colSpan={6} align="center" sx={{ py: 3, color: COLOR_SECONDARY }}>
          No billing history found
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #919eab3d', borderRadius: 4, boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)', bgcolor: '#ffffff' }}>
      <CardContent sx={{ p: '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLOR_PRIMARY }}>
            Recent Charges
          </Typography>

          <TextField
            size="small"
            placeholder="Search ID or Provider..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 250 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: COLOR_PRIMARY, fontWeight: 'bold', fontSize: '0.78rem', py: 1 }}>Invoice ID</TableCell>
                <TableCell sx={{ color: COLOR_PRIMARY, fontWeight: 'bold', fontSize: '0.78rem', py: 1 }}>Provider</TableCell>
                <TableCell sx={{ color: COLOR_PRIMARY, fontWeight: 'bold', fontSize: '0.78rem', py: 1 }}>Usage</TableCell>
                <TableCell sx={{ color: COLOR_PRIMARY, fontWeight: 'bold', fontSize: '0.78rem', py: 1 }}>Interval</TableCell>
                <TableCell sx={{ color: COLOR_PRIMARY, fontWeight: 'bold', fontSize: '0.78rem', py: 1 }}>Amount</TableCell>
                <TableCell sx={{ color: COLOR_PRIMARY, fontWeight: 'bold', fontSize: '0.78rem', py: 1 }}>Projected cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTableBody()}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredCharges.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          sx={{
            '.MuiTablePagination-toolbar': { minHeight: 36 },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
          }}
        />
      </CardContent>
    </Card>
  );
}