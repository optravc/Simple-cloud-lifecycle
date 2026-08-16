'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Grid, Button, Typography, CircularProgress, Alert, Tabs, Tab
} from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import BudgetsKpiCards from '@/components/budgets/BudgetsKpiCards';
import ConsumptionProgress from '@/components/budgets/Progress';
import BudgetAllocationChart from '@/components/budgets/BudgetAllocationChart';
import BudgetGovernanceToolbar from '@/components/budgets/BudgetGovernanceToolbar';
import CostCentersGovernanceTable from '@/components/budgets/CostCentersGovernanceTable';
import AdjustBudgetModal from '@/components/budgets/AdjustBudgetModal';
import ActionStatusModal from '@/components/common/ActionStatusModal';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { getBudgets, updateBudget } from '@/lib/api';
import { getUserInfo } from '@/lib/auth';
import { UserRole } from '@/types/auth';
import { BudgetsData } from '@/types/budget';

const drawerWidth = 260;

export default function BudgetsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('dev');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BudgetsData | null>(null);

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchBudgetsData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBudgets();
      setData(res);
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Failed to load budgets and governance data from API.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const info = getUserInfo();
      if (info) {
        setUserRole(info.role);
        if (info.role === 'dev') {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/login');
        return;
      }
      await fetchBudgetsData();
    };

    checkAuthAndLoad();
  }, [router, fetchBudgetsData]);

  const handleOpenAdjustModal = (deptId?: number) => {
    if (!data) return;
    if (deptId !== undefined) {
      const dept = data.departments.find(d => d.id === deptId);
      if (dept) {
        setSelectedDeptId(deptId);
        setNewBudgetAmount(dept.allocated.toString());
      }
    } else {
      setSelectedDeptId('');
      setNewBudgetAmount('');
    }
    setOpenModal(true);
  };

  const handleDeptSelectChange = (id: number) => {
    if (!data) return;
    setSelectedDeptId(id);
    const dept = data.departments.find(d => d.id === id);
    if (dept) {
      setNewBudgetAmount(dept.allocated.toString());
    }
  };

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

  const handleSaveBudget = async () => {
    if (selectedDeptId === '' || !newBudgetAmount) return;
    const val = Number.parseFloat(newBudgetAmount);
    if (Number.isNaN(val) || val < 0) {
      setModalState({
        open: true,
        type: 'error',
        title: 'Invalid Budget Value',
        message: 'Please enter a valid positive budget amount.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await updateBudget(selectedDeptId, val);
      await fetchBudgetsData();
      setOpenModal(false);
      setModalState({
        open: true,
        type: 'success',
        title: 'Budget Allocation Saved',
        message: `Department budget has been updated to $${val.toLocaleString()} successfully.`,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update department budget.';
      setModalState({
        open: true,
        type: 'error',
        title: 'Update Failed',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered departments for Tab 2
  const filteredDepartments = (data?.departments || []).filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dept.owner?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canAdjust = userRole === 'admin' || userRole === 'finance' || userRole === 'finops';

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={50} />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>;
    }

    if (data) {
      return (
        <>
          {/* TAB 1: Budget Overview & Allocation */}
          {tabIndex === 0 && (
            <Box>
              <BudgetsKpiCards
                totalBudget={data.totalBudget}
                budgetTrend={data.budgetTrend}
                totalSpent={data.totalSpent}
                usagePercent={data.usagePercent}
                spentTrend={data.spentTrend}
                remainingBudget={data.remainingBudget}
                remainingTrend={data.remainingTrend}
                forecastedSpend={data.forecastedSpend}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7.5 }}>
                  <BudgetAllocationChart departments={data.departments} />
                </Grid>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <ConsumptionProgress
                    usagePercent={data.usagePercent}
                    totalSpent={data.totalSpent}
                    totalBudget={data.totalBudget}
                    departments={data.departments}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* TAB 2: Cost Centers Detailed Governance */}
          {tabIndex === 1 && (
            <Box>
              <BudgetGovernanceToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                userRole={userRole}
                onOpenAdjustModal={() => handleOpenAdjustModal()}
              />

              <CostCentersGovernanceTable
                departments={filteredDepartments}
                totalCount={data.departments.length}
                filteredCount={filteredDepartments.length}
                page={page}
                rowsPerPage={rowsPerPage}
                userRole={userRole}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                onOpenAdjustModal={handleOpenAdjustModal}
              />
            </Box>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 2.5 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '1.25rem' }}>
                Enterprise Cloud Budgets & Governance
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.8rem' }}>
                Control, monitor, and forecast enterprise cloud budgets (FinOps Dashboard)
              </Typography>
            </Box>
            {canAdjust && (
              <Button
                variant="contained"
                size="small"
                onClick={() => handleOpenAdjustModal()}
                sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' }, height: 36, fontSize: '0.82rem', px: 2 }}
              >
                Adjust Budgets & Alerts
              </Button>
            )}
          </Box>

          {/* Navigation Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabIndex} 
              onChange={(_, newValue) => setTabIndex(newValue)}
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 'bold', fontSize: '0.88rem', minHeight: 44 },
                '& .Mui-selected': { color: '#1976d2' }
              }}
            >
              <Tab icon={<AssessmentIcon fontSize="small" />} iconPosition="start" label="Budget Overview & Allocation" />
              <Tab icon={<AccountBalanceWalletIcon fontSize="small" />} iconPosition="start" label={`Cost Centers Governance (${data?.departments.length || 0})`} />
            </Tabs>
          </Box>
 
          {renderContent()}
        </Box>
      </Box>

      {/* Adjust Budget Dialog Component */}
      <AdjustBudgetModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        departments={data?.departments || []}
        selectedDeptId={selectedDeptId}
        onDeptSelectChange={handleDeptSelectChange}
        newBudgetAmount={newBudgetAmount}
        onBudgetAmountChange={setNewBudgetAmount}
        onSave={handleSaveBudget}
        isSubmitting={isSubmitting}
      />

      {/* Shared Action Status Feedback Modal */}
      <ActionStatusModal
        open={modalState.open}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
}