'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  TableSortLabel,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import Link from 'next/link';
import { format } from 'date-fns';
import { Dayjs } from 'dayjs';
import { Database } from '@/lib/supabase/database.types';
import { useAuth } from '@/context/AuthContext';

// Type for Owners fetched for dropdown
interface Owner {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

// Type for Teams fetched for dropdown
interface Team {
  id: string;
  name: string;
}

// Interface for fetched application data
interface DisbursedApplicationData {
  id: string;
  segment: string | null;
  first_name: string | null;
  last_name: string | null;
  loan_app_number: string | null;
  approved_amount: number | null;
  bank_name: string | null;
  lead_stage: string | null;
  disburse_date: string | null;
  owner_id: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  team_id: string | null;
  team_name: string | null;
}

// Interface for filters
interface Filters {
  segments: string[];
  ownerIds: string[];
  teamIds: string[];
  disburseDateStart: Dayjs | null;
  disburseDateEnd: Dayjs | null;
}

// Interface for sorting
interface SortState {
  column: keyof DisbursedApplicationData | null;
  direction: 'asc' | 'desc';
}

// --- Data Fetching Functions ---

const fetchActiveOwners = async (): Promise<Owner[]> => {
  const { data, error } = await supabase
    .from('profile')
    .select('id, first_name, last_name')
    .in('role', ['agent', 'team_leader'])
    .eq('is_active', true)
    .order('first_name', { ascending: true });
  if (error) throw new Error('Failed to fetch owners');
  return data as Owner[];
};

const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase
    .from('team')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw new Error('Failed to fetch teams');
  return data as Team[];
};

const fetchDisbursedApplications = async (filters: Filters, sort: SortState): Promise<DisbursedApplicationData[]> => {
  // Create a base query
  let query = supabase
    .from('bank_application')
    .select(`
      id, lead_id, loan_app_number, approved_amount, bank_name, lead_stage, disburse_date,
      leads!inner ( segment, first_name, last_name, lead_owner, profile!left ( id, first_name, last_name, team_members!left( team!left( id, name ) ) ) )
    `, { count: 'exact' })
    .eq('lead_stage', 'Disbursed');

  // Apply Segment Filter - Use INNER JOIN instead of LEFT JOIN for segment filtering
  // This ensures we only get applications with valid segment values
  if (filters.segments.length > 0) {
    query = query.in('leads.segment', filters.segments);
    console.log('Filtering by segments:', filters.segments);
  }

  // Apply Date Filters
  if (filters.disburseDateStart) {
    query = query.gte('disburse_date', filters.disburseDateStart.format('YYYY-MM-DD'));
  }
  if (filters.disburseDateEnd) {
    query = query.lte('disburse_date', filters.disburseDateEnd.format('YYYY-MM-DD'));
  }

  // Apply Sorting
  if (sort.column && sort.column === 'disburse_date') {
    query = query.order(sort.column, { ascending: sort.direction === 'asc' });
  } else {
    query = query.order('disburse_date', { ascending: false });
  }

  // Execute the query
  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching disbursed applications:', error);
    throw new Error('Failed to fetch disbursed applications.');
  }

  console.log(`Fetched ${count} disbursed applications with filters:`, filters);

  // Process data with careful handling of nested objects
  let processedData = data.map((app: any) => {
    // Ensure leads data exists and handle it properly
    const leads = app.leads || {};

    return {
      id: app.id,
      segment: leads.segment || null,
      first_name: leads.first_name || null,
      last_name: leads.last_name || null,
      loan_app_number: app.loan_app_number || null,
      approved_amount: app.approved_amount || null,
      bank_name: app.bank_name || null,
      lead_stage: app.lead_stage || null,
      disburse_date: app.disburse_date || null,
      owner_id: leads.profile?.id || null,
      owner_first_name: leads.profile?.first_name || null,
      owner_last_name: leads.profile?.last_name || null,
      team_id: leads.profile?.team_members?.[0]?.team?.id || null,
      team_name: leads.profile?.team_members?.[0]?.team?.name || null,
    };
  });

  // Apply Client-Side Filters for owner and team
  if (filters.ownerIds.length > 0) {
    processedData = processedData.filter(app => app.owner_id && filters.ownerIds.includes(app.owner_id));
  }
  if (filters.teamIds.length > 0) {
    processedData = processedData.filter(app => app.team_id && filters.teamIds.includes(app.team_id));
    console.warn("Team filtering applied client-side. Consider RPC/View for performance.");
  }

  // Double-check segment filtering on client side as well
  if (filters.segments.length > 0) {
    processedData = processedData.filter(app =>
      app.segment && filters.segments.includes(app.segment)
    );
  }

  console.log(`Returning ${processedData.length} processed applications after client-side filtering`);
  return processedData as DisbursedApplicationData[];
};

// --- Component Constants ---
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

// --- Component ---
export default function DisbursedApplicationsTable() {
  const { profile } = useAuth();

  // State
  const [filters, setFilters] = useState<Filters>({
    segments: [],
    ownerIds: [],
    teamIds: [],
    disburseDateStart: null,
    disburseDateEnd: null,
  });
  const [sort, setSort] = useState<SortState>({ column: 'disburse_date', direction: 'desc' });

  // Queries
  const { data: owners, isLoading: isLoadingOwners } = useQuery<Owner[], Error>({ queryKey: ['activeOwners'], queryFn: fetchActiveOwners });
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[], Error>({ queryKey: ['teams'], queryFn: fetchTeams });
  const { data, isLoading, error, isError } = useQuery<DisbursedApplicationData[], Error>({
    queryKey: ['disbursedApplications', filters, sort],
    queryFn: () => fetchDisbursedApplications(filters, sort),
  });

  // Handlers
  const handleFilterChange = (filterName: keyof Filters, value: string[] | Dayjs | null) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  const handleSortChange = (column: keyof DisbursedApplicationData) => {
    setSort(prev => ({ column: column, direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  // Helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try { return format(new Date(dateString), 'dd-MMM-yyyy'); } catch { return 'Invalid Date'; }
  };
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };
  const ownerMap = useMemo(() => {
    if (!owners) return {};
    return owners.reduce((acc, owner) => {
      acc[owner.id] = `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim();
      return acc;
    }, {} as Record<string, string>);
  }, [owners]);
  const teamMap = useMemo(() => {
     if (!teams) return {};
     return teams.reduce((acc, team) => {
       acc[team.id] = team.name;
       return acc;
     }, {} as Record<string, string>);
   }, [teams]);

  // Constants
  const segmentOptions: Database['public']['Enums']['segment_type'][] = ['PL', 'BL', 'PL_DIGITAL', 'BL_DIGITAL'];
  const canExport = profile?.role === 'admin' || profile?.role === 'backend';

  // Calculate Total Approved Amount (Client-side)
  const totalApprovedAmount = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, app) => sum + (app.approved_amount || 0), 0);
  }, [data]);

  // Export Handler (Client-side CSV)
  const handleExport = () => {
    if (!data) return;

    const headers = [
        "Segment", "First Name", "Last Name", "Loan App Number",
        "Approved Amount", "Bank Name", "Disburse Date", "Lead Owner", "Team"
    ];
    const rows = data.map(row => [
        `"${row.segment || ''}"`,
        `"${row.first_name || ''}"`,
        `"${row.last_name || ''}"`,
        `"${row.loan_app_number || ''}"`,
        row.approved_amount || 0,
        `"${row.bank_name || ''}"`,
        `"${row.disburse_date ? formatDate(row.disburse_date) : 'N/A'}"`,
        `"${row.owner_first_name || row.owner_last_name ? `${row.owner_first_name || ''} ${row.owner_last_name || ''}`.trim() : 'N/A'}"`,
        `"${row.team_name || 'N/A'}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `disbursed_applications_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    console.warn("Client-side export initiated. PRD recommends a backend function for large datasets.")
  };

  // --- Render ---
  return (
    <Box>
      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
            <Typography variant="h6">Filters</Typography>
            {canExport && (
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    disabled={!data || data.length === 0}
                >
                    Export to Excel
                </Button>
            )}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="segment-filter-label" sx={{ fontWeight: 'bold' }}>Segment</InputLabel>
              <Select
                labelId="segment-filter-label"
                multiple
                value={filters.segments}
                onChange={(e: SelectChangeEvent<string[]>) => handleFilterChange('segments', e.target.value as string[])}
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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" disabled={isLoadingOwners}>
              <InputLabel id="owner-filter-label" sx={{ fontWeight: 'bold' }}>Lead Owner</InputLabel>
              <Select
                labelId="owner-filter-label"
                multiple
                value={filters.ownerIds}
                onChange={(e) => handleFilterChange('ownerIds', e.target.value as string[])}
                input={<OutlinedInput label="Lead Owner" />}
                renderValue={(selected) => selected.map(id => ownerMap[id] || id).join(', ')}
                MenuProps={MenuProps}
                sx={{ minWidth: '180px' }}
              >
                {(owners || []).map((owner) => (
                  <MenuItem key={owner.id} value={owner.id}>
                    <Checkbox checked={filters.ownerIds.indexOf(owner.id) > -1} />
                    <ListItemText primary={`${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim()} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             <FormControl fullWidth size="small" disabled={isLoadingTeams}>
               <InputLabel id="team-filter-label" sx={{ fontWeight: 'bold' }}>Team</InputLabel>
               <Select
                 labelId="team-filter-label"
                 multiple
                 value={filters.teamIds}
                 onChange={(e) => handleFilterChange('teamIds', e.target.value as string[])}
                 input={<OutlinedInput label="Team" />}
                 renderValue={(selected) => selected.map(id => teamMap[id] || id).join(', ')}
                 MenuProps={MenuProps}
                 sx={{ minWidth: '180px' }}
               >
                 {(teams || []).map((team) => (
                   <MenuItem key={team.id} value={team.id}>
                     <Checkbox checked={filters.teamIds.indexOf(team.id) > -1} />
                     <ListItemText primary={team.name} />
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Grid>
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', gap: 1 }}>
            <DatePicker
              label="Disburse Start"
              value={filters.disburseDateStart}
              onChange={(newValue) => handleFilterChange('disburseDateStart', newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: {
                    sx: { fontWeight: 'bold' }
                  }
                }
              }}
            />
            <DatePicker
              label="Disburse End"
              value={filters.disburseDateEnd}
              onChange={(newValue) => handleFilterChange('disburseDateEnd', newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: {
                    sx: { fontWeight: 'bold' }
                  }
                }
              }}
              minDate={filters.disburseDateStart || undefined}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Table Section */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">Error loading applications: {error?.message}</Alert>
      ) : !data || data.length === 0 ? (
        <Typography sx={{ mt: 2 }}>No disbursed applications found matching filters.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="disbursed applications table">
            <TableHead sx={{ backgroundColor: 'grey.200' }}>
              <TableRow>
                <TableCell>Segment</TableCell>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Loan App Number</TableCell>
                <TableCell align="right">Approved Amount</TableCell>
                <TableCell>Bank Name</TableCell>
                <TableCell
                   key='disburse_date'
                   sortDirection={sort.column === 'disburse_date' ? sort.direction : false}
                 >
                   <TableSortLabel
                     active={sort.column === 'disburse_date'}
                     direction={sort.column === 'disburse_date' ? sort.direction : 'asc'}
                     onClick={() => handleSortChange('disburse_date')}
                   >
                     Disburse Date
                   </TableSortLabel>
                </TableCell>
                <TableCell>Lead Owner</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                   <TableCell>{row.segment || 'N/A'}</TableCell>
                   <TableCell>{row.first_name || 'N/A'}</TableCell>
                   <TableCell>{row.last_name || ''}</TableCell>
                   <TableCell>{row.loan_app_number || 'N/A'}</TableCell>
                   <TableCell align="right">{formatCurrency(row.approved_amount)}</TableCell>
                   <TableCell>{row.bank_name || 'N/A'}</TableCell>
                   <TableCell>{formatDate(row.disburse_date)}</TableCell>
                   <TableCell>
                     {row.owner_first_name || row.owner_last_name
                       ? `${row.owner_first_name || ''} ${row.owner_last_name || ''}`.trim()
                       : 'N/A'}
                   </TableCell>
                   <TableCell>{row.team_name || 'N/A'}</TableCell>
                   <TableCell align="center">
                     <Tooltip title="View/Edit Application">
                       <Link href={`/bank-applications/${row.id}/edit`} passHref>
                         <IconButton size="small" color="primary">
                           <EditIcon fontSize="small" />
                         </IconButton>
                       </Link>
                     </Tooltip>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {/* Total Amount Display */}
            <Box sx={{ p: 2, textAlign: 'right', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
                <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>
                    Total Approved Amount:
                </Typography>
                <Typography variant="subtitle1" component="span" sx={{ ml: 1 }}>
                    {formatCurrency(totalApprovedAmount)}
                </Typography>
                <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    (Calculated from currently displayed data)
                </Typography>
            </Box>
           {/* TODO: Add Pagination Controls */}
        </TableContainer>
      )}
    </Box>
  );
}