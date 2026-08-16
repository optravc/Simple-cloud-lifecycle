'use client';

import {
  Card, CardContent, Grid, TextField, InputAdornment, FormControl, Select, MenuItem, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import { BudgetGovernanceToolbarProps } from '@/types/budget';

export default function BudgetGovernanceToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  userRole,
  onOpenAdjustModal,
}: Readonly<BudgetGovernanceToolbarProps>) {
  const canAdjust = userRole === 'admin' || userRole === 'finance' || userRole === 'finops';

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3, mb: 2 }}>
      <CardContent sx={{ p: '14px 18px !important' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search department or lead name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: '20px' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 4 }}>
            <FormControl fullWidth size="small">
              <Select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: 'text.secondary', fontSize: '18px' }} />
                  </InputAdornment>
                }
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              >
                <MenuItem value="all">All Budget Statuses</MenuItem>
                <MenuItem value="Critical" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Critical / Exceeded</MenuItem>
                <MenuItem value="Warning" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>Warning (Near Limit)</MenuItem>
                <MenuItem value="OK" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>OK (Within Limit)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 2, md: 3 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {canAdjust && (
              <Button
                variant="contained"
                size="small"
                onClick={onOpenAdjustModal}
                startIcon={<EditIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' }, height: 38, px: 2, fontWeight: 'bold' }}
              >
                Adjust Budget
              </Button>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
