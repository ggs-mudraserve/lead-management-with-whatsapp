'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

// MUI Imports
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import { styled, keyframes } from '@mui/material/styles';
import Fade from '@mui/material/Fade';

import { useAuth } from '@/context/AuthContext';
import { 
  getAgentAnalysisData, 
  calculateAgentAnalysisSummary, 
  calculateSegmentAnalysis,
  getDefaultDateRange 
} from '@/lib/supabase/queries/agent-analysis';
import { 
  AgentAnalysisData, 
  AgentAnalysisFilters,
  Database
} from '@/lib/supabase/database.types';
import {
  getActiveLeadOwners,
  segmentOptions,
  UserOption
} from '@/lib/supabase/queries/filters';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
const ModernContainer = styled(Container)(({ theme }) => ({
  background: '#f8fafc',
  minHeight: '100vh',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

const FilterSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  animation: `${fadeInUp} 0.8s ease-out 0.2s both`,
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(3),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.06)',
  },
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  overflow: 'hidden',
  animation: `${fadeInUp} 0.8s ease-out`,
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
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

const SummaryCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  transition: 'all 0.3s ease',
  animation: `${fadeInUp} 0.8s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 25px rgba(0, 0, 0, 0.15)',
  },
}));


export default function AgentAnalysisPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  // Default date range (last 6 months)
  const defaultDateRange = getDefaultDateRange();

  // Pagination and sorting state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof AgentAnalysisData>('profit_loss');

  // Filter state
  const [filters, setFilters] = useState<AgentAnalysisFilters>({
    startMonth: defaultDateRange.startMonth,
    endMonth: defaultDateRange.endMonth,
    segment: undefined,
    agentId: undefined,
  });

  // Fetch agents for filter
  const { data: agentOptions, isLoading: isLoadingAgents } = useQuery<UserOption[], Error>({
    queryKey: ['activeLeadOwners'],
    queryFn: getActiveLeadOwners,
  });

  // Fetch agent analysis data
  const { data: analysisData, isLoading: isLoadingAnalysis, isError, error } = useQuery<AgentAnalysisData[], Error>({
    queryKey: ['agentAnalysis', filters],
    queryFn: () => getAgentAnalysisData(filters),
    enabled: true,
    refetchOnWindowFocus: false,
  });

  // Calculate summary data
  const summaryData = useMemo(() => {
    return calculateAgentAnalysisSummary(analysisData || []);
  }, [analysisData]);

  // Calculate segment analysis
  const segmentData = useMemo(() => {
    return calculateSegmentAnalysis(analysisData || []);
  }, [analysisData]);

  // Apply client-side sorting and pagination
  const sortedData = useMemo(() => {
    if (!analysisData) return [];

    const sortableData = [...analysisData];
    return sortableData.sort((a, b) => {
      const valueA = a[orderBy];
      const valueB = b[orderBy];

      if (valueA === null) return order === 'asc' ? -1 : 1;
      if (valueB === null) return order === 'asc' ? 1 : -1;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return order === 'asc' ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [analysisData, orderBy, order]);

  const paginatedData = useMemo(() => {
    return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  // Event handlers
  const handleSegmentChange = (event: SelectChangeEvent<Database["public"]["Enums"]["segment_type"]>) => {
    setFilters(prev => ({
      ...prev,
      segment: event.target.value as Database["public"]["Enums"]["segment_type"] || undefined,
    }));
    setPage(0);
  };

  const handleAgentChange = (event: SelectChangeEvent<string>) => {
    setFilters(prev => ({
      ...prev,
      agentId: event.target.value || undefined,
    }));
    setPage(0);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'startMonth' | 'endMonth') => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value || undefined,
    }));
    setPage(0);
  };

  const handleRequestSort = (property: keyof AgentAnalysisData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export handler
  const handleExport = async () => {
    if (!profile || !['admin', 'backend'].includes(profile.role ?? '')) {
      alert('Permission denied.');
      return;
    }

    setIsExporting(true);
    try {
      if (!analysisData || analysisData.length === 0) {
        alert('No data found for the selected filters to export.');
        return;
      }

      const headers = [
        'Month', 'Agent Name', 'Segment', 'Team', 'Salary', 'Disbursed Amount', 
        'Cashback', 'Revenue', 'Cost', 'Profit/Loss', 'Profit Margin %', 'Cases'
      ];

      const sheetData = [
        headers,
        ...analysisData.map(row => [
          row.snapshot_month,
          row.agent_name || 'Unknown',
          row.segment,
          row.team_name || 'N/A',
          row.salary_current,
          row.total_disbursed_amount,
          row.total_cashback,
          row.total_revenue,
          row.total_cost,
          row.profit_loss,
          row.profit_margin,
          row.case_count
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Agent Analysis');

      XLSX.writeFile(wb, `Agent_Analysis_${filters.startMonth}_${filters.endMonth}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = profile && ['admin', 'backend'].includes(profile.role ?? '');

  // Table columns
  const headCells = [
    { id: 'snapshot_month' as keyof AgentAnalysisData, label: 'Month', numeric: false, sortable: true },
    { id: 'agent_name' as keyof AgentAnalysisData, label: 'Agent', numeric: false, sortable: true },
    { id: 'segment' as keyof AgentAnalysisData, label: 'Segment', numeric: false, sortable: true },
    { id: 'total_revenue' as keyof AgentAnalysisData, label: 'Revenue', numeric: true, sortable: true },
    { id: 'total_cost' as keyof AgentAnalysisData, label: 'Cost', numeric: true, sortable: true },
    { id: 'profit_loss' as keyof AgentAnalysisData, label: 'Profit/Loss', numeric: true, sortable: true },
    { id: 'profit_margin' as keyof AgentAnalysisData, label: 'Margin %', numeric: true, sortable: true },
    { id: 'case_count' as keyof AgentAnalysisData, label: 'Cases', numeric: true, sortable: true },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <ModernContainer maxWidth="lg">
      <Fade in={true} timeout={800}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ModernButton
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/admin/performance')}
              sx={{ mr: 2, borderColor: '#64748b', color: '#64748b' }}
            >
              Back
            </ModernButton>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontWeight: 600,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 32,
                  backgroundColor: '#0ea5e9',
                  borderRadius: 2,
                  mr: 2,
                },
              }}
            >
              Agent Analysis
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canExport && (
              <ModernButton
                variant="contained"
                startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                onClick={handleExport}
                disabled={isExporting}
                sx={{
                  background: '#0ea5e9',
                  '&:hover': {
                    background: '#0284c7',
                  },
                }}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </ModernButton>
            )}
          </Box>
        </Box>
      </Fade>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                    {formatCurrency(summaryData.totalRevenue)}
                  </Typography>
                </Box>
                <AccountBalanceWalletIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </SummaryCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Cost
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                    {formatCurrency(summaryData.totalCost)}
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </SummaryCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard sx={{ 
            background: summaryData.totalProfitLoss >= 0 
              ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
              : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Net P&L
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                    {formatCurrency(summaryData.totalProfitLoss)}
                  </Typography>
                </Box>
                {summaryData.totalProfitLoss >= 0 ? 
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} /> :
                  <TrendingDownIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                }
              </Box>
            </CardContent>
          </SummaryCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#374151' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Active Agents
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                    {summaryData.totalAgents}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Profitable: {summaryData.profitableAgents} | Loss: {summaryData.lossAgents}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </SummaryCard>
        </Grid>
      </Grid>

      {/* Segment Analysis */}
      {segmentData.length > 0 && (
        <ModernPaper sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#0f172a' }}>
            Segment Analysis
          </Typography>
          <Grid container spacing={2}>
            {segmentData.map((segment) => (
              <Grid item xs={12} sm={6} md={3} key={segment.segment}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 2,
                  background: segment.profitLoss >= 0 ? '#f0fdf4' : '#fef2f2'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {segment.segment}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    P&L: {formatCurrency(segment.profitLoss)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Agents: {segment.agentCount} | Cases: {segment.caseCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Margin: {segment.profitMargin.toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </ModernPaper>
      )}

      {/* Filter Section */}
      <FilterSection>
        <Typography 
          variant="h6" 
          sx={{
            fontWeight: 600,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            '&::before': {
              content: '""',
              width: 4,
              height: 24,
              backgroundColor: '#0ea5e9',
              borderRadius: 2,
              mr: 2,
            },
          }}
        >
          Filter Analysis
        </Typography>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              id="start-month"
              label="Start Month"
              type="month"
              size="small"
              fullWidth
              value={filters.startMonth || ''}
              onChange={(e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'startMonth')}
              InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
              inputProps={{ min: '2025-06' }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              id="end-month"
              label="End Month"
              type="month"
              size="small"
              fullWidth
              value={filters.endMonth || ''}
              onChange={(e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'endMonth')}
              InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold' } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontWeight: 'bold' }}>Segment</InputLabel>
              <Select
                value={filters.segment || ''}
                onChange={handleSegmentChange}
                input={<OutlinedInput label="Segment" />}
              >
                <MenuItem value="">All Segments</MenuItem>
                {segmentOptions.map((segment) => (
                  <MenuItem key={segment} value={segment}>
                    {segment}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontWeight: 'bold' }}>Agent</InputLabel>
              <Select
                value={filters.agentId || ''}
                onChange={handleAgentChange}
                input={<OutlinedInput label="Agent" />}
                disabled={isLoadingAgents}
              >
                <MenuItem value="">All Agents</MenuItem>
                {agentOptions?.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </FilterSection>

      {/* Agent Analysis Table */}
      <ModernPaper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="agent analysis table">
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
                        onClick={() => handleRequestSort(headCell.id)}
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
              {isLoadingAnalysis ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Alert severity="error">
                      Error loading analysis: {error?.message || 'Unknown error'}
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <TableRow
                    hover
                    key={`${row.agent_id}-${row.snapshot_month}-${index}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>{row.snapshot_month}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.agent_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.team_name || 'No Team'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.segment} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.total_revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.total_cost)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ 
                        color: row.profit_loss >= 0 ? '#059669' : '#dc2626',
                        fontWeight: 600
                      }}>
                        {formatCurrency(row.profit_loss)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ 
                        color: row.profit_margin >= 0 ? '#059669' : '#dc2626',
                        fontWeight: 600
                      }}>
                        {row.profit_margin.toFixed(1)}%
                      </Box>
                    </TableCell>
                    <TableCell align="right">{row.case_count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    No data available for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </ModernPaper>
    </ModernContainer>
  );
}