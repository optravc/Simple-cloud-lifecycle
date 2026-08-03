'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Checkbox,
  FormControlLabel,
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ConfirmSweepDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (settings: { createAmi: boolean; amiName: string; retainEbs: boolean }) => void;
  loading: boolean;
}

export default function ConfirmSweepDialog({ open, onClose, onConfirm, loading }: ConfirmSweepDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [createAmi, setCreateAmi] = useState(true);
  const [amiName, setAmiName] = useState('sweep-backup-ami');
  const [retainEbs, setRetainEbs] = useState(false);

  // เคลียร์ค่าทุกครั้งที่เปิด/ปิดหน้าต่าง
  useEffect(() => {
    if (!open) {
      setConfirmText('');
      setCreateAmi(true);
      setRetainEbs(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={!loading ?
        onClose : undefined}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#fdfeff',
            color: '#000000',
            borderRadius: 2,
            border: '1px solid #30363d',
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 2 }}>
        {/* 2. เพิ่ม component="span" ตรงนี้เพื่อแก้ปัญหา Hydration Error <h6> ซ้อน <h2> */}
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          Confirm Scan & Sweep
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: '#000000' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" sx={{ mb: 3, color: '#000000' }}>
          Permanently terminate all <Typography component="span" sx={{ fontWeight: 'bold', color: '#f85149' }}>Idle EC2 instances</Typography> that exceed the lifecycle limit. You cant undo this action.
        </Typography>

        {/* Warning Box */}
        <Box sx={{
          display: 'flex', gap: 1.5, p: 2, mb: 3,
          border: '1px solid #d29922',
          borderRadius: 2,
          bgcolor: 'rgba(210, 153, 34, 0.1)'
        }}>
          <WarningAmberIcon sx={{ color: '#d29922', fontSize: 20, mt: 0.2 }} />
          <Typography variant="body2">
            Proceeding with this action will terminate the flagged EC2 instances and delete their associated ephemeral storage. {' '}
            <Link href="#" sx={{ color: '#58a6ff', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Learn more ↗
            </Link>
          </Typography>
        </Box>

        {/* AMI Backup Section */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={createAmi}
                onChange={(e) => setCreateAmi(e.target.checked)}
                sx={{ color: '#58a6ff', '&.Mui-checked': { color: '#58a6ff' } }}
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>Create AMI backup before termination</Typography>}
          />
          <Typography variant="caption" sx={{ display: 'block', ml: 4, mt: -1, color: '#8b949e' }}>
            Determines whether an Amazon Machine Image (AMI) is created to backup the instances before sweeping.
          </Typography>

          {createAmi && (
            <Box sx={{ ml: 4, mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                Base AMI name identifier
              </Typography>
              <TextField
                size="small"
                fullWidth
                value={amiName}
                onChange={(e) => setAmiName(e.target.value)}
                sx={{
                  input: { color: '#000000', bgcolor: '#ffffff', borderRadius: 1, py: 1, },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#30363d' },
                    '&:hover fieldset': { borderColor: '#8b949e' },
                    '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Retain EBS Volumes Section */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={retainEbs}
                onChange={(e) => setRetainEbs(e.target.checked)}
                sx={{ color: '#58a6ff', '&.Mui-checked': { color: '#58a6ff' } }}
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>Retain attached EBS volumes</Typography>}
          />
          <Typography variant="caption" sx={{ display: 'block', ml: 4, mt: -1, color: '#8b949e' }}>
            Prevents the root and attached EBS volumes from being deleted when the instances are terminated.
          </Typography>

          {/* Info Box */}
          {retainEbs && (
            <Box sx={{
              display: 'flex', gap: 1.5, p: 2, ml: 4, mt: 2,
              border: '1px solid #1f6feb',
              borderRadius: 2,
              bgcolor: 'rgba(31, 111, 235, 0.1)'
            }}>
              <InfoOutlinedIcon sx={{ color: '#58a6ff', fontSize: 20, mt: 0.2 }} />
              <Typography variant="body2">
                You will continue to be billed for retained EBS volumes at the standard AWS storage rate. {' '}
                <Link href="#" sx={{ color: '#58a6ff', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  EBS Pricing ↗
                </Link>
              </Typography>
            </Box>
          )}
        </Box>

        {/* Confirmation Input */}
        <Typography variant="body2" sx={{ mb: 2 }}>
          To avoid accidental sweeping, please provide written consent.
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          To confirm, type <Typography component="span" sx={{ fontStyle: 'italic', fontWeight: 'bold', color: '#f85149' }}>confirm</Typography> into the field.
        </Typography>

        <TextField
          autoFocus
          fullWidth
          size="small"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={loading}
          autoComplete="off"
          sx={{
            input: { color: '#f85149', bgcolor: '#fefeff', borderRadius: 1, },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#8b949e' },
              '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
            },
          }}
        />
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: '#58a6ff',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgb(254, 254, 255)' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm({ createAmi: false, amiName: '', retainEbs: false })}
          disabled={confirmText !== 'confirm' || loading}
          variant="contained"
          sx={{
            bgcolor: '#da3633',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#b32d2a' },
            '&.Mui-disabled': {
              bgcolor: '#ffffff',
              color: '#ff0000',
              borderColor: 'transparent'
            }
          }}
        >
          {loading ? 'Sweeping...' : 'Sweep Instances'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}