'use client';

import React, { useState } from 'react';
import { Card, CardContent, Box, Typography, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, CircularProgress,
  IconButton, Tooltip, TablePagination
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import SearchIcon from '@mui/icons-material/Search';
import { ResourceTableProps, CloudResource } from '@/types/manage';
import ResourceDetailDialog from '@/components/manage/ResourceDetailDialog';

const getStatusStyles = (status?: string) => {
  const normalizedStatus = status?.toUpperCase();
  switch (normalizedStatus) {
    case 'PENDING_SWEEP':
      return {
        bgcolor: '#fff3e0',
        color: '#e65100',
        label: 'PENDING SWEEP',
      };
    case 'ACTIVE':
      return {
        bgcolor: '#e8f5e9',
        color: '#2e7d32',
        label: normalizedStatus,
      };
    default:
      return {
        bgcolor: '#ffebee',
        color: '#c62828',
        label: normalizedStatus || 'UNKNOWN',
      };
  }
};

export default function ResourceTable({
  resources = [],
  loading,
  onScanAndSweep,
  userRole = 'dev',
  onActionSuccess,
}: Readonly<ResourceTableProps>) {
  const [selectedResource, setSelectedResource] = useState<CloudResource | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const handleInspect = (resource: CloudResource) => {
    setSelectedResource(resource);
    setIsInspectOpen(true);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedResources = (resources || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getExpirationText = (deadlineStr?: string) => {
    if (!deadlineStr) return 'Permanent';
    const deadline = new Date(deadlineStr);
    if (Number.isNaN(deadline.getTime())) return 'Permanent';

    if (deadline.getFullYear() === 1 || deadline.getFullYear() === 1970) {
      return 'Permanent';
    }

    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Expired (${Math.abs(diffDays)}d ago)`;
    }
    if (diffDays === 0) {
      return 'Expires today';
    }
    return `${diffDays} days left`;
  };

  const showDepartment = userRole === 'admin' || userRole === 'finops';
  const showActions = userRole === 'admin' || userRole === 'finops' || userRole === 'lead' || userRole === 'dev';
  const canSweep = userRole === 'admin' || userRole === 'finops' || userRole === 'lead';

  const totalCols = 6 + (showDepartment ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
              Active Cloud Resources
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Real-time resource tracking and automated lifecycle management
            </Typography>
          </Box>

          {canSweep && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<RecyclingIcon />}
              onClick={onScanAndSweep}
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
            >
              Trigger Scan & Sweep
            </Button>
          )}
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid #edf2f7', color: 'text.secondary', fontWeight: '700', fontSize: '0.75rem' } }}>
                <TableCell>Resource</TableCell>
                {showDepartment && <TableCell>Department</TableCell>}
                <TableCell>Owner</TableCell>
                <TableCell>Idle Days</TableCell>
                <TableCell>Cost/Day</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires In</TableCell>
                {showActions && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={totalCols} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                      Fetching cloud resources...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedResources.map((res) => {
                  const expText = getExpirationText(res.Deadline?.toString());
                  const statusStyle = getStatusStyles(res.Status);

                  return (
                    <TableRow key={res.ID} sx={{ '&:hover': { bgcolor: '#f7fafc' } }}>
                      <TableCell sx={{ py: 1 }}>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#2d3748' }}>
                          {res.Name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                          {res.ID}
                        </Typography>
                      </TableCell>

                      {showDepartment && (
                        <TableCell sx={{ py: 1 }}>
                          <Box sx={{
                            display: 'inline-block',
                            px: 1, py: 0.2, borderRadius: 1.5, fontSize: '0.68rem', fontWeight: '600',
                            bgcolor: '#e3f2fd', color: '#1976d2'
                          }}>
                            {res.Department || 'Core Infrastructure'}
                          </Box>
                        </TableCell>
                      )}

                      <TableCell sx={{ py: 1 }}>
                        <Box sx={{
                          display: 'inline-block',
                          px: 1, py: 0.2, borderRadius: 1.5, fontSize: '0.68rem', fontWeight: '600',
                          bgcolor: '#f3e5f5', color: '#7b1fa2'
                        }}>
                          {res.Owner}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{ fontWeight: '600', fontSize: '0.78rem' }}>{res.DayIdle}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>days</Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#2e7d32', py: 1 }}>
                        ${res.Costperday.toFixed(2)}
                      </TableCell>

                      <TableCell sx={{ py: 1 }}>
                        <Box sx={{
                          display: 'inline-block',
                          px: 1, py: 0.2, borderRadius: 1.5, fontSize: '0.68rem', fontWeight: 'bold',
                          bgcolor: statusStyle.bgcolor,
                          color: statusStyle.color
                        }}>
                          {statusStyle.label}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 'medium', py: 1, whiteSpace: 'nowrap' }}>
                        <Typography sx={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: expText.includes('Expired') ? '#c62828' : 'text.primary'
                        }}>
                          {expText}
                        </Typography>
                      </TableCell>

                      {showActions && (
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Tooltip title="Inspect Details & Actions">
                            <IconButton
                              size="small"
                              onClick={() => handleInspect(res)}
                              sx={{
                                color: 'primary.main',
                                bgcolor: '#f0f7ff',
                                '&:hover': { bgcolor: '#e0effe' },
                                borderRadius: 1.5,
                              }}
                            >
                              <SearchIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}

              {!(resources?.length) && !loading && (
                <TableRow>
                  <TableCell colSpan={totalCols} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No system resources found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={resources.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            '.MuiTablePagination-toolbar': { minHeight: 36 },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
          }}
        />

        {/* Modal Dialog for Resource Inspection & Actions */}
        <ResourceDetailDialog
          open={isInspectOpen}
          onClose={() => setIsInspectOpen(false)}
          resource={selectedResource}
          userRole={userRole}
          onActionSuccess={onActionSuccess}
        />
      </CardContent>
    </Card>
  );
}