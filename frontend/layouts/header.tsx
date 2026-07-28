import React from 'react';
import { AppBar, Toolbar, Typography, Box, InputBase, IconButton, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Header() {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #f0f0f0' }}>
      <Toolbar sx={{ py: 1, px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{color:"text.primary" ,fontWeight:'bold'}}>
            Cloud Cost Optimization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automated Server Lifecycle & Billing Management
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', px: 2, py: 0.5, borderRadius: 2, width: 250 }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <InputBase placeholder="Search instance..." sx={{ width: '100%' }} />
          </Box>
          <IconButton sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={3} color="warning">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}