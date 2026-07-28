import React from 'react';
import Link from 'next/link';
import { Drawer, Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MemoryIcon from '@mui/icons-material/Memory';
import LogoutIcon from '@mui/icons-material/Logout';
import DescriptionIcon from '@mui/icons-material/Description';

const drawerWidth = 260;

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#0A1638', color: 'white', borderRight: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
      }}
    >
      <Box>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 32, height: 32, bgcolor: '#1976d2', borderRadius: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Simple-cloud LIFECYCLE</Typography>
        </Box>

        <List sx={{ px: 2 }}>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              component={Link} 
              href="/dashboard"
              sx={{ bgcolor: 'rgba(25, 118, 210, 0.2)', borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: '#64b5f6', minWidth: 40 }}><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" slotProps={{ primary: { sx: { fontWeight: 'bold', color: '#64b5f6' } } }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              component={Link} 
              href="/reports"
              sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
            >
              <ListItemIcon sx={{ color: '#9e9e9e', minWidth: 40 }}><DescriptionIcon /></ListItemIcon>
              <ListItemText primary="Reports" slotProps={{ primary: { color: '#e0e0e0' } }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              component={Link} 
              href="/performance"
              sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
            >
              <ListItemIcon sx={{ color: '#9e9e9e', minWidth: 40 }}><MemoryIcon /></ListItemIcon>
              <ListItemText primary="Performance" slotProps={{ primary: { color: '#e0e0e0' } }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              component={Link} 
              href="/manage"
              sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
            >
              <ListItemIcon sx={{ color: '#9e9e9e', minWidth: 40 }}><DescriptionIcon /></ListItemIcon>
              <ListItemText primary="Manage" slotProps={{ primary: { color: '#e0e0e0' } }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <Avatar alt="Admin" src="https://via.placeholder.com/40" sx={{ width: 40, height: 40 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}> phuridis koriparb</Typography>
          </Box>
          <LogoutIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
        </Box>
      </Box>
    </Drawer>
  );
}