'use client';

import { Dialog, DialogContent, Typography, Box, Button,} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface ActionStatusModalProps {
  open: boolean;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  onClose: () => void;
}

const STATUS_CONFIG: Record<'success' | 'error' | 'info', { iconColor: string; iconBg: string; defaultTitle: string }> = {
  success: {
    iconColor: '#00AB55',
    iconBg: '#00AB5518',
    defaultTitle: 'Action Completed',
  },
  error: {
    iconColor: '#FF5630',
    iconBg: '#FF563018',
    defaultTitle: 'Action Failed',
  },
  info: {
    iconColor: '#2065D1',
    iconBg: '#2065D118',
    defaultTitle: 'System Information',
  },
};

export default function ActionStatusModal({
  open,
  type = 'success',
  title,
  message,
  onClose,
}: Readonly<ActionStatusModalProps>) {

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const { iconColor, iconBg, defaultTitle } = STATUS_CONFIG[type] || STATUS_CONFIG.info;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 1,
            width: '100%',
            maxWidth: 420,
            textAlign: 'center',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
            border: '1px solid #919eab3d',
            bgcolor: '#ffffff'
          }
        }
      }}
    >
      <DialogContent sx={{ p: '28px 24px !important', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Animated Icon Badge */}
        <Box
          sx={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            bgcolor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            mb: 2,
            boxShadow: `0 8px 16px -4px ${iconBg}`
          }}
        >
          {isSuccess && <TaskAltIcon sx={{ fontSize: 38 }} />}
          {isError && <CancelOutlinedIcon sx={{ fontSize: 38 }} />}
          {!isSuccess && !isError && <InfoOutlinedIcon sx={{ fontSize: 38 }} />}
        </Box>

        {/* Modal Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1.1rem', mb: 1 }}>
          {title || defaultTitle}
        </Typography>

        {/* Modal Body Message */}
        <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.86rem', lineHeight: 1.5, mb: 3 }}>
          {message}
        </Typography>

        {/* Dismiss / Close Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: 2.5,
            py: 1,
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'none',
            bgcolor: iconColor,
            boxShadow: `0 8px 16px -4px ${iconBg}`,
            '&:hover': {
              bgcolor: iconColor,
              opacity: 0.9
            }
          }}
        >
          {isError ? 'Dismiss' : 'Got it'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
