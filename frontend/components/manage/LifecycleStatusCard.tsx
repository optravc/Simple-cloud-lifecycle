'use client';

import  { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Divider, CircularProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { PendingInstance } from '@/types/manage';
import { API_BASE } from '@/lib/api';

export default function LifecycleStatusCard() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [instances, setInstances] = useState<PendingInstance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/pending-sweep`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const rawInstances: PendingInstance[] = data.instances ?? [];
        const uniqueInstances = Array.from(
          new Map(rawInstances.map((item) => [item.instance_id, item])).values()
        );
        setPendingCount(uniqueInstances.length);
        setInstances(uniqueInstances);
      } catch {
        // silent fail — card displays 0 if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  const formatDeadline = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #bbdefb', bgcolor: '#e3f2fd', borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }} gutterBottom>
          Automated Lifecycle Status
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">Loading...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {pendingCount > 0
                ? <WarningAmberIcon sx={{ color: '#f57c00', fontSize: 24 }} />
                : <CheckCircleOutlinedIcon sx={{ color: '#2e7d32', fontSize: 24 }} />
              }
              <Typography variant="h5" sx={{
                fontWeight: 'bold',
                color: pendingCount > 0 ? '#e65100' : 'text.primary'
              }}>
                {pendingCount} Servers Flagged
              </Typography>
            </Box>

            <Typography color="text.secondary" variant="body2" sx={{ mb: instances.length > 0 ? 2 : 0 }}>
              {pendingCount > 0
                ? 'Awaiting owner confirmation — instances will be terminated as scheduled'
                : 'All instances within lifecycle limits — no pending actions'
              }
            </Typography>

            {/* List of pending instances */}
            {instances.length > 0 && (
              <>
                <Divider sx={{ mb: 1.5, borderColor: '#90caf9' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {instances.map((inst, idx) => (
                    <Box key={`${inst.instance_id}-${idx}`} sx={{
                      bgcolor: 'rgba(255,255,255,0.6)',
                      borderRadius: 1.5,
                      px: 1.5, py: 0.8,
                      border: '1px solid #90caf9'
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                        {inst.instance_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <AccessTimeIcon sx={{ fontSize: 11, color: '#e53935' }} />
                        <Typography variant="caption" sx={{ color: '#e53935', fontSize: '0.7rem' }}>
                          Deadline: {formatDeadline(inst.deadline_at)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.68rem' }}>
                        {inst.owner_email}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}