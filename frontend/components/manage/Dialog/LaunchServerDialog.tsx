'use client';

import  { useState, useEffect } from 'react';
import {Dialog,DialogTitle,DialogContent, DialogActions,
  Box,Grid,Typography,TextField, MenuItem, Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { LaunchServerDialogProps } from '@/types/manage';
import ActionStatusModal from '@/components/common/ActionStatusModal';

export default function LaunchServerDialog({
  open,
  onClose,
  userRole,
  teams,
  onLaunch,
  loading,
  onAddTeamClick
}: Readonly<LaunchServerDialogProps>) {
  const [serverName, setServerName] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [instanceType, setInstanceType] = useState<string>('t3.micro');
  const [environment, setEnvironment] = useState<string>('development');
  const [leaseDays, setLeaseDays] = useState<number>(7);
  const [description, setDescription] = useState<string>('');

  // Sync selectedTeam with first team if teams list updates
  useEffect(() => {
    const initializeTeam = async () => {
      if (teams && teams.length > 0 && !selectedTeam) {
        setSelectedTeam(teams[0].team_name);
      }
    };
    initializeTeam();
  }, [teams, selectedTeam]);

  const [modalState, setModalState] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'error',
    title: '',
    message: '',
  });

  const handleSubmit = async () => {
    if (!serverName) {
      setModalState({
        open: true,
        type: 'error',
        title: 'Missing Server Name',
        message: 'Please enter a server name before launching the instance.',
      });
      return;
    }
    if (!selectedTeam) {
      setModalState({
        open: true,
        type: 'error',
        title: 'Missing Owner Team',
        message: 'Please select an owner team for this instance.',
      });
      return;
    }
    await onLaunch({
      name: serverName,
      instance_type: instanceType,
      environment: environment,
      lease_days: leaseDays,
      team: selectedTeam,
      description: description,
    });
    // Reset server name & description on successful launch
    setServerName('');
    setDescription('');
  };

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
          maxWidth: 700
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, borderBottom: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, bgcolor: '#1976d2', borderRadius: '50%', color: 'white' }}>
          <AddIcon sx={{ fontSize: 18 }} />
        </Box>
        Launch New Server
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Server Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Server Name <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              placeholder="e.g., test-server-01"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
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

          {/* Owner Team */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Owner Team <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                fullWidth
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#fff',
                  }
                }}
              >
                {teams.map((t) => (
                  <MenuItem key={t.team_name} value={t.team_name}>
                    {t.team_name}
                  </MenuItem>
                ))}
              </TextField>
             
            </Box>
          </Grid>

          {/* Instance Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Instance Type <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              select
              value={instanceType}
              onChange={(e) => setInstanceType(e.target.value)}
              fullWidth
              disabled={loading}
              helperText="AWS Free Tier EC2 Instances"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                }
              }}
            >
              <MenuItem value="t3.micro">t3.micro (Free Tier — 2 vCPU, 1 GiB)</MenuItem>
              <MenuItem value="t3.small">t3.small (Free Tier — 2 vCPU, 2 GiB)</MenuItem>
              <MenuItem value="c7i-flex.large">c7i-flex.large (Free Tier — 2 vCPU, 4 GiB)</MenuItem>
              <MenuItem value="m7i-flex.large">m7i-flex.large (Free Tier — 2 vCPU, 8 GiB)</MenuItem>
            </TextField>
          </Grid>

          {/* Environment */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Environment <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              fullWidth
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                }
              }}
            >
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              {userRole === 'admin' && (
                <MenuItem value="production">Production</MenuItem>
              )}
            </TextField>
          </Grid>

          {/* Lease Duration */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Lease Duration <span style={{ color: '#dc3545' }}>*</span>
            </Typography>
            <TextField
              select
              value={leaseDays}
              onChange={(e) => setLeaseDays(Number(e.target.value))}
              fullWidth
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                }
              }}
            >
              <MenuItem value={7}>7 Days (Recommended)</MenuItem>
              <MenuItem value={14}>14 Days</MenuItem>
              {userRole === 'admin' && (
                <MenuItem value={0}>Permanent (No expiration)</MenuItem>
              )}
            </TextField>
          </Grid>

          {/* Purpose / Description */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontWeight: '600', fontSize: '0.85rem', color: '#2d3748', mb: 1 }}>
              Purpose / Description <span style={{ color: '#718096', fontSize: '0.75rem' }}>(Optional)</span>
            </Typography>
            <TextField
              placeholder="e.g., Testing PostgreSQL 15 migration"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: '#4a5568',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { bgcolor: 'transparent', color: '#1a202c' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold',
            bgcolor: '#0f60c7',
            '&:hover': { bgcolor: '#0b4a9c' }
          }}
        >
          {loading ? 'Launching...' : 'Launch Instance'}
        </Button>
      </DialogActions>

      <ActionStatusModal
        open={modalState.open}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
      />
    </Dialog>
  );
}
