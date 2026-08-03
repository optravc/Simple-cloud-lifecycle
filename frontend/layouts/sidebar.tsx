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

const drawerWidth = 260;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('User');
  const [userInitials, setUserInitials] = useState<string>('U');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        // 1. ตรวจสอบสิทธิ์จาก Cognito Groups (รองรับทั้ง Admins และ admins)
        const groups = payload['cognito:groups'] || [];
        if (groups.includes('Admins') || groups.includes('admins')) {
          setIsAdmin(true);
        }

        // 2. ดึงชื่อผู้ใช้จาก Token (Cognito มักเก็บไว้ที่ username, sub หรือ email)
        const emailOrUser = payload['cognito:username'] || payload['username'] || payload['email'] || 'User';
        setUserName(emailOrUser);

        // สร้างตัวย่อสำหรับ Avatar (เช่น เอา 2 ตัวแรกมาทำตัวพิมพ์ใหญ่)
        const initials = emailOrUser.substring(0, 2).toUpperCase();
        setUserInitials(initials);

      } catch (e) {
        console.error("Failed to parse token for roles and user info", e);
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    router.push('/login');
  };

  const menuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, adminOnly: false },
    { text: 'Reports', path: '/reports', icon: <DescriptionIcon />, adminOnly: false },
    { text: 'Performance', path: '/performance', icon: <MemoryIcon />, adminOnly: false },
    { text: 'Budgets', path: '/budgets', icon: <AccountBalanceWalletIcon />, adminOnly: false }, 
    { text: 'Cost Allocation', path: '/allocation', icon: <PieChartIcon />, adminOnly: false }, 
    { text: 'Invoices', path: '/invoices', icon: <ReceiptLongIcon />, adminOnly: false }, 
    { text: 'Manage', path: '/manage', icon: <AdminPanelSettingsIcon />, adminOnly: true },
  ];

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
          <Box sx={{ width: 32, height: 32, bgcolor: '#1976d2', borderRadius: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Simple-cloud LIFECYCLE</Typography>
        </Box>

        <List sx={{ px: 2 }}>
          {menuItems
            .filter((item) => !item.adminOnly || (item.adminOnly && isAdmin)) 
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
          {/* แสดงตัวย่อ Avatar แบบไดนามิก */}
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#1976d2' }}>{userInitials}</Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            {/* แสดงชื่อหรืออีเมลที่ล็อกอินจริงจาก Cognito Token */}
            <Typography variant="body2" sx={{ fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: isAdmin ? '#90caf9' : '#9e9e9e' }}>
              {isAdmin ? 'Administrator' : 'Finance Viewer'}
            </Typography>
          </Box>
          <LogoutIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
        </Box>
      </Box>
    </Drawer>
  );
}