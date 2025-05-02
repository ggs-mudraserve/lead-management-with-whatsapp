'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Button,
  FormGroup,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import Link from 'next/link';
import { format } from 'date-fns';
import { Dayjs } from 'dayjs';
import { Database } from '@/lib/supabase/database.types';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

// Interfaces
interface Owner { id: string; first_name: string | null; last_name: string | null; }
interface Team { id: string; name: string; }
interface MissedReason { id: string; reason: string; }
interface MissedOpportunityLead {
  id: string; // Lead ID
  segment: string | null;
  first_name: string | null;
  last_name: string | null;
  owner_id: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  team_id: string | null;
  team_name: string | null;
  created_at: string | null;
  selected_reason_ids: string[];
}

// Remove unused interim type
/*
interface FetchedLeadData {
    id: string;
    segment: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string | null;
    profile: Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        team_members?: Array<{ team?: { id: string; name: string } | null } | null> | null;
    }> | null;
    bank_application?: Array<any> | null;
    lead_missed_reasons?: Array<{ reason_id: string }> | null;
}
*/

interface Filters { segments: string[]; ownerIds: string[]; teamIds: string[]; creationDateStart: Dayjs | null; creationDateEnd: Dayjs | null; }

// --- Data Fetching Functions ---

const fetchActiveOwners = async (): Promise<Owner[]> => {
  const { data, error } = await supabase.from('profile').select('id, first_name, last_name').in('role', ['agent', 'team_leader']).eq('is_active', true).order('first_name');
  if (error) throw new Error('Failed to fetch owners');
  return data as Owner[];
};

const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase.from('team').select('id, name').order('name');
  if (error) throw new Error('Failed to fetch teams');
  return data as Team[];
};

const fetchAllMissedReasons = async (): Promise<MissedReason[]> => {
  const { data, error } = await supabase
    .from('missed_opportunity')
    .select('id, reason')
    .order('reason');
  if (error) throw new Error('Failed to fetch missed opportunity reasons');
  return data as MissedReason[];
};

const fetchMissedOpportunities = async (filters: Filters): Promise<MissedOpportunityLead[]> => {
  let query = supabase
    .from('leads')
    .select(
      `id, segment, first_name, last_name, created_at, lead_owner, bank_application!left( id ), lead_missed_reasons!left( reason_id ), profile!left(id, first_name, last_name, team_members!left(team!left(id, name)))`,
      { count: 'exact' }
    )

  if (filters.segments.length > 0) { query = query.in('segment', filters.segments); }
  if (filters.ownerIds.length > 0) { query = query.in('lead_owner', filters.ownerIds); }
  if (filters.creationDateStart) { query = query.gte('created_at', filters.creationDateStart.toISOString()); }
  if (filters.creationDateEnd) { query = query.lte('created_at', filters.creationDateEnd.toISOString()); }

  query = query.order('created_at', { ascending: false });

  console.log('[fetchMissedOpportunities] Executing Supabase query...');

  const { data, error } = await query;

  console.log('[fetchMissedOpportunities] Raw data received (all leads):', data);
  console.log('[fetchMissedOpportunities] Error received:', error);

  if (error) {
    console.error('Error fetching leads:', error);
    throw new Error('Failed to fetch leads.');
  }

  if (!data) {
      console.warn('[fetchMissedOpportunities] No data received from Supabase.');
      return []; // Return empty array if data is null/undefined
  }

  // Filter out leads that HAVE bank applications
  const leadsWithoutApps = data.filter(lead => 
      !lead.bank_application || lead.bank_application.length === 0
  );
  console.log('[fetchMissedOpportunities] Leads after filtering for no bank apps:', leadsWithoutApps);

  // TODO: Refine typing here. Supabase query inference is complex.
  // Reverting to any for now to fix build errors.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processedData = leadsWithoutApps.map((lead: any) => ({
    id: lead.id,
    segment: lead.segment,
    first_name: lead.first_name,
    last_name: lead.last_name,
    created_at: lead.created_at,
    owner_id: lead.profile?.id,
    owner_first_name: lead.profile?.first_name,
    owner_last_name: lead.profile?.last_name,
    team_id: lead.profile?.team_members?.[0]?.team?.id ?? null,
    team_name: lead.profile?.team_members?.[0]?.team?.name ?? null,
    selected_reason_ids: lead.lead_missed_reasons?.map((r: { reason_id: string }) => r.reason_id) ?? [],
  }));

  if (filters.teamIds.length > 0) {
      processedData = processedData.filter(lead => lead.team_id && filters.teamIds.includes(lead.team_id));
      console.warn("Team filtering applied client-side...");
  }

  console.log('[fetchMissedOpportunities] Final processed data:', processedData);

  return processedData as MissedOpportunityLead[];
};

// --- Component Constants ---
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } } };

// --- Component ---
export default function MissedOpportunitiesTable() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // State
  const [filters, setFilters] = useState<Filters>({
    segments: [],
    ownerIds: [],
    teamIds: [],
    creationDateStart: null,
    creationDateEnd: null,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  // Queries
  const { data: owners, isLoading: isLoadingOwners } = useQuery<Owner[], Error>({ queryKey: ['activeOwners'], queryFn: fetchActiveOwners });
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[], Error>({ queryKey: ['teams'], queryFn: fetchTeams });
  const { data: allReasons, isLoading: isLoadingReasons } = useQuery<MissedReason[], Error>({
    queryKey: ['allMissedReasons'], queryFn: fetchAllMissedReasons
  });
  const { data, isLoading, error, isError } = useQuery<MissedOpportunityLead[], Error>({
    queryKey: ['missedOpportunities', filters],
    queryFn: () => fetchMissedOpportunities(filters),
  });

  // Mutations
  const addReasonMutation = useMutation({
    mutationFn: async ({ leadId, reasonId }: { leadId: string; reasonId: string }) => {
      const { error } = await supabase
        .from('lead_missed_reasons')
        .insert({ lead_id: leadId, reason_id: reasonId });
      if (error) throw error;
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Reason added.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['missedOpportunities', filters] });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Failed to add reason: ${error.message}`, severity: 'error' });
    },
  });

  const deleteReasonMutation = useMutation({
    mutationFn: async ({ leadId, reasonId }: { leadId: string; reasonId: string }) => {
      const { error } = await supabase
        .from('lead_missed_reasons')
        .delete()
        .match({ lead_id: leadId, reason_id: reasonId });
      if (error) throw error;
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Reason removed.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['missedOpportunities', filters] });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Failed to remove reason: ${error.message}`, severity: 'error' });
    },
  });

  // Handlers
  const handleFilterChange = (filterName: keyof Filters, value: string[] | Dayjs | null) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleReasonChange = (leadId: string, reasonId: string, isChecked: boolean) => {
    if (isChecked) {
      addReasonMutation.mutate({ leadId, reasonId });
    } else {
      deleteReasonMutation.mutate({ leadId, reasonId });
    }
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') return;
      setSnackbar({ ...snackbar, open: false });
  };

  // Helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try { return format(new Date(dateString), 'dd-MMM-yyyy'); } catch { return 'Invalid Date'; }
  };
  const ownerMap = useMemo(() => {
    if (!owners) return {};
    return owners.reduce((acc, owner) => { acc[owner.id] = `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim(); return acc; }, {} as Record<string, string>);
  }, [owners]);
  const teamMap = useMemo(() => {
     if (!teams) return {};
     return teams.reduce((acc, team) => { acc[team.id] = team.name; return acc; }, {} as Record<string, string>);
   }, [teams]);
  const reasonMap = useMemo(() => {
    if (!allReasons) return {};
    return allReasons.reduce((acc, reason) => {
      acc[reason.id] = reason.reason;
      return acc;
    }, {} as Record<string, string>)
  }, [allReasons]);

  // Constants
  const segmentOptions: Database['public']['Enums']['segment_type'][] = ['PL', 'BL'];
  const canExport = profile && ['admin', 'backend'].includes(profile.role ?? '');

  // Export Handler (Client-side CSV)
  const handleExport = () => {
    if (!data) return;

    const headers = [
      "Segment", "First Name", "Last Name", "Lead Owner", "Team",
      "Lead Date", "Missed Reason(s)"
    ];
    const rows = data.map(row => [
      `"${row.segment ?? ''}"`,
      `"${row.first_name ?? ''}"`,
      `"${row.last_name ?? ''}"`,
      `"${ownerMap[row.owner_id ?? ''] ?? ''}"`,
      `"${teamMap[row.team_id ?? ''] ?? ''}"`,
      `"${formatDate(row.created_at)}"`,
      `"${row.selected_reason_ids.map(id => reasonMap[id]).join('; ')}"`
    ].join(','));

    const csvContent = headers.join(',') + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `missed_opportunities_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.warn("Client-side export initiated. PRD recommends a backend function for large datasets.")
  };

  // --- Render ---
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
            <Typography variant="h6">Filters</Typography>
            {canExport && (
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    disabled={!data || data.length === 0 || isLoadingReasons}
                >
                    Export to Excel
                </Button>
            )}
        </Box>
        <Grid container spacing={2}>
           {/* Segment Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="segment-filter-label">Segment</InputLabel>
              <Select labelId="segment-filter-label" multiple value={filters.segments} onChange={(e) => handleFilterChange('segments', e.target.value as string[])} input={<OutlinedInput label="Segment" />} renderValue={(selected) => selected.join(', ')} MenuProps={MenuProps}>
                {segmentOptions.map((segment) => (<MenuItem key={segment} value={segment}><Checkbox checked={filters.segments.indexOf(segment) > -1} /><ListItemText primary={segment} /></MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          {/* Owner Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={isLoadingOwners}>
              <InputLabel id="owner-filter-label">Owner</InputLabel>
              <Select labelId="owner-filter-label" multiple value={filters.ownerIds} onChange={(e) => handleFilterChange('ownerIds', e.target.value as string[])} input={<OutlinedInput label="Lead Owner" />} renderValue={(selected) => selected.map(id => ownerMap[id] || id).join(', ')} MenuProps={MenuProps}>
                {(owners || []).map((owner) => (<MenuItem key={owner.id} value={owner.id}><Checkbox checked={filters.ownerIds.indexOf(owner.id) > -1} /><ListItemText primary={`${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim()} /></MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          {/* Team Filter */}
          <Grid item xs={12} sm={6} md={3}>
             <FormControl fullWidth size="small" disabled={isLoadingTeams}>
               <InputLabel id="team-filter-label">Team</InputLabel>
               <Select labelId="team-filter-label" multiple value={filters.teamIds} onChange={(e) => handleFilterChange('teamIds', e.target.value as string[])} input={<OutlinedInput label="Team" />} renderValue={(selected) => selected.map(id => teamMap[id] || id).join(', ')} MenuProps={MenuProps}>
                 {(teams || []).map((team) => (<MenuItem key={team.id} value={team.id}><Checkbox checked={filters.teamIds.indexOf(team.id) > -1} /><ListItemText primary={team.name} /></MenuItem>))}
               </Select>
             </FormControl>
           </Grid>
           {/* Creation/Assignment Date Filter */}
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', gap: 1 }}>
            <DatePicker 
                label="Created After" 
                value={filters.creationDateStart} 
                onChange={(newValue) => handleFilterChange('creationDateStart', newValue ? dayjs(newValue) : null)} 
                slotProps={{ textField: { size: 'small', fullWidth: true } }} 
            />
            <DatePicker 
                label="Created Before" 
                value={filters.creationDateEnd} 
                onChange={(newValue) => handleFilterChange('creationDateEnd', newValue ? dayjs(newValue) : null)} 
                slotProps={{ textField: { size: 'small', fullWidth: true } }} 
                minDate={filters.creationDateStart || undefined} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Table Section */}
      {(isLoading || isLoadingReasons) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}> <CircularProgress /> </Box>
      ) : isError ? (
        <Alert severity="error">Error loading leads: {error?.message}</Alert>
      ) : !data || data.length === 0 ? (
        <Typography sx={{ mt: 2 }}>No missed opportunity leads found matching filters.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="missed opportunity leads table">
            <TableHead sx={{ backgroundColor: 'grey.200' }}>
              <TableRow>
                <TableCell>Segment</TableCell>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Lead Owner</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Lead Date</TableCell>
                <TableCell>Reason(s) Selection</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                   <TableCell>{row.segment ?? 'N/A'}</TableCell>
                   <TableCell>{row.first_name ?? 'N/A'}</TableCell>
                   <TableCell>{row.last_name ?? ''}</TableCell>
                   <TableCell>{row.owner_first_name || row.owner_last_name ? `${row.owner_first_name ?? ''} ${row.owner_last_name ?? ''}`.trim() : 'N/A'}</TableCell>
                   <TableCell>{row.team_name ?? 'N/A'}</TableCell>
                   <TableCell>{formatDate(row.created_at)}</TableCell>
                   <TableCell>
                     <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                       {(allReasons || []).map((reason) => (
                         <FormControlLabel
                           key={reason.id}
                           control={
                             <Checkbox
                               size="small"
                               checked={row.selected_reason_ids.includes(reason.id)}
                               onChange={(e) => handleReasonChange(row.id, reason.id, e.target.checked)}
                               disabled={addReasonMutation.isPending || deleteReasonMutation.isPending}
                             />
                           }
                           label={reason.reason}
                           sx={{ mr: 1, mb: 0 }}
                         />
                       ))}
                       {(addReasonMutation.isPending || deleteReasonMutation.isPending) && <CircularProgress size={16} sx={{ ml: 1 }}/>}
                     </FormGroup>
                   </TableCell>
                   <TableCell align="center">
                     <Tooltip title="View/Edit Lead">
                       <Link href={`/leads/${row.id}/edit`} passHref>
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
        </TableContainer>
      )}
      <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
              {snackbar.message}
          </Alert>
      </Snackbar>
    </Box>
  );
} 