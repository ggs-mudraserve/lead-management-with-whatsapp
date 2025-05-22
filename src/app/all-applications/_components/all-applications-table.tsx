'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import TablePagination from '@mui/material/TablePagination';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
    getBankApplications,
    BankApplicationRow,
    BankApplicationFilters,
    PaginatedBankApplicationsResponse
} from '@/lib/supabase/queries/all-applications';

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof BankApplicationRow | 'actions';
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'lead_segment', label: 'Segment', numeric: false, sortable: true },
  { id: 'lead_first_name', label: 'First Name', numeric: false, sortable: true },
  { id: 'lead_last_name', label: 'Last Name', numeric: false, sortable: true },
  { id: 'approved_amount', label: 'Approved Amount', numeric: true, sortable: true },
  { id: 'bank_name', label: 'Bank Name', numeric: false, sortable: true },
  { id: 'lead_stage', label: 'Lead Stage', numeric: false, sortable: true },
  { id: 'login_date', label: 'Login Date', numeric: false, sortable: true },
  { id: 'lead_owner_name', label: 'Lead Owner', numeric: false, sortable: true },
  { id: 'team_name', label: 'Team', numeric: false, sortable: true },
  { id: 'actions', label: 'Actions', numeric: false, sortable: false },
];

interface AllApplicationsTableProps {
  filters: Omit<BankApplicationFilters, 'page' | 'rowsPerPage' | 'sortColumn' | 'sortDirection'>;
}

export function AllApplicationsTable({ filters }: AllApplicationsTableProps) {
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof BankApplicationRow>('login_date');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Create query key for data
  const dataQueryKey = useMemo(() => {
    return ['bankApplicationsData', { ...filters, page, rowsPerPage, sortColumn: orderBy, sortDirection: order, userRole: profile?.role }];
  }, [filters, page, rowsPerPage, orderBy, order, profile?.role]);

  // Fetch applications with pagination - filtering is now handled at the database level
  const { data: response, isLoading, isError, error } = useQuery<PaginatedBankApplicationsResponse, Error>({
    queryKey: dataQueryKey,
    queryFn: async () => {
      // Prepare filters for the API call
      const queryFilters: BankApplicationFilters = {
        ...filters,
        page,
        rowsPerPage,
        sortColumn: orderBy,
        sortDirection: order,
      };

      // Get applications from the server - filtering for NULL lead owners is now handled in the database function
      const result = await getBankApplications(queryFilters);

      // Return the result directly - no client-side filtering needed
      return result;
    },
    placeholderData: (previousData) => previousData,
  });

  // Use the filtered data directly
  const applications = response?.data ?? [];

  const handleRequestSort = (property: keyof BankApplicationRow) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log(`Changing page from ${page} to ${newPage}, total count: ${response?.count ?? 0}`);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
        </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Error fetching applications: {error?.message}</Alert>;
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader sx={{ minWidth: 500 }} aria-label="all bank applications table">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ fontWeight: 'bold' }}
                >
                  {headCell.sortable ? (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id as keyof BankApplicationRow)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && applications.length === 0 ? (
                <TableRow><TableCell colSpan={headCells.length} align="center"><CircularProgress /></TableCell></TableRow>
            ) : applications.length > 0 ? (
              applications.map((row) => {
                return (
                  <TableRow
                    hover
                    key={row.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">{row.lead_segment ?? '-'}</TableCell>
                    <TableCell>{row.lead_first_name ?? '-'}</TableCell>
                    <TableCell>{row.lead_last_name ?? '-'}</TableCell>
                    <TableCell align="right">{row.approved_amount?.toLocaleString() ?? '-'}</TableCell>
                    <TableCell>{row.bank_name ?? '-'}</TableCell>
                    <TableCell>{row.lead_stage ?? '-'}</TableCell>
                    <TableCell>{row.login_date ? new Date(row.login_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{row.lead_owner_name ?? '-'}</TableCell>
                    <TableCell>{row.team_name ?? '-'}</TableCell>
                    <TableCell align="center">
                      <Link href={`/bank-applications/${row.id}/edit`} passHref target="_blank" rel="noopener noreferrer">
                        <IconButton size="small" aria-label="edit application">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center">
                  {isLoading ? 'Loading...' : 'No applications found matching the criteria.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={response?.count ?? 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}