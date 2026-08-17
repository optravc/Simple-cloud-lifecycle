'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { CloudResource } from '@/types/manage';
import { API_BASE } from '@/lib/api';

interface ResourceDetailDialogProps {
  open: boolean;
  onClose: () => void;
  resource: CloudResource | null;
  userRole?: string;
  onActionSuccess?: () => void;
}

export default function ResourceDetailDialog({
  open,
  onClose,
  resource,
  userRole = 'dev',
  onActionSuccess,
}: Readonly<ResourceDetailDialogProps>) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Track local action status overrides so we don't mutate props
  const [statusOverride, setStatusOverride] = useState<string | null>(null);

  const getChipColor = (status: string) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'STOPPED') return 'error';
    return 'default';
  };

  if (!resource) return null;

  const isProtected = (resource.Environment || '').toLowerCase() === 'permanent' ||
    (resource.Name || '').toLowerCase().includes('app-server') ||
    (resource.Name || '').toLowerCase().includes('scl-sandbox');

  const currentStatus = statusOverride || resource.Status || 'ACTIVE';

  const formatDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return 'Permanent';
    const deadline = new Date(deadlineStr);
    if (Number.isNaN(deadline.getTime()) || deadline.getFullYear() === 1 || deadline.getFullYear() === 1970) {
      return 'Permanent';
    }
    return deadline.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleStart = async () => {
    setActionLoading('start');
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/resources/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance_id: resource.ID }),
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      setStatusOverride('ACTIVE');
      setMessage({ type: 'success', text: `Instance ${resource.Name} started successfully!` });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      console.error('Error starting instance:', err);
      setMessage({ type: 'error', text: 'Failed to start instance.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading('stop');
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/resources/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance_id: resource.ID }),
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      setStatusOverride('STOPPED');
      setMessage({ type: 'success', text: `Instance ${resource.Name} stopped successfully!` });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      console.error('Error stopping instance:', err);
      setMessage({ type: 'error', text: 'Failed to stop instance.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async () => {
    setActionLoading('extend');
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/resources/extend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance_id: resource.ID, days: 7 }),
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      setStatusOverride('ACTIVE');
      setMessage({ type: 'success', text: `Lease extended by 7 days for ${resource.Name}!` });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      console.error('Error extending lease:', err);
      setMessage({ type: 'error', text: 'Failed to extend lease.' });
    } finally {
      setActionLoading(null);
    }
  };

  const canAction = userRole === 'admin' || userRole === 'finops' || userRole === 'lead' || userRole === 'dev';



  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {resource.Name}
          </Typography>
          <Chip
            size="small"
            label={currentStatus === 'PENDING_SWEEP' ? 'PENDING SWEEP' : currentStatus}
           color={getChipColor(currentStatus)}
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {message && (
          <Alert severity={message.type} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {currentStatus === 'PENDING_SWEEP' && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}>
            📧 Sweep warning email sent to owner ({resource.OwnerEmail}). Instance is scheduled for automatic sweep. Click <strong>Extend Lease (+7d)</strong> below to keep this server and cancel the sweep.
          </Alert>
        )}

        {/* Section 1: Resource Overview Specs */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1.5 }}>
          COMPUTE RESOURCE SPECS & OWNER
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Instance ID
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
              {resource.ID}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Environment
            </Typography>
            <Chip label={resource.Environment || 'development'} size="small" variant="outlined" />
          </Grid>

          {resource.Description && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Purpose / Description
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#4a5568', bgcolor: '#f7fafc', p: 1, borderRadius: 1.5, border: '1px solid #edf2f7' }}>
                {resource.Description}
              </Typography>
            </Grid>
          )}

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Owner & Department
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {resource.Owner} ({resource.Department})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {resource.OwnerEmail}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Daily On-Demand Cost
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
              ${(resource.Costperday || 0).toFixed(2)} / day
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Idle Days
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {resource.DayIdle} days
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Lease Expiry Deadline
            </Typography>
            <Typography variant="body2" color={resource.Deadline ? 'warning.main' : 'text.primary'} sx={{ fontWeight: 600 }}>
              {formatDeadline(resource.Deadline?.toString())}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Section 3: Action Buttons */}
      <DialogActions sx={{ p: 2.5, bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Close
        </Button>

        {isProtected && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            🔒 <strong>Protected Infrastructure:</strong> Primary application server running the system. Stop and Sweep actions are disabled to prevent service downtime.
          </Alert>
        )}

        {canAction && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {currentStatus === 'STOPPED' ? (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={actionLoading === 'start' ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                disabled={actionLoading !== null}
                onClick={handleStart}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Start Server
              </Button>
            ) : (
              <Button
                variant="contained"
                color="warning"
                size="small"
                startIcon={actionLoading === 'stop' ? <CircularProgress size={16} color="inherit" /> : <StopIcon />}
                disabled={actionLoading !== null || isProtected}
                onClick={handleStop}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Stop Server
              </Button>
            )}

            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={actionLoading === 'extend' ? <CircularProgress size={16} color="inherit" /> : <ScheduleIcon />}
              disabled={actionLoading !== null}
              onClick={handleExtend}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Extend Lease (+7d)
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}