'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { API_BASE } from '@/lib/api';

export interface TerminatedHistoryItem {
  instance_id: string;
  instance_name: string;
  owner_email: string;
  saved_cost_per_day: number;
  action_taken: string;
  action_at: string;
}

export default function TerminatedHistoryTable() {
  const [history, setHistory] = useState<TerminatedHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/resources/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        setHistory(data.history ?? []);
      } catch (err) {
        console.error('Error fetching terminated history:', err);
        setError('Failed to load audit history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime()) || d.getFullYear() === 1 || d.getFullYear() === 1970) return '-';
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper function to render table content safely without nested ternaries (Fixes S3358)
  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
            <CircularProgress size={30} />
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Loading audit history...
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    if (history.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
            No terminated resources history found.
          </TableCell>
        </TableRow>
      );
    }

    return history.map((item, idx) => (
      <TableRow key={item.instance_id || idx} sx={{ '&:hover': { bgcolor: '#f7fafc' } }}>
        <TableCell sx={{ py: 2 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#2d3748' }}>
            {item.instance_name || 'Unnamed Instance'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace' }}>
            {item.instance_id}
          </Typography>
        </TableCell>

        <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary', py: 2 }}>
          {item.owner_email || '-'}
        </TableCell>

        <TableCell sx={{ py: 2 }}>
          <Chip
            label="TERMINATED"
            size="small"
            color="error"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.68rem' }}
          />
        </TableCell>

        <TableCell sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 500, py: 2 }}>
          {formatDate(item.action_at)}
        </TableCell>

        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#2e7d32', py: 2 }}>
          +${(item.saved_cost_per_day || 0).toFixed(2)} / day
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <HistoryIcon color="action" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
              Terminated Resources Audit History
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Audit trail of cloud resources terminated by automated lifecycle sweepers
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid #edf2f7', color: 'text.secondary', fontWeight: '700', fontSize: '0.75rem' } }}>
                <TableCell>Resource Name & ID</TableCell>
                <TableCell>Owner Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Terminated Date</TableCell>
                <TableCell align="right">Daily Cost Saved</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTableBody()}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}