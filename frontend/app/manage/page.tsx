'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid, Alert, Tabs, Tab } from '@mui/material';
import { getUserInfo, UserRole } from '@/lib/auth';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import { CloudResource, SweepResponse, ScanDryRunResponse, PreviewData, TeamItem, DeptItem } from '@/types/manage';
import ManageHeaderToolbar from '@/components/manage/ManageHeaderToolbar';
import ManageKpiCards from '@/components/manage/ManageKpiCards';
import ResourceTable from '@/components/manage/ResourceTable';
import TerminatedHistoryTable from '@/components/manage/TerminatedHistoryTable';
import LifecycleStatusCard from '@/components/manage/LifecycleStatusCard';
import SpendingByDeptCard from '@/components/manage/SpendingByDeptCard';
import ConfirmSweepDialog from '@/components/manage/Dialog/ConfirmSweepDialog';
import LaunchServerDialog from '@/components/manage/Dialog/LaunchServerDialog';
import CreateTeamDialog from '@/components/manage/Dialog/CreateTeamDialog';
import { API_BASE } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const IDLE_THRESHOLD_DAYS = 14;
const drawerWidth = 260;

export default function ManagePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('dev');
  const [userDept, setUserDept] = useState<string>('');
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [actualSavings, setActualSavings] = useState<number>(0);
  const [sweptCount, setSweptCount] = useState<number>(0);
  const [potentialSavings, setPotentialSavings] = useState<number>(0);
  const [sweptNames, setSweptNames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false); // Separate loading state for dry run scan
  const [error, setError] = useState<string | null>(null);
  const [sweepSuccess, setSweepSuccess] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [manageTab, setManageTab] = useState<number>(0);

  // State to control Dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  // Preview data from Dry Run scan
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [idleThreshold, setIdleThreshold] = useState<number>(14);

  // State สำหรับ Dialog สร้างเครื่องใหม่
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [isTeamOpen, setIsTeamOpen] = useState<boolean>(false);
  const [teamCreateLoading, setTeamCreateLoading] = useState<boolean>(false);
  const [departments, setDepartments] = useState<DeptItem[]>([]);

  // Filter only active resources (excludes Terminated ones)
  const activeResources = resources.filter(
    (res) => res.Status !== 'TERMINATED'
  );
  // Filter only currently running resources for KPI count
  const runningResources = resources.filter(
    (res) => res.Status !== 'TERMINATED' && res.Status !== 'STOPPED'
  );
  const activeCount = runningResources.length;

  // Dynamically calculate potential savings based on selected idleThreshold dropdown
  const calculatedPotentialSavings = useEffect !== undefined ? (
    activeResources.reduce((acc, res) => {
      const name = (res.Name || '').toLowerCase();
      const env = (res.Environment || '').toLowerCase();
      if (env === 'permanent' || name.includes('app-server') || name.includes('scl-sandbox')) {
        return acc;
      }
      if (res.DayIdle >= idleThreshold) {
        return acc + (res.Costperday || 0.25);
      }
      return acc;
    }, 0)
  ) : potentialSavings;




  useEffect(() => {
    let cancelled = false;

    const loadResources = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/resources`);
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data: CloudResource[] = await res.json();
        if (cancelled) return;

        setResources(data || []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching resources:', err);
        const errMsg = err instanceof Error ? err.message : 'Check backend Go server port';
        setError(errMsg);
      }
    };

    const loadTeams = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/teams`);
        if (res.ok) {
          const data: TeamItem[] = await res.json();
          if (cancelled) return;
          setTeams(data || []);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };

    const loadDepartments = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/departments`);
        if (res.ok) {
          const data: DeptItem[] = await res.json();
          if (cancelled) return;
          if (data && data.length > 0) {
            setDepartments(data);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
      if (!cancelled) {
        setDepartments([
          { id: 1, name: 'Core Infrastructure' },
          { id: 2, name: 'Product Engineering' },
          { id: 3, name: 'Data Science & Analytics' },
          { id: 4, name: 'Trust & Safety' },
          { id: 5, name: 'Finance' },
          { id: 6, name: 'Executive / C-Level' },
          { id: 7, name: 'FinOps & Cloud Governance' },
        ]);
      }
    };

    const loadSavedSummary = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/resources/saved-summary`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setActualSavings(data.actual_savings_daily ?? data.actual_savings ?? 0);
          setSweptCount(data.swept_count ?? 0);
          setPotentialSavings(data.potential_savings_daily ?? data.potential_savings ?? 0);
        }
      } catch (err) {
        console.error('Error fetching saved summary:', err);
      }
    };

    const loadSettings = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.idle_threshold_days) {
            setIdleThreshold(data.idle_threshold_days);
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    const checkAuthAndLoad = async () => {
      const info = getUserInfo();
      if (!info) {
        router.push('/login');
        return;
      }
      if (info.role !== 'admin' && info.role !== 'finops' && info.role !== 'lead' && info.role !== 'dev') {
        router.push('/dashboard');
        return;
      }
      setUserRole(info.role);
      if (info.department) setUserDept(info.department);
      setIsAuthorized(true);

      loadResources();
      loadTeams();
      loadDepartments();
      loadSettings();
      await loadSavedSummary();
    };

    checkAuthAndLoad();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  const handleThresholdChange = async (newDays: number) => {
    setIdleThreshold(newDays);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/settings/idle-threshold`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idle_threshold_days: newDays }),
      });
      if (res.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error updating threshold:', err);
    }
  };

  // Step 1: Dry Run — call /api/scan to preview before opening Dialog
  const handleTriggerScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE}/scan?threshold=${idleThreshold}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data: ScanDryRunResponse = await res.json();

      // Save preview data and open Dialog
      setPreviewData({
        items_to_sweep: data.items_to_sweep,
        potential_savings: data.potential_savings,
        instances: data.instances ?? [],
        threshold_days: data.threshold_days ?? idleThreshold,
      });
      setIsConfirmOpen(true);
    } catch (err) {
      console.error('Error running dry scan:', err);
      setError('Unable to connect to the backend. Please check the server.');
    } finally {
      setScanning(false);
    }
  };

  // Step 2: Real Sweep — call /api/sweep after user confirmation
  const handleScanAndSweep = async (selections: {
    instance_id: string;
    create_ami: boolean;
    ami_name: string;
    retain_ebs: boolean;
  }[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE}/sweep`, {
        method: 'POST',
        body: JSON.stringify({ selections }),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data: SweepResponse = await res.json();

      setSweptNames(data.swept_details ?? []);
      setSweepSuccess((prev) => !prev);
      setRefreshTrigger((prev) => prev + 1);
      setIsConfirmOpen(false);
      setPreviewData(null);
    } catch (err) {
      console.error('Error running scan and sweep:', err);
      setError('Check backend Go server port');
      setIsConfirmOpen(false);
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (payload: {
    name: string;
    instance_type: string;
    environment: string;
    lease_days: number;
    team: string;
    description?: string;
  }) => {
    setCreateLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/resources/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: payload.name,
          instance_type: payload.instance_type,
          environment: payload.environment,
          lease_days: payload.lease_days,
          team: payload.team,
          description: payload.description || '',
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error: ${res.status}`);
      }

      setIsCreateOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error creating server:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to create server';
      setError(errMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateTeam = async (payload: {
    team_name: string;
    contact_email: string;
    department_id: number;
  }) => {
    setTeamCreateLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/teams/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_name: payload.team_name,
          contact_email: payload.contact_email,
          department_id: payload.department_id
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error: ${res.status}`);
      }

      setIsTeamOpen(false);
      
      // ดึงรายชื่อทีมใหม่เพื่ออัปเดต dropdown
      const loadTeams = async () => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/teams`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data: TeamItem[] = await res.json();
          setTeams(data || []);
        }
      };
      await loadTeams();
    } catch (err) {
      console.error('Error creating team:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to create team';
      setError(errMsg);
    } finally {
      setTeamCreateLoading(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 2.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
              {error}
            </Alert>
          )}

          {sweepSuccess && sweptNames.length > 0 && (
            <Alert severity="success" onClose={() => setSweepSuccess(false)} sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
              Anomalies found and instances cleaned up successfully: {sweptNames.join(', ')}
            </Alert>
          )}

          {sweepSuccess && sweptNames.length === 0 && (
            <Alert severity="info" onClose={() => setSweepSuccess(false)} sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
              Scan complete — no instances found Idle for more than {IDLE_THRESHOLD_DAYS} days
            </Alert>
          )}

          <ManageHeaderToolbar
            userRole={userRole}
            userDept={userDept}
            onOpenCreateTeam={() => setIsTeamOpen(true)}
            onOpenLaunchServer={() => setIsCreateOpen(true)}
          />

          <ManageKpiCards
            activeCount={activeCount}
            potentialSavings={calculatedPotentialSavings}
            actualSavings={actualSavings}
            sweptCount={sweptCount}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={manageTab} onChange={(_, val) => setManageTab(val)}>
              <Tab label={` Active Resources (${activeResources.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
              <Tab label=" Terminated History" sx={{ fontWeight: 700, textTransform: 'none' }} />
            </Tabs>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              {manageTab === 0 ? (
                <ResourceTable
                  resources={activeResources}
                  loading={scanning || loading}
                  onScanAndSweep={handleTriggerScan}
                  userRole={userRole}
                  onActionSuccess={() => setRefreshTrigger((prev) => prev + 1)}
                  idleThreshold={idleThreshold}
                  onChangeThreshold={handleThresholdChange}
                />
              ) : (
                <TerminatedHistoryTable />
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <SpendingByDeptCard resources={resources} />
                <LifecycleStatusCard />
              </Box>
            </Grid>


          </Grid>
        </Box>
      </Box>

      {/* Dialog showing preview + confirmation form */}
      <ConfirmSweepDialog
        open={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setPreviewData(null);
        }}
        onConfirm={handleScanAndSweep}
        loading={loading}
        previewData={previewData}
        resources={resources}
        idleThreshold={idleThreshold}
      />

      {/* Launch Server Modal */}
      <LaunchServerDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        userRole={userRole}
        teams={teams}
        onLaunch={handleCreateServer}
        loading={createLoading}
        onAddTeamClick={() => setIsTeamOpen(true)}
      />

      {/* Create Team Modal (Admin Only) */}
      <CreateTeamDialog
        open={isTeamOpen}
        onClose={() => setIsTeamOpen(false)}
        departments={departments}
        onCreate={handleCreateTeam}
        loading={teamCreateLoading}
      />

    </Box>
  );
}