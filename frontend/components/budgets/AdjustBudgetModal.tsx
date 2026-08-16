'use client';

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Grid,
  TextField, MenuItem, Button, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { DepartmentBudget } from '@/types/budget';

interface AdjustBudgetModalProps {
  open: boolean;
  onClose: () => void;
  departments: DepartmentBudget[];
  selectedDeptId: number | '';
  onDeptSelectChange: (id: number) => void;
  newBudgetAmount: string;
  onBudgetAmountChange: (val: string) => void;
  onSave: () => void;
  isSubmitting: boolean;
}

export default function AdjustBudgetModal({
  open,
  onClose,
  departments,
  selectedDeptId,
  onDeptSelectChange,
  newBudgetAmount,
  onBudgetAmountChange,
  onSave,
  isSubmitting,
}: Readonly<AdjustBudgetModalProps>) {
  return (
    <Dialog
      open={open}
      onClose={() => !isSubmitting && onClose()}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          p: 2,
          maxWidth: 500,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, bgcolor: 'rgba(25, 118, 210, 0.1)', borderRadius: '50%', color: '#1976d2' }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1a202c' }}>
            Adjust Cost Center Budget
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={isSubmitting} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography variant="body2" sx={{ mb: 2.5, color: '#64748b', fontSize: '0.85rem' }}>
          Select a cost center department and adjust its monthly cloud budget (USD). FinOps alert thresholds and Slack channels will update automatically.
        </Typography>

        <Grid container spacing={2.5}>
          {/* 1. Department Selection */}
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Department (Cost Center) <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              select
              value={selectedDeptId}
              onChange={(e) => onDeptSelectChange(Number(e.target.value))}
              fullWidth
              disabled={isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                },
              }}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 2. Monthly Budget Amount */}
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Monthly Budget Amount (USD) <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={newBudgetAmount}
              onChange={(e) => onBudgetAmountChange(e.target.value)}
              placeholder="e.g., 60000"
              disabled={selectedDeptId === '' || isSubmitting}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={selectedDeptId === '' || !newBudgetAmount || isSubmitting}
          variant="contained"
          sx={{
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' },
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          {isSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
