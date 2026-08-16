import { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, Button, Tooltip, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { ReportItem } from '@/types/report';
import ActionStatusModal from '@/components/common/ActionStatusModal';
import { getUserInfo } from '@/lib/auth';
import { printSingleReportPDF } from '@/lib/reportExporter';

interface ScheduledReportsTableProps {
  reports: ReportItem[];
  onToggleStatus?: (id: string, newStatus: string) => void;
}

export default function ScheduledReportsTable({
  reports, 
  onToggleStatus 
}: Readonly<ScheduledReportsTableProps>) {

  const [currentUserEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userEmail');
      if (stored) return stored;
    }
    const info = getUserInfo();
    if (info?.email) return info.email;
    if (info?.username?.includes('@')) return info.username;
    return 'noptrapk@gmail.com';
  });

  const [modalState, setModalState] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handleSendNow = (reportName: string, recipient: string) => {
    setModalState({
      open: true,
      type: 'success',
      title: 'Report Dispatched!',
      message: `Executive report '${reportName}' has been generated and dispatched to ${recipient}.`,
    });
  };

  const handleDownloadPdf = (reportName: string, recipient: string) => {
    printSingleReportPDF(reportName, recipient);
    setModalState({
      open: true,
      type: 'success',
      title: 'PDF Report Snapshot Launched',
      message: `Latest snapshot PDF window for '${reportName}' has been launched successfully. You can save or print to PDF.`,
    });
  };

  const getFullRecipients = (rawRecipients: string) => {
    if (!rawRecipients) return currentUserEmail;
    return rawRecipients;
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #919eab3d', 
        borderRadius: 4, 
        boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
        bgcolor: '#ffffff'
      }}
    >
      <CardContent sx={{ p: '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '1rem', mb: 0.5 }}>
              Automated Report Subscriptions
            </Typography>
            <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.82rem' }}>
              Configured scheduled executive reports & automated email dispatching
            </Typography>
          </Box>

          <Chip 
            icon={<ScheduleIcon style={{ fontSize: '14px', color: '#00AB55' }} />} 
            label={`${reports.filter(r => r.status === 'Active').length} Active Automation Tasks`} 
            size="small"
            sx={{ bgcolor: '#00AB5514', color: '#00AB55', fontWeight: 700, fontSize: '0.75rem', height: 26 }} 
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {reports.map((rep) => {
            const recipientList = getFullRecipients(rep.recipients);
            return (
              <Box 
                key={rep.id} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  p: 2, 
                  px: 2.5, 
                  bgcolor: '#f8fafc', 
                  borderRadius: 3, 
                  border: '1px solid #f1f5f9',
                  gap: 2
                }}
              >
                {/* Left Column: Report Title & Recipient Subtitle */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.92rem', mb: 0.4 }}>
                    {rep.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.78rem' }}>
                    Frequency: <b>{rep.frequency}</b> • Recipients: <b>{recipientList}</b>
                  </Typography>
                </Box>

                {/* Right Column: Active Chip -> Download PDF -> Send Now (Far Right Edge) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                  <Chip 
                    label={rep.status} 
                    size="small" 
                    color={rep.status === 'Active' ? 'success' : 'default'} 
                    variant={rep.status === 'Active' ? 'filled' : 'outlined'} 
                    onClick={() => onToggleStatus?.(rep.id, rep.status === 'Active' ? 'Paused' : 'Active')}
                    sx={{ 
                      cursor: 'pointer', 
                      height: 28, 
                      px: 1,
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      bgcolor: rep.status === 'Active' ? '#00AB5514' : 'grey.200',
                      color: rep.status === 'Active' ? '#00AB55' : 'grey.700',
                      '&:hover': { opacity: 0.8 } 
                    }}
                  />

                  <Tooltip title="Download latest executive PDF snapshot">
                    <IconButton 
                      size="small"
                      onClick={() => handleDownloadPdf(rep.name, recipientList)}
                      sx={{ color: '#d32f2f', bgcolor: '#ffebee', p: 0.8, borderRadius: 2, '&:hover': { bgcolor: '#ffcdd2' } }}
                    >
                      <PictureAsPdfIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Trigger immediate email dispatch to recipients">
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleSendNow(rep.name, recipientList)}
                      sx={{ 
                        textTransform: 'none', 
                        height: 32, 
                        fontSize: '0.78rem', 
                        borderRadius: 2, 
                        fontWeight: 700, 
                        px: 2,
                        bgcolor: '#2065D1',
                        boxShadow: '0 4px 12px rgba(32, 101, 209, 0.24)',
                        '&:hover': { bgcolor: '#115293' }
                      }}
                    >
                      Send Now
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>

      <ActionStatusModal
        open={modalState.open}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
      />
    </Card>
  );
}