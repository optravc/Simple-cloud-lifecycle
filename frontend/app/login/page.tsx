'use client';

import React, { useState } from 'react';
import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import userPool from '@/lib/cognito';
import { useRouter } from 'next/navigation';
import { getUserInfo } from '@/lib/auth';
import { Box, Button, TextField,  Typography, Paper, 
  Alert,InputAdornment,CircularProgress} from '@mui/material';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState(''); 
  const [requiresNewPassword, setRequiresNewPassword] = useState(false); 
  const [userObject, setUserObject] = useState<CognitoUser | null>(null); 
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    setUserObject(cognitoUser);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', idToken);
          const info = getUserInfo();
          if (info?.role === 'dev') {
            router.push('/performance');
          } else {
            router.push('/dashboard');
          }
        }
      },
      onFailure: (err) => {
        setIsLoading(false);
        setError(err.message || 'Incorrect email or password');
      },
      newPasswordRequired: () => {
        setIsLoading(false);
        setRequiresNewPassword(true); // Switch view to set new password
      }
    });
  };

  // Function to save new password (on first login)
  const handleNewPasswordSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!userObject) return;
    setError('');
    setIsLoading(true);

    userObject.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', idToken);
          const info = getUserInfo();
          if (info?.role === 'dev') {
            router.push('/performance');
          } else {
            router.push('/dashboard');
          }
        }
      },
      onFailure: (err) => {
        setIsLoading(false);
        setError(err.message || 'Unable to set new password. Please try again.');
      }
    });
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: '#0A1638',
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1a2a5e 0%, #0A1638 100%)'
      }}
    >
      <Paper 
        elevation={10} 
        sx={{ 
          p: 5, 
          width: '100%', 
          maxWidth: 420, 
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box 
          sx={{ 
            width: 60, 
            height: 60, 
            bgcolor: 'rgba(25, 118, 210, 0.1)', 
            borderRadius: 2, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mb: 2
          }}
        >
          <CloudQueueIcon sx={{ fontSize: 36, color: '#1976d2' }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#1e293b' }}>
          {requiresNewPassword ? 'Set New Password' : 'Simple-cloud LIFECYCLE'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 4, textAlign: 'center' }}>
          {requiresNewPassword 
            ? 'This is your first login. Please enter a new secure password.'
            : 'Sign in to manage and optimize your cloud infrastructure securely.'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Conditional form view switch */}
        {!requiresNewPassword ? (
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              label="Temporary / Current Password"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 4 }}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ 
                py: 1.5, 
                bgcolor: '#1976d2', 
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#1565c0' }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleNewPasswordSubmit} style={{ width: '100%' }}>
            <TextField
              fullWidth
              label="New Password"
              variant="outlined"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 4 }}
              required
              helperText="Must be at least 8 characters with numbers and symbols"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ 
                py: 1.5, 
                bgcolor: '#2e7d32',
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#1b5e20' }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Change Password & Sign In'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}