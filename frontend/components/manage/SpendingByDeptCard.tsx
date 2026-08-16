'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, CardContent, Typography, Box,
  FormControl, InputLabel, Select, MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  PieChart, Pie, ResponsiveContainer, Tooltip
} from 'recharts';
import { SpendingByDeptCardProps } from '@/types/manage';

const PIE_COLORS = ['#2065D1', '#826af9', '#FFAB00', '#2ea043', '#d32f2f', '#00bcd4', '#9c27b0'];

const DEPARTMENT_COLORS: Record<string, string> = {
  'Core Infrastructure': '#2065D1',
  'Product Engineering': '#826af9',
  'Data Science & Analytics': '#FFAB00',
  'Trust & Safety': '#2ea043',
  'Finance': '#d32f2f',
  'Executive / C-Level': '#00bcd4',
  'FinOps & Cloud Governance': '#9c27b0',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
}

// Beautiful Custom tooltip
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <Box sx={{
        bgcolor: 'white', border: '1px solid #e0e0e0',
        borderRadius: 2, px: 2, py: 1,
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#212b36' }}>
          {payload[0].name}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#637381' }}>
          ${Number(payload[0].value).toFixed(4)}/day
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function SpendingByDeptCard({
   resources }
   :Readonly<SpendingByDeptCardProps>) {
  const [viewMode, setViewMode] = useState<'dept' | 'team'>('dept');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedTeam, setSelectedTeam] = useState<string>('All');

const getTeamSpendingTitle = (team: string) => {
  return team === 'All' ? 'Spending by Teams' : `Spending — ${team}`;
};


  // Extract unique departments from active resources
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    resources.forEach((r) => {
      if (r.Department && r.Department !== 'Unknown') deptSet.add(r.Department);
    });
    return Array.from(deptSet).sort((a, b) => a.localeCompare(b));
  }, [resources]);

  // Extract teams filtered by selected department
  const filteredTeams = useMemo(() => {
    const teamSet = new Set<string>();
    resources.forEach((r) => {
      if (r.Owner && r.Owner !== 'Unknown') {
        if (selectedDeptFilter === 'All' || r.Department === selectedDeptFilter) {
          teamSet.add(r.Owner);
        }
      }
    });
    return Array.from(teamSet).sort((a, b) => a.localeCompare(b));
  }, [resources, selectedDeptFilter]);

  // Handle department filter change -> reset team filter to All
  const handleDeptFilterChange = (dept: string) => {
    setSelectedDeptFilter(dept);
    setSelectedTeam('All');
  };

  // Calculate pie chart data based on viewMode (Department vs Team)
  const pieData = useMemo(() => {
    const costMap: Record<string, number> = {};

    if (viewMode === 'dept') {
      // By Department mode: show all departments overview cleanly
      resources.forEach((r) => {
        const dept = r.Department || 'Unknown';
        costMap[dept] = (costMap[dept] || 0) + (r.Costperday ?? 0);
      });
    } else {
      // By Team mode: filter by selected department & selected team
      let filtered = resources;
      if (selectedDeptFilter !== 'All') {
        filtered = filtered.filter((r) => r.Department === selectedDeptFilter);
      }
      if (selectedTeam !== 'All') {
        filtered = filtered.filter((r) => r.Owner === selectedTeam);
      }

      filtered.forEach((r) => {
        const team = r.Owner || 'Unknown';
        costMap[team] = (costMap[team] || 0) + (r.Costperday ?? 0);
      });
    }

    return Object.entries(costMap)
      .map(([name, value]) => ({ name, value: Number.parseFloat(value.toFixed(4)) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        fill: viewMode === 'dept' ? (DEPARTMENT_COLORS[item.name] || PIE_COLORS[index % PIE_COLORS.length]) : PIE_COLORS[index % PIE_COLORS.length]
      }));
  }, [resources, viewMode, selectedDeptFilter, selectedTeam]);

  const totalCost = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData]
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #919eab3d',
        borderRadius: 4,
        boxShadow: '0 12px 24px -4px rgb(145 158 171 / 12%)',
        bgcolor: '#ffffff',
      }}
    >
      <CardContent sx={{ p: '24px !important' }}>

        {/* View Mode Switcher Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, pb: 1.5, borderBottom: '1px solid #f0f0f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', bgcolor: '#f4f6f8', borderRadius: 2, p: 0.5 }}>
              <Box
                onClick={() => { setViewMode('dept'); setSelectedDeptFilter('All'); }}
                sx={{
                  px: 1.5, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.78rem',
                  bgcolor: viewMode === 'dept' ? 'white' : 'transparent',
                  color: viewMode === 'dept' ? '#2065D1' : '#637381',
                  boxShadow: viewMode === 'dept' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: '0.2s'
                }}
              >
                 Department
              </Box>
              <Box
                onClick={() => setViewMode('team')}
                sx={{
                  px: 1.5, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.78rem',
                  bgcolor: viewMode === 'team' ? 'white' : 'transparent',
                  color: viewMode === 'team' ? '#2065D1' : '#637381',
                  boxShadow: viewMode === 'team' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: '0.2s'
                }}
              >
               By Team
              </Box>
            </Box>
          </Box>

          {/* Show Department & Team Filter controls ONLY in "By Team" Mode */}
          {viewMode === 'team' && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ flexGrow: 1, minWidth: 130 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Department</InputLabel>
                <Select
                  value={selectedDeptFilter}
                  label="Department"
                  onChange={(e: SelectChangeEvent) => handleDeptFilterChange(e.target.value)}
                  sx={{ fontSize: '0.8rem', borderRadius: 2, bgcolor: 'white' }}
                >
                  <MenuItem value="All">All Depts</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ flexGrow: 1, minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Team</InputLabel>
                <Select
                  value={selectedTeam}
                  label="Team"
                  onChange={(e: SelectChangeEvent) => setSelectedTeam(e.target.value)}
                  sx={{ fontSize: '0.8rem', borderRadius: 2, bgcolor: 'white' }}
                >
                  <MenuItem value="All">All Teams</MenuItem>
                  {filteredTeams.map((team) => (
                    <MenuItem key={team} value={team}>{team}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        {/* Title Subheader */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', fontSize: '0.95rem' }}>
  {getTeamSpendingTitle(selectedTeam)}
</Typography>
          <Typography variant="body2" sx={{ color: '#637381', fontSize: '0.8rem' }}>
            {viewMode === 'dept' ? 'Overview cost share across 7 main departments' : 'Deep-dive cost breakdown by owner team'}
          </Typography>
        </Box>

        {/* Chart or Empty State */}
        {pieData.length > 0 ? (
          <>
            {/* Total */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Total Cost/Day</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2065D1' }}>
                ${totalCost.toFixed(4)}
              </Typography>
            </Box>

            {/* Donut Chart */}
            <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1 }}>
              {pieData.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 8, height: 8, borderRadius: '50%',
                      bgcolor: item.fill,
                      flexShrink: 0
                    }} />
                    <Typography variant="caption" sx={{ color: '#637381', fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#212b36' }}>
                    ${item.value.toFixed(4)}/day
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <Box sx={{
            height: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#637381', fontSize: '0.85rem', flexDirection: 'column', gap: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              {resources.length === 0
                ? 'No Active Resources found in the system'
                : 'No cost data available for the selected team'}
            </Typography>
          </Box>
        )}

      </CardContent>
    </Card>
  );
}
