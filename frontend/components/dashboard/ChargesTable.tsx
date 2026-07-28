'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box,
  CircularProgress, Alert, TextField, TablePagination, InputAdornment
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SearchIcon from '@mui/icons-material/Search';

interface ChargeItem {
  id: string;
  provider: string;
  icon: string;
  usage: string;
  interval: string;
  amount: string;
  percent: number;
  isUp: boolean;
  projected: string;
}

export default function ChargesTable() {
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับช่องค้นหา และระบบแบ่งหน้า (Pagination)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  useEffect(() => {
    let cancelled = false;

    const fetchCharges = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/charges');
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const data: ChargeItem[] = await res.json();
        if (cancelled) return;

        setCharges(data || []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching charges:", err);
        setError('ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้ ตรวจสอบเซิร์ฟเวอร์');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCharges();

    return () => {
      cancelled = true;
    };
  }, []);

  // ฟังก์ชันกรองข้อมูลตามช่อง Search (ค้นหาจาก Invoice ID หรือ Provider)
  const filteredCharges = charges.filter((item) =>
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ตัดข้อมูลเฉพาะหน้าที่กำลังแสดงอยู่ (10 ตัวต่อหน้า)
  const displayedCharges = filteredCharges.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Recent charges
          </Typography>

          {/* ช่องค้นหาข้อมูล */}
          <TextField
            size="small"
            placeholder="Search ID or Provider..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0); // Reset กลับมาหน้าแรกเมื่อพิมพ์ค้นหา
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 250 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Invoice ID</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Service provider</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Usage</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Interval</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Amount</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Projected cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      กำลังโหลดข้อมูล...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayedCharges.length > 0 ? (
                displayedCharges.map((row, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'inline-block', py: 0.5, borderRadius: 1 }}>
                        {row.id}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <img src={row.icon} alt={row.provider} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{row.provider}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>{row.usage}</TableCell>
                    <TableCell>{row.interval}</TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.amount}</Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                         color: row.isUp ? '#2e7d32' : '#d32f2f'
                        }}>
                          {row.isUp ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                          {row.percent}%
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ color: 'text.secondary' }}>{row.projected}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    ไม่พบข้อมูลประวัติการเรียกเก็บเงิน
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* แถบแบ่งหน้า (Pagination) */}
        <TablePagination
          component="div"
          count={filteredCharges.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </CardContent>
    </Card>
  );
}