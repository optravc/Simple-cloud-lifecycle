'use client';

import { Box, Typography, TextField, MenuItem, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { AllocationFilterToolbarProps } from '@/types/allocation';


export default function AllocationFilterToolbar({
  selectedDept,
  onDeptChange,
  tagFilter,
  onTagFilterChange,
  onExport,
  disableExport,
}: Readonly<AllocationFilterToolbarProps>) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c', fontSize: '1.2rem', lineHeight: 1.2 }}>
          Cost Allocation & Showback
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.8rem' }}>
          Analyze and allocate cloud costs by department and project
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <TextField
          select
          size="small"
          value={selectedDept}
          onChange={(e) => onDeptChange(e.target.value)}
          sx={{ minWidth: 180, bgcolor: 'white', borderRadius: 2, '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' } }}
        >
          <MenuItem value="All">All Departments</MenuItem>
          <MenuItem value="Core Infrastructure">Core Infrastructure</MenuItem>
          <MenuItem value="Product Engineering">Product Engineering</MenuItem>
          <MenuItem value="Data Science & Analytics">Data Science & Analytics</MenuItem>
          <MenuItem value="Trust & Safety">Trust & Safety</MenuItem>
          <MenuItem value="Finance">Finance</MenuItem>
          <MenuItem value="Executive / C-Level">Executive / C-Level</MenuItem>
          <MenuItem value="FinOps & Cloud Governance">FinOps & Cloud Governance</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
          sx={{ minWidth: 160, bgcolor: 'white', borderRadius: 2, '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' } }}
        >
          <MenuItem value="All">All Tag Status</MenuItem>
          <MenuItem value="Tagged">Tagged</MenuItem>
          <MenuItem value="Untagged">Untagged</MenuItem>
        </TextField>

        <Button 
          variant="contained" 
          size="small"
          disabled={disableExport}
          startIcon={<DownloadIcon sx={{ fontSize: 18 }} />} 
          onClick={onExport}
          sx={{ borderRadius: 2, textTransform: 'none', height: 36, px: 2, fontWeight: 600, fontSize: '0.8rem' }}
        >
          Export Report
        </Button>
      </Box>
    </Box>
  );
}
