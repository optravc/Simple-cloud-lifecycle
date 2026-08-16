'use client';
import React, { useState, useEffect } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions,Button, TextField,Typography,Box,IconButton,Checkbox,
  Link,Table,TableHead,TableRow,TableCell,TableBody,Switch,TableContainer,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import { ConfirmSweepDialogProps, InstanceSweepSetting,CloudResource } from '@/types/manage';


export default function ConfirmSweepDialog({ open, 
  onClose,
   onConfirm, 
   loading, 
   previewData, 
   resources 
  }:Readonly<ConfirmSweepDialogProps>) {
  const [confirmText, setConfirmText] = useState('');
  const [rowSettings, setRowSettings] = useState<Record<string, InstanceSweepSetting>>({});

  // Normalize instances to always be full CloudResource objects
  const normalizedInstances = React.useMemo(() => {
    return (previewData?.instances ?? [])
      .map((inst: CloudResource | string) => {
        if (typeof inst === 'string') {
          const found = resources.find((r: CloudResource) => r.Name === inst || r.ID === inst);
          if (found) return found;
          return {
            ID: inst,
            Name: inst,
            DayIdle: 0,
            Costperday: 0,
            Status: 'ACTIVE',
            Type: '',
            Provider: 'AWS',
            Owner: '',
          } as CloudResource;
        }
        return inst as CloudResource;
      })
      .filter((inst) => {
        const found = resources.find((r) => r.ID === inst.ID || r.Name === inst.Name);
        const status = found ? found.Status : inst.Status;
        return status === 'ACTIVE';
      });
  }, [previewData?.instances, resources]);

  // Initialize and clear values
  useEffect(() => {
    const initializeSettings = async () => {
      if (open && normalizedInstances.length > 0) {
        setConfirmText('');
        const initialSettings: Record<string, InstanceSweepSetting> = {};
        normalizedInstances.forEach((inst: CloudResource) => {
          initialSettings[inst.ID] = {
            selected: true,
            createAmi: true,
            amiName: `${inst.Name || inst.ID}-backup-ami`,
            retainEbs: false
          };
        });
        setRowSettings(initialSettings);
      } else if (!open) {
        setConfirmText('');
        setRowSettings({});
      }
    };
    initializeSettings();
  }, [open, normalizedInstances]);

  const updateSetting = <K extends keyof InstanceSweepSetting>(
    id: string,
    key: K,
    value: InstanceSweepSetting[K]
  ) => {
    setRowSettings((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value
      }
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setRowSettings((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id].selected = checked;
      });
      return updated;
    });
  };

  const allSelected = normalizedInstances.length > 0 &&
    normalizedInstances.every((inst: CloudResource) => rowSettings[inst.ID]?.selected);

  const selectedCount = Object.values(rowSettings).filter((s) => s.selected).length;
  const selectedSavings = normalizedInstances && rowSettings
    ? normalizedInstances
        .filter((inst: CloudResource) => rowSettings[inst.ID]?.selected)
        .reduce((sum: number, inst: CloudResource) => sum + (inst.Costperday ?? 0), 0)
    : 0;

  const renderSweepContent = () => {
    if (previewData?.items_to_sweep === 0) {
      return (
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
          p: 4, mb: 3, border: '1px solid #2ea043', borderRadius: 3, bgcolor: 'rgba(46, 160, 67, 0.04)'
        }}>
          <CheckCircleOutlineIcon sx={{ color: '#2ea043', fontSize: 36 }} />
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2ea043' }}>
            No instances found Idle for more than 14 days
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            All instances in the system are within lifecycle limits — no action required
          </Typography>
        </Box>
      );
    }

    if (normalizedInstances.length > 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: selectedCount > 0 ? '#d32f2f' : 'text.secondary' }}>
              Selected {selectedCount} instance(s) to sweep (Saves ${selectedSavings.toFixed(2)}/day)
            </Typography>
          </Box>
          
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f7fafc' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Resource</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Days Idle</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cost/Day</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Create AMI</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Backup Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {normalizedInstances.map((inst: CloudResource) => {
                  const settings = rowSettings[inst.ID] || {
                    selected: false,
                    createAmi: false,
                    amiName: '',
                    retainEbs: false
                  };
                  return (
                    <TableRow key={inst.ID} hover selected={settings.selected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={settings.selected}
                          onChange={(e) => updateSetting(inst.ID, 'selected', e.target.checked)}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: '600' }}>
                            {inst.Name || 'unnamed'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {inst.ID}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{inst.DayIdle || 1} days</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: '500', color: 'success.main' }}>
                          ${(inst.Costperday ?? 0.25).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={settings.createAmi}
                          onChange={(e) => updateSetting(inst.ID, 'createAmi', e.target.checked)}
                          disabled={!settings.selected || loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={settings.amiName}
                          onChange={(e) => updateSetting(inst.ID, 'amiName', e.target.value)}
                          disabled={!settings.selected || !settings.createAmi || loading}
                          placeholder="Backup name"
                          sx={{
                            width: 200,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              fontSize: '0.78rem',
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    return null;
  };

  const handleSubmit = () => {
    const payload = Object.entries(rowSettings)
      .filter(([, settings]) => settings.selected)
      .map(([id, settings]) => ({
        instance_id: id,
        create_ami: settings.createAmi,
        ami_name: settings.createAmi ? settings.amiName : '',
        retain_ebs: settings.retainEbs
      }));
    onConfirm(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          p: 1,
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 2, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', fontSize: '1.15rem' }}>
          Confirm Scan & Sweep (Interactive)
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1, pt: 3 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Below are the idle EC2 instances exceeding lifecycle limits. Select which instances you want to sweep and customize their backup settings.
        </Typography>

        {normalizedInstances.length > 0 && (
          <>
            {/* Warning Box (Above Table) */}
            <Box sx={{
              display: 'flex', gap: 1.5, p: 2, mb: 3,
              border: '1px solid #d29922',
              borderRadius: 2,
              bgcolor: 'rgba(210, 153, 34, 0.04)',
              alignItems: 'center'
            }}>
              <WarningAmberIcon sx={{ color: '#d29922', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                Proceeding will flag the selected instances for sweeping. They will receive warning emails and be scheduled for automatic termination. {' '}
                <Link href="#" sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Learn more ↗
                </Link>
              </Typography>
            </Box>

            {/* Preview Grid Table */}
            {renderSweepContent()}

            {/* Confirmation Input */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: '600', mb: 1 }}>
                To confirm sweeping, type <Typography component="span" sx={{ fontStyle: 'italic', fontWeight: 'bold', color: '#d32f2f' }}>confirm</Typography> below:
              </Typography>
              <TextField
                autoFocus
                fullWidth
                size="small"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={loading || selectedCount === 0}
                autoComplete="off"
                placeholder="Type 'confirm'"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#fff',
                  }
                }}
              />
            </Box>
          </>
        )}

        {normalizedInstances.length === 0 && renderSweepContent()}
      </DialogContent>

      {/* Actions */}
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
          disabled={confirmText !== 'confirm' || loading || selectedCount === 0 || 
            Object.entries(rowSettings).some(([, s]) => s.selected && s.createAmi && !s.amiName.trim())}
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold',
            bgcolor: '#d32f2f',
            '&:hover': { bgcolor: '#b71c1c' }
          }}
        >
          {loading ? 'Sweeping...' : 'Sweep Selected Instances'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}