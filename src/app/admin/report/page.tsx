'use client';

import React, { useState, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
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
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
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
import Skeleton from '@mui/material/Skeleton';
import * as XLSX from 'xlsx';

import {
    getActiveLeadOwners,
    getTeams,
    UserOption,
    TeamOption,
    segmentOptions // Assuming segmentOptions = ['PL', 'BL'] is exported
} from '@/lib/supabase/queries/filters';
import { useAuth } from '@/context/AuthContext';

// Interface for the data returned by the Supabase function
interface PerformanceReportRow {
    segment: string;
    lead_owner_id: string;
    lead_owner_name: string;
    team_id: string | null;
    team_name: string | null;
    app_login_count: number;
    total_disbursed_amount: number;
    under_process_count: number;
}

// Interface for filter state - dates are now strings 'YYYY-MM-DD' or empty/null
interface PerformanceReportFilters {
    segments: string[];
    ownerIds: string[];
    teamIds: string[];
    dateStart: string | null;
    dateEnd: string | null;
    page?: number;
    rowsPerPage?: number;
    sortColumn?: keyof PerformanceReportRow;
    sortDirection?: 'asc' | 'desc';
}

// Constants for table
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function PerformanceReportPage() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);

    // State for pagination and sorting
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState<keyof PerformanceReportRow>('total_disbursed_amount');

    const [filters, setFilters] = useState<Omit<PerformanceReportFilters, 'page' | 'rowsPerPage' | 'sortColumn' | 'sortDirection'>>({
        segments: [],
        ownerIds: [],
        teamIds: [],
        dateStart: null,
        dateEnd: null,
    });

    // --- Fetch filter options ---
    const { data: ownerOptions, isLoading: isLoadingOwners } = useQuery<UserOption[], Error>({
        queryKey: ['activeLeadOwners'],
        queryFn: getActiveLeadOwners,
    });

    const { data: teamOptions, isLoading: isLoadingTeams } = useQuery<TeamOption[], Error>({
        queryKey: ['teams'],
        queryFn: getTeams,
    });

    // Combine filters with pagination and sorting for the query
    const queryFilters: PerformanceReportFilters = {
        ...filters,
        page,
        rowsPerPage,
        sortColumn: orderBy,
        sortDirection: order,
    };

    // --- Fetch Report Data ---
    const { data: reportData, isLoading: isLoadingReport, isError, error } = useQuery<PerformanceReportRow[], Error>({
        queryKey: ['performanceReport', queryFilters], // Using the whole filters object as key
        queryFn: async () => {
            const params = {
                p_segments: filters.segments.length > 0 ? filters.segments : null,
                p_owner_ids: filters.ownerIds.length > 0 ? filters.ownerIds : null,
                p_team_ids: filters.teamIds.length > 0 ? filters.teamIds : null,
                // Pass date strings directly, ensuring empty string becomes null
                p_date_start: filters.dateStart || null,
                p_date_end: filters.dateEnd || null,
                // We'll handle pagination and sorting client-side for now
                // In the future, these could be passed to the RPC function
            };

            console.log("Calling get_custom_performance_report with:", params);

            const { data, error: rpcError } = await supabase.rpc('get_custom_performance_report', params);

            if (rpcError) {
                console.error('RPC Error fetching performance report:', rpcError);
                throw new Error(rpcError.message || 'Failed to fetch performance report data.');
            }
            if (!data) {
                console.error('No data returned from RPC.');
                return [];
            }
            if (!Array.isArray(data)) {
                console.error('Unexpected RPC response structure:', data);
                throw new Error('Invalid response format received from server.');
            }
            return data as PerformanceReportRow[];
        },
        enabled: true,
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
    });

    // --- Handlers ---
    const handleMultiSelectChange = (
        event: SelectChangeEvent<string[]>,
        field: keyof Pick<PerformanceReportFilters, 'segments' | 'ownerIds' | 'teamIds'>
    ) => {
        const { target: { value } } = event;
        const selectedValues = typeof value === 'string' ? value.split(',') : value;

        setFilters(prev => ({
            ...prev,
            [field]: selectedValues,
        }));
        // Reset pagination when filters change
        setPage(0);
    };

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof Pick<PerformanceReportFilters, 'dateStart' | 'dateEnd'>) => {
        setFilters(prev => ({
            ...prev,
            [field]: event.target.value || null, // Store date as string 'YYYY-MM-DD' or null
        }));
        // Reset pagination when filters change
        setPage(0);
    };

    // Pagination handlers
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Sorting handler
    const handleRequestSort = (property: keyof PerformanceReportRow) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Export handler
    const handleExport = async () => {
        if (!profile || !['admin', 'backend'].includes(profile.role ?? '')) {
            alert('Permission denied.');
            return;
        }

        setIsExporting(true);
        try {
            // Use the current reportData or fetch all data for export
            if (!reportData || reportData.length === 0) {
                alert('No data found for the selected filters to export.');
                return;
            }

            const headers = [
                'Segment', 'Lead Owner', 'Team', 'App Login Count', 'Under Process', 'Total Disbursed Amount'
            ];

            const sheetData = [
                headers,
                ...reportData.map(row => [
                    row.segment,
                    row.lead_owner_name || 'Unassigned',
                    row.team_name || 'N/A',
                    row.app_login_count,
                    row.under_process_count,
                    row.total_disbursed_amount
                ])
            ];

            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Performance Report');

            XLSX.writeFile(wb, 'Performance_Report_Export.xlsx');
        } catch (error) {
            console.error("Export failed:", error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    };

    // Check if user can export
    const canExport = profile && ['admin', 'backend'].includes(profile.role ?? '');

    // Apply client-side sorting and pagination
    const sortedData = React.useMemo(() => {
        if (!reportData) return [];

        // Create a copy to avoid mutating the original data
        const sortableData = [...reportData];

        // Sort the data
        return sortableData.sort((a, b) => {
            const valueA = a[orderBy];
            const valueB = b[orderBy];

            // Handle null values
            if (valueA === null) return order === 'asc' ? -1 : 1;
            if (valueB === null) return order === 'asc' ? 1 : -1;

            // Compare based on type
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return order === 'asc' ? valueA - valueB : valueB - valueA;
            }

            // String comparison
            const strA = String(valueA).toLowerCase();
            const strB = String(valueB).toLowerCase();
            return order === 'asc'
                ? strA.localeCompare(strB)
                : strB.localeCompare(strA);
        });
    }, [reportData, orderBy, order]);

    // Apply pagination
    const paginatedData = React.useMemo(() => {
        if (!sortedData) return [];
        return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedData, page, rowsPerPage]);

    // Define sortable columns
    const headCells = [
        { id: 'segment' as keyof PerformanceReportRow, label: 'Segment', numeric: false, sortable: true },
        { id: 'lead_owner_name' as keyof PerformanceReportRow, label: 'Lead Owner', numeric: false, sortable: true },
        { id: 'team_name' as keyof PerformanceReportRow, label: 'Team', numeric: false, sortable: true },
        { id: 'app_login_count' as keyof PerformanceReportRow, label: 'App Login Count', numeric: true, sortable: true },
        { id: 'under_process_count' as keyof PerformanceReportRow, label: 'Under Process', numeric: true, sortable: true },
        { id: 'total_disbursed_amount' as keyof PerformanceReportRow, label: 'Total Disbursed Amount', numeric: true, sortable: true },
    ];

    // --- Render ---
    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        Performance Report
                    </Typography>
                    {canExport && (
                        <Button
                            variant="contained"
                            startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Exporting...' : 'Export to Excel'}
                        </Button>
                    )}
                </Box>

                {/* Filter Section */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Filters
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 1, alignItems: 'center' }}>
                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="segment-filter-label" sx={{ fontWeight: 'bold' }}>Segment</InputLabel>
                                <Select
                                    labelId="segment-filter-label"
                                    multiple
                                    value={filters.segments}
                                    onChange={(e) => handleMultiSelectChange(e, 'segments')}
                                    input={<OutlinedInput label="Segment" />}
                                    renderValue={(selected) => selected.join(', ')}
                                    MenuProps={MenuProps}
                                    sx={{ minWidth: '180px' }}
                                >
                                    {segmentOptions.map((segment) => (
                                        <MenuItem key={segment} value={segment}>
                                            <Checkbox checked={filters.segments.indexOf(segment) > -1} />
                                            <ListItemText primary={segment} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="owner-filter-label" sx={{ fontWeight: 'bold' }}>Lead Owner</InputLabel>
                                <Select
                                    labelId="owner-filter-label"
                                    multiple
                                    value={filters.ownerIds}
                                    onChange={(e) => handleMultiSelectChange(e, 'ownerIds')}
                                    input={<OutlinedInput label="Lead Owner" />}
                                    renderValue={(selected) => {
                                        if (selected.length === 0) return '';
                                        if (selected.length === 1) return ownerOptions?.find(o => o.id === selected[0])?.name ?? '';
                                        return `${selected.length} selected`;
                                    }}
                                    disabled={isLoadingOwners}
                                    MenuProps={MenuProps}
                                    sx={{ minWidth: '180px' }}
                                >
                                    {isLoadingOwners && <MenuItem disabled>Loading...</MenuItem>}
                                    {ownerOptions?.map((owner) => (
                                        <MenuItem key={owner.id} value={owner.id}>
                                            <Checkbox checked={filters.ownerIds.indexOf(owner.id) > -1} />
                                            <ListItemText primary={owner.name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="team-filter-label" sx={{ fontWeight: 'bold' }}>Team</InputLabel>
                                <Select
                                    labelId="team-filter-label"
                                    multiple
                                    value={filters.teamIds}
                                    onChange={(e) => handleMultiSelectChange(e, 'teamIds')}
                                    input={<OutlinedInput label="Team" />}
                                    renderValue={(selected) => {
                                        if (selected.length === 0) return '';
                                        if (selected.length === 1) return teamOptions?.find(t => t.id === selected[0])?.name ?? '';
                                        return `${selected.length} selected`;
                                    }}
                                    disabled={isLoadingTeams}
                                    MenuProps={MenuProps}
                                    sx={{ minWidth: '180px' }}
                                >
                                    {isLoadingTeams && <MenuItem disabled>Loading...</MenuItem>}
                                    {teamOptions?.map((team) => (
                                        <MenuItem key={team.id} value={team.id}>
                                            <Checkbox checked={filters.teamIds.indexOf(team.id) > -1} />
                                            <ListItemText primary={team.name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <TextField
                                id="date-from"
                                label="Date From"
                                type="date"
                                size="small"
                                fullWidth
                                value={filters.dateStart || ''}
                                onChange={(e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'dateStart')}
                                InputLabelProps={{
                                    shrink: true,
                                    sx: { fontWeight: 'bold' }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <TextField
                                id="date-to"
                                label="Date To"
                                type="date"
                                size="small"
                                fullWidth
                                value={filters.dateEnd || ''}
                                onChange={(e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'dateEnd')}
                                InputLabelProps={{
                                    shrink: true,
                                    sx: { fontWeight: 'bold' }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Report Table */}
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="performance report table">
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
                            </TableHead>
                            <TableBody>
                                {isLoadingReport ? (
                                    <TableRow>
                                        <TableCell colSpan={headCells.length} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={headCells.length} align="center">
                                            <Alert severity="error">
                                                Error loading report: {error?.message || 'Unknown error'}
                                            </Alert>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((row, index) => (
                                        <TableRow
                                            hover
                                            key={`${row.lead_owner_id}-${row.team_id}-${row.segment}-${index}`}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">{row.segment}</TableCell>
                                            <TableCell>{row.lead_owner_name ?? 'Unassigned'}</TableCell>
                                            <TableCell>{row.team_name ?? 'N/A'}</TableCell>
                                            <TableCell align="right">{row.app_login_count}</TableCell>
                                            <TableCell align="right">{row.under_process_count}</TableCell>
                                            <TableCell align="right">
                                                {row.total_disbursed_amount.toLocaleString('en-IN', {
                                                    style: 'currency',
                                                    currency: 'INR',
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </TableCell>
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

                    {/* Pagination */}
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={sortedData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            </Box>
        </Container>
    );
}