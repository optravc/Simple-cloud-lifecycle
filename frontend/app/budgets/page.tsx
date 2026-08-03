'use client';

import React, { useState } from 'react';
import {
  Box, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Typography
} from '@mui/material';
import Sidebar from '@/layouts/sidebar';
import Header from '@/layouts/header';
import BudgetsKpiCards from '@/components/budgets/BudgetsKpiCards';
import ConsumptionProgress from '@/components/budgets/Progress';
import BudgetAllocationChart from '@/components/budgets/BudgetAllocationChart';
import AddIcon from '@mui/icons-material/Add';

const drawerWidth = 260;

interface DepartmentBudget {
  department: string;
  owner: string;
  allocated: number;
  spent: number;
}

export default function BudgetsPage() {
  const [totalBudget, setTotalBudget] = useState<number>(20000);

  const [departments] = useState<DepartmentBudget[]>([
    { department: 'Engineering & R&D', owner: 'Somchai E.', allocated: 10000, spent: 8500 },
    { department: 'Data & AI Platform', owner: 'Phuridis K.', allocated: 6000, spent: 4200 },
    { department: 'Marketing & Analytics', owner: 'Jane S.', allocated: 4000, spent: 3900 },
  ]);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [newTotalBudget, setNewTotalBudget] = useState<string>(totalBudget.toString());

  const totalSpent = departments.reduce((sum, d) => sum + d.spent, 0);
  const remainingBudget = totalBudget - totalSpent;
  const usagePercent = Math.round((totalSpent / totalBudget) * 100);

  const budgetTrend = [{ value: 18000 }, { value: 19000 }, { value: 20000 }, { value: 20000 }];
  const spentTrend = [{ value: 12000 }, { value: 13500 }, { value: 15000 }, { value: 16600 }];
  const remainingTrend = [{ value: 8000 }, { value: 6500 }, { value: 5000 }, { value: 3400 }];

  const handleSaveBudget = () => {
    const val = parseFloat(newTotalBudget);
    if (!isNaN(val) && val > 0) {
      setTotalBudget(val);
    }
    setOpenModal(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: `calc(100% - ${drawerWidth}px)` }}>
        <Header />

        <Box sx={{ p: 4 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                Enterprise Cloud Budgets & Governance
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ควบคุม ติดตาม และพยากรณ์งบประมาณคลาวด์ระดับองค์กร (FinOps Dashboard)
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenModal(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Adjust Global Budget
            </Button>
          </Box>

          {/* เรียกใช้งานผ่าน Component แยก  */}
          <BudgetsKpiCards
            totalBudget={totalBudget}
            budgetTrend={budgetTrend}
            totalSpent={totalSpent}
            usagePercent={usagePercent}
            spentTrend={spentTrend}
            remainingBudget={remainingBudget}
            remainingTrend={remainingTrend}
          />

          {/* Grid Layout ด้านล่าง */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <BudgetAllocationChart departments={departments} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ConsumptionProgress
                usagePercent={usagePercent}
                totalSpent={totalSpent}
                totalBudget={totalBudget}
                departments={departments}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Dialog สำหรับปรับงบประมาณ */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Adjust Enterprise Global Budget</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            กำหนดวงเงินงบประมาณรวมทั้งองค์กรสำหรับเดือนนี้ (USD)
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={newTotalBudget}
            onChange={(e) => setNewTotalBudget(e.target.value)}
            placeholder="Enter global budget"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveBudget} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}