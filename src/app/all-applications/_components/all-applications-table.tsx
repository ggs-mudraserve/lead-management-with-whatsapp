'use client';

import React, { useState, useMemo } from 'react';
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
import { styled, keyframes } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
import {
    getBankApplications,
    BankApplicationRow,
    BankApplicationFilters,
    PaginatedBankApplicationsResponse
} from '@/lib/supabase/queries/all-applications';

type Order = 'asc' | 'desc';

// Animation keyframes
const slideInFromBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Styled components
const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  overflow: 'hidden',
  animation: `${slideInFromBottom} 0.8s ease-out`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.06)',
  },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: '#0f172a !important',
  '& .MuiTableCell-root': {
    background: 'transparent !important',
    backgroundColor: 'transparent !important',
    color: 'white !important',
    fontWeight: '700 !important',
    fontSize: '0.9rem !important',
    borderBottom: 'none !important',
    padding: `${theme.spacing(2)} !important`,
    '&:first-of-type': {
      borderTopLeftRadius: `${theme.spacing(2)} !important`,
    },
    '&:last-of-type': {
      borderTopRightRadius: `${theme.spacing(2)} !important`,
    },
  },
  '& .MuiTableSortLabel-root': {
    color: 'white !important',
    '&:hover': {
      color: 'rgba(255, 255, 255, 0.8) !important',
    },
    '&.Mui-active': {
      color: 'white !important',
    },
  },
  '& .MuiTableSortLabel-icon': {
    color: 'white !important',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(226, 232, 240, 0.3)',
    transform: 'scale(1.01)',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1)',
  },
  '& .MuiTableCell-root': {
    borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
    padding: theme.spacing(2),
    transition: 'all 0.3s ease',
    color: '#0f172a',
  },
}));

const StyledTableCell = styled(TableCell)(() => ({
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const ModernIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  color: '#475569',
  '&:hover': {
    backgroundColor: '#0ea5e9',
    color: 'white',
    transform: 'scale(1.1) rotate(5deg)',
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
  },
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 600,
  fontSize: '0.75rem',
  animation: `${scaleIn} 0.5s ease-out`,
}));

const getStatusColor = (stage: string) => {
  const statusColors: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'default' } = {
    'Sent to Bank': 'success',
    'Under Review': 'warning',
    'New': 'info',
    'documents_incomplete': 'error',
  };
  return statusColors[stage] || 'default';
};

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
  const { profile, loading } = useAuth();
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
    // Add optimizations to prevent hanging
    enabled: !loading && !!profile, // Only run when auth is ready
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry auth errors or validation errors
      if (error.message.includes('not authenticated') || error.message.includes('invalid user ID')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
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
    <ModernPaper>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader sx={{ minWidth: 500 }} aria-label="all bank applications table">
          <StyledTableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  sortDirection={orderBy === headCell.id ? order : false}
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
          </StyledTableHead>
          <TableBody>
            {isLoading && applications.length === 0 ? (
                <TableRow><TableCell colSpan={headCells.length} align="center"><CircularProgress /></TableCell></TableRow>
            ) : applications.length > 0 ? (
              applications.map((row) => {
                return (
                  <StyledTableRow key={row.id}>
                    <StyledTableCell component="th" scope="row">
                      <Fade in={true} timeout={500}>
                        <StatusChip 
                          label={row.lead_segment ?? '-'} 
                          size="small" 
                          variant="outlined"
                        />
                      </Fade>
                    </StyledTableCell>
                    <StyledTableCell>{row.lead_first_name ?? '-'}</StyledTableCell>
                    <StyledTableCell>{row.lead_last_name ?? '-'}</StyledTableCell>
                    <StyledTableCell align="right">
                      <Box sx={{ fontWeight: 600, color: '#059669' }}>
                        {row.approved_amount?.toLocaleString() ?? '-'}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box sx={{ fontWeight: 500, color: '#475569' }}>
                        {row.bank_name ?? '-'}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Zoom in={true} timeout={600}>
                        <StatusChip 
                          label={row.lead_stage ?? '-'} 
                          color={getStatusColor(row.lead_stage ?? '')}
                          size="small"
                        />
                      </Zoom>
                    </StyledTableCell>
                    <StyledTableCell>{row.login_date ? new Date(row.login_date).toLocaleDateString() : '-'}</StyledTableCell>
                    <StyledTableCell>{row.lead_owner_name ?? '-'}</StyledTableCell>
                    <StyledTableCell>{row.team_name ?? '-'}</StyledTableCell>
                    <StyledTableCell align="center">
                      <Link href={`/bank-applications/${row.id}/edit`} passHref target="_blank" rel="noopener noreferrer">
                        <ModernIconButton size="small" aria-label="edit application">
                          <EditIcon fontSize="small" />
                        </ModernIconButton>
                      </Link>
                    </StyledTableCell>
                  </StyledTableRow>
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
    </ModernPaper>
  );
}