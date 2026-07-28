import React from 'react';
import { Card, CardContent, Box, Typography, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import { CloudResource } from '../../types/cloud';

interface ResourceTableProps {
  resources: CloudResource[];
  loading: boolean;
  onScanAndSweep: () => void;
}
export default function ResourceTable({ resources = [], loading, onScanAndSweep }: ResourceTableProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Active Cloud Resources</Typography>
          <Button
            variant="contained"
            color="warning"
            startIcon={<RecyclingIcon />}
            onClick={onScanAndSweep}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {loading ? 'Loading...' : 'Trigger Scan & Sweep'}
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Instance ID</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Name</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Type</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Idle Days</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Cost/Day</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* เมื่อมีค่า Default แล้ว เราสามารถใช้ .map และ .length ได้อย่างปลอดภัย */}
              {(resources || []).map((res) => (
                <TableRow key={res.ID} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{res.ID}</TableCell>
                  <TableCell>{res.Name}</TableCell>
                  <TableCell>{res.Type}</TableCell>
                  <TableCell>{res.DayIdle} วัน</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>${res.Costperday}</TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-block',
                      px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 'bold',
                      bgcolor: res.Status === 'active' ? '#e8f5e9' : '#ffebee',
                      color: res.Status === 'active' ? '#2e7d32' : '#c62828'
                    }}>
                      {res.Status.toUpperCase()}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {/* เช็กความยาว Array ได้อย่างปลอดภัย */}
              {!(resources?.length) && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    ไม่พบข้อมูลทรัพยากรระบบ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}