'use client'; 

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Drawer, Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MemoryIcon from '@mui/icons-material/Memory';
import LogoutIcon from '@mui/icons-material/Logout';
import DescriptionIcon from '@mui/icons-material/Description';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PieChartIcon from '@mui/icons-material/PieChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { getUserInfo, UserRole } from '@/lib/auth';
import { S3_BASE_URL } from '@/lib/api';

const drawerWidth = 260;

const getUserRoleLabel = (role: string, dept?: string) => {
  if (role === 'admin') return 'Administrator';
  if (role === 'finops') return 'FinOps';
  if (role === 'finance') return 'Finance';

  const deptPrefix = dept && dept !== 'All' ? `${dept.split(' ')[0]} ` : '';

  if (role === 'lead') {
    return `${deptPrefix}Lead`;
  }
  return `${deptPrefix}Developer`;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole>('dev');
  const [userDept, setUserDept] = useState<string>('All');
  const [userName, setUserName] = useState<string>('User');
  const [userInitials, setUserInitials] = useState<string>('U');

  useEffect(() => {
    const loadUserInfo = async () => {
      const info = getUserInfo();
      if (info) {
        setUserRole(info.role);
        setUserDept(info.department);
        setUserName(info.username);
        
        const initials = info.username.substring(0, 2).toUpperCase();
        setUserInitials(initials);
      }
    };
    loadUserInfo();
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    router.push('/login');
  };

  const menuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, allowedRoles: ['admin', 'finops', 'finance', 'lead'] },
    { text: 'Reports', path: '/reports', icon: <DescriptionIcon />, allowedRoles: ['admin', 'finops', 'finance', 'lead'] },
    { text: 'Performance', path: '/performance', icon: <MemoryIcon />, allowedRoles: ['admin', 'finops', 'lead', 'dev'] },
    { text: 'Budgets', path: '/budgets', icon: <AccountBalanceWalletIcon />, allowedRoles: ['admin', 'finops', 'finance', 'lead'] }, 
    { text: 'Allocation', path: '/allocation', icon: <PieChartIcon />, allowedRoles: ['admin', 'finops', 'finance', 'lead'] }, 
    { text: 'Invoices', path: '/invoices', icon: <ReceiptLongIcon />, allowedRoles: ['admin', 'finance', 'finops'] }, 
    { text: 'Manage', path: '/manage', icon: <AdminPanelSettingsIcon />, allowedRoles: ['admin', 'finops', 'lead', 'dev'] },
  ];

  const roleTextColor = userRole === 'admin' ? '#90caf9' : '#9e9e9e';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { 
          width: drawerWidth, 
          boxSizing: 'border-box', 
          bgcolor: '#0A1638', 
          color: 'white', 
          borderRight: 'none', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between' 
        },
      }}
    >
      <Box>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box 
            component="img"
            src={`${S3_BASE_URL}logo/Logo.png`} 
            sx={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 1 }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Simple Cloud Lifecycle</Typography>
        </Box>

        <List sx={{ px: 2 }}>
          {menuItems
            .filter((item) => item.allowedRoles.includes(userRole)) 
            .map((item) => {
              const isActive = pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton 
                    component={Link} 
                    href={item.path}
                    sx={{ 
                      bgcolor: isActive ? 'rgba(25, 118, 210, 0.2)' : 'transparent', 
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive ? '#64b5f6' : '#9e9e9e', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      slotProps={{ 
                        primary: { 
                          sx: { 
                            fontWeight: isActive ? 'bold' : 'normal', 
                            color: isActive ? '#64b5f6' : '#e0e0e0',
                            fontSize: '0.9rem'
                          } 
                        } 
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box 
          onClick={handleLogout}
          sx={{ 
            p: 2, 
            bgcolor: 'rgba(255,255,255,0.05)', 
            borderRadius: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            cursor: 'pointer',
            transition: '0.2s',
            '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.2)' }
          }}
        >
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#1976d2' }}>{userInitials}</Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: roleTextColor, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {getUserRoleLabel(userRole, userDept)}
            </Typography>
            {userDept && userDept !== 'All' && (
              <Typography variant="caption" sx={{ color: '#81c784', display: 'block', fontSize: '0.72rem', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                Dept: {userDept}
              </Typography>
            )}
          </Box>
          <LogoutIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
        </Box>
      </Box>
    </Drawer>
  );
}