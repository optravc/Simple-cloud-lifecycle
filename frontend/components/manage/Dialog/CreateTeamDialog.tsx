'use client';

import React, { useState } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions,
Box, Grid, Typography, TextField,
 MenuItem,Button,CircularProgress} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { CreateTeamDialogProps, } from '@/types/manage';

const PRESET_EMAILS_BY_DEPT: Record<number, { label: string; email: string }[]> = {
  1: [ // Core Infrastructure
    { label: 'Tech Lead — noptrapk+infra.lead@gmail.com', email: 'noptrapk+infra.lead@gmail.com' },
    { label: 'Developer — noptrapk+infra.dev@gmail.com', email: 'noptrapk+infra.dev@gmail.com' },
  ],
  2: [ // Product Engineering
    { label: 'Tech Lead — noptrapk+prod.lead@gmail.com', email: 'noptrapk+prod.lead@gmail.com' },
    { label: 'Developer — noptrapk+prod.dev@gmail.com', email: 'noptrapk+prod.dev@gmail.com' },
  ],
  3: [ // Data Science & Analytics
    { label: 'Tech Lead — noptrapk+data.lead@gmail.com', email: 'noptrapk+data.lead@gmail.com' },
  ],
  4: [ // Trust & Safety
    { label: 'Tech Lead — noptrapk+trust.lead@gmail.com', email: 'noptrapk+trust.lead@gmail.com' },
  ],
  5: [ // Finance
    { label: 'Finance Lead — dear.finance@gmail.com', email: 'dear.finance@gmail.com' },
  ],
  6: [ // Executive / C-Level
    { label: 'Executive — noptrapk+executive@gmail.com', email: 'noptrapk+executive@gmail.com' },
  ],
  7: [ // FinOps & Cloud Governance
    { label: 'FinOps Lead — noptrapk+finops.lead@gmail.com', email: 'noptrapk+finops.lead@gmail.com' },
    { label: 'Admin — noptrapk@gmail.com', email: 'noptrapk@gmail.com' },
  ],
};

export default function CreateTeamDialog({
  open,
  onClose,
  departments,
  onCreate,
  loading
}: Readonly<CreateTeamDialogProps>) {
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamEmail, setNewTeamEmail] = useState<string>('');
  const [newTeamDeptID, setNewTeamDeptID] = useState<number | ''>('');

  // Auto-select initial department & default Tech Lead email
  React.useEffect(() => {
    if (departments && departments.length > 0 && !newTeamDeptID) {
      const firstDeptId = departments[0].id;
      setNewTeamDeptID(firstDeptId);
      const available = PRESET_EMAILS_BY_DEPT[firstDeptId] || [];
      if (available.length > 0) {
        setNewTeamEmail(available[0].email);
      }
    }
  }, [departments, newTeamDeptID]);

  // Handle department change -> update email dropdown list and select default Tech Lead
  const handleDeptChange = (deptId: number) => {
    setNewTeamDeptID(deptId);
    const available = PRESET_EMAILS_BY_DEPT[deptId] || [];
    if (available.length > 0) {
      setNewTeamEmail(available[0].email);
    } else {
      setNewTeamEmail('');
    }
  };

  const handleSubmit = async () => {
    if (!newTeamName || !newTeamEmail || !newTeamDeptID) {
      alert('Please fill out all fields');
      return;
    }
    await onCreate({
      team_name: newTeamName,
      contact_email: newTeamEmail,
      department_id: Number(newTeamDeptID)
    });
    // Reset fields on success
    setNewTeamName('');
  };

  const currentEmails = newTeamDeptID ? (PRESET_EMAILS_BY_DEPT[Number(newTeamDeptID)] || []) : [];

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          p: 2,
          maxWidth: 600
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, borderBottom: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, bgcolor: '#7b1fa2', borderRadius: '50%', color: 'white' }}>
          <AddIcon sx={{ fontSize: 18 }} />
        </Box>
        Create New Team
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* 1. Department Selection */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Department <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              select
              value={newTeamDeptID}
              onChange={(e) => handleDeptChange(Number(e.target.value))}
              fullWidth
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                }
              }}
            >
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 2. Contact Email Dropdown (Filtered by selected Department) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
               Contact Email <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              select
              value={newTeamEmail}
              onChange={(e) => setNewTeamEmail(e.target.value)}
              fullWidth
              disabled={loading}
              helperText="Filtered by selected Department (Tech Leads & Devs)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                }
              }}
            >
              {currentEmails.map((item) => (
                <MenuItem key={item.email} value={item.email}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 3. Team Name */}
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Team Name <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              placeholder="e.g., Team-A2-infra-k8s"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              fullWidth
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !newTeamName || !newTeamEmail || !newTeamDeptID}
          variant="contained"
          sx={{
            bgcolor: '#7b1fa2',
            '&:hover': { bgcolor: '#6a1b9a' },
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 'bold',
            textTransform: 'none'
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
