import { Box, Typography, Button } from '@mui/material';

interface ManageHeaderToolbarProps {
  userRole: string;
  userDept?: string;
  onOpenCreateTeam: () => void;
  onOpenLaunchServer: () => void;
}

export default function ManageHeaderToolbar({
  userRole,
  userDept,
  onOpenCreateTeam,
  onOpenLaunchServer,
}: ManageHeaderToolbarProps) {
  const canCreateTeam = ['admin', 'finops'].includes(userRole) || (userDept?.toLowerCase().includes('finops'));

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a2035', fontSize: '1.15rem' }}>
        Resource Lifecycle Management
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {canCreateTeam && (
          <Button
            variant="outlined"
            color="primary"
            onClick={onOpenCreateTeam}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            + Create Team
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={onOpenLaunchServer}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
        >
          + Launch Server
        </Button>
      </Box>
    </Box>
  );
}
