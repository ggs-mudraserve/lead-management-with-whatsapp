'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Snackbar,
  TablePagination,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import Grow from '@mui/material/Grow';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DownloadIcon from '@mui/icons-material/Download';
import Link from 'next/link';
import { format } from 'date-fns';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';
import {
  fetchDailyTasks,
  fetchAdminDailyTasks,
  closeTask,
  rescheduleTask,
  type DailyTaskWithDetails,
  type DailyTaskFilters,
  type AdminDailyTaskFilters,
  type CloseReason,
} from '@/lib/supabase/queries/daily-tasks';
import { Database } from '@/lib/supabase/database.types';
import AdminTaskFilters from './admin-task-filters';

// Keyframes for animations
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

// Styled components for modern look
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

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 180,
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    transition: 'all 0.3s ease',
    minHeight: 40,
    '&:hover': {
      transform: 'scale(1.02)',
    },
    '&.Mui-focused': {
      transform: 'scale(1.02)',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    color: '#475569',
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

// Interfaces
interface Owner {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface Filters {
  segments: string[];
  ownerIds: string[];
  teamIds: string[];
  scheduledDate: Dayjs | null;
  status: string[];
  page: number;
  rowsPerPage: number;
  userRole?: string | null;
}

interface AdminFilters {
  viewType: 'agent' | 'segment' | 'team' | 'date' | 'status' | null;
  dateRange: {
    startDate: Dayjs | null;
    endDate: Dayjs | null;
  };
  quickDateFilter: 'today' | 'week' | 'month' | 'custom' | null;
  segments: string[];
  ownerIds: string[];
  teamIds: string[];
  status: string[];
}

// Constants
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } } };

const segmentOptions: Database['public']['Enums']['segment_type'][] = ['PL', 'BL', 'PL_DIGITAL', 'BL_DIGITAL'];
const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const closeReasonOptions: { value: CloseReason; label: string }[] = [
  { value: 'customer_ni', label: 'Customer NI' },
  { value: 'low_sal', label: 'Low Sal' },
  { value: 'more_than_3_days_follow', label: 'More than 3 days follow' },
  { value: 'docs_received', label: 'Docs Received' },
  { value: 'cibil_related', label: 'Cibil Related' },
];

// Data fetching functions
const fetchActiveOwners = async (): Promise<Owner[]> => {
  const { supabase } = await import('@/lib/supabase/client');
  
  const { data, error } = await supabase
    .from('profile')
    .select('id, first_name, last_name')
    .in('role', ['agent', 'team_leader'])
    .eq('is_active', true)
    .order('first_name');
    
  if (error) throw new Error('Failed to fetch owners');
  return data as Owner[];
};

const fetchTeams = async (): Promise<Team[]> => {
  const { supabase } = await import('@/lib/supabase/client');
  
  const { data, error } = await supabase
    .from('team')
    .select('id, name')
    .order('name');
    
  if (error) throw new Error('Failed to fetch teams');
  return data as Team[];
};

export default function DailyTasksTable() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    segments: [],
    ownerIds: [],
    teamIds: [],
    scheduledDate: dayjs(),
    status: ['open'],
    page: 0,
    rowsPerPage: 10,
    userRole: profile?.role || null,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [adminFilters, setAdminFilters] = useState<AdminFilters>({
    viewType: null,
    dateRange: { startDate: null, endDate: null },
    quickDateFilter: null,
    segments: [],
    ownerIds: [],
    teamIds: [],
    status: ['open'],
  });

  // Update filters when profile changes
  useEffect(() => {
    if (profile) {
      setFilters(prev => ({
        ...prev,
        userRole: profile.role,
      }));
    }
  }, [profile]);

  // Queries
  const { data: owners, isLoading: isLoadingOwners } = useQuery<Owner[], Error>({
    queryKey: ['activeOwners'],
    queryFn: fetchActiveOwners,
  });

  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[], Error>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  // Convert filters to API format
  const apiFilters = useMemo((): DailyTaskFilters | AdminDailyTaskFilters => {
    const baseFilters: DailyTaskFilters = {
      segments: filters.segments,
      ownerIds: filters.ownerIds,
      teamIds: filters.teamIds,
      scheduledDate: filters.scheduledDate?.format('YYYY-MM-DD'),
      status: filters.status as ('open' | 'closed')[],
      userRole: filters.userRole,
      page: filters.page,
      rowsPerPage: filters.rowsPerPage,
    };

    // If admin, merge with admin filters
    if (profile?.role === 'admin') {
      const adminApiFilters: AdminDailyTaskFilters = {
        ...baseFilters,
        viewType: adminFilters.viewType,
        dateRange: adminFilters.dateRange.startDate || adminFilters.dateRange.endDate ? {
          startDate: adminFilters.dateRange.startDate?.format('YYYY-MM-DD') || '',
          endDate: adminFilters.dateRange.endDate?.format('YYYY-MM-DD') || '',
        } : undefined,
        // Only override base filters with admin filters if admin filters are explicitly different from defaults
        segments: adminFilters.segments.length > 0 ? adminFilters.segments : baseFilters.segments,
        ownerIds: adminFilters.ownerIds.length > 0 ? adminFilters.ownerIds : baseFilters.ownerIds,
        teamIds: adminFilters.teamIds.length > 0 ? adminFilters.teamIds : baseFilters.teamIds,
        // For status, check if admin filters are different from default ['open']
        status: (adminFilters.status.length !== 1 || adminFilters.status[0] !== 'open') ? 
          adminFilters.status as ('open' | 'closed')[] : baseFilters.status,
      };
      return adminApiFilters;
    }

    return baseFilters;
  }, [filters, adminFilters, profile?.role]);

  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['dailyTasks', apiFilters],
    queryFn: () => {
      // Use admin function if user is admin, otherwise use regular function
      if (profile?.role === 'admin') {
        return fetchAdminDailyTasks(apiFilters as AdminDailyTaskFilters);
      }
      return fetchDailyTasks(apiFilters);
    },
    placeholderData: (previousData) => previousData,
  });

  const data = response?.data ?? [];

  // Mutations
  const closeTaskMutation = useMutation({
    mutationFn: async ({ taskId, closeReason }: { taskId: string; closeReason: CloseReason }) => {
      await closeTask(taskId, closeReason);
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Task closed successfully.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['dailyTasks'] });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Failed to close task: ${error.message}`, severity: 'error' });
    },
  });

  const rescheduleTaskMutation = useMutation({
    mutationFn: async ({ taskId, newDate }: { taskId: string; newDate: string }) => {
      await rescheduleTask(taskId, newDate);
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Task rescheduled successfully.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['dailyTasks'] });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Failed to reschedule task: ${error.message}`, severity: 'error' });
    },
  });

  // Handlers
  const handleFilterChange = (filterName: keyof Filters, value: string[] | Dayjs | null) => {
    setPage(0);
    setFilters(prev => ({ ...prev, [filterName]: value, page: 0 }));
  };

  const handleCloseTask = (taskId: string, closeReason: CloseReason) => {
    closeTaskMutation.mutate({ taskId, closeReason });
  };

  const handleRescheduleTask = (taskId: string, newDate: string) => {
    rescheduleTaskMutation.mutate({ taskId, newDate });
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setFilters(prev => ({ ...prev, rowsPerPage: newRowsPerPage, page: 0 }));
  };

  // Helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy');
    } catch {
      return 'Invalid Date';
    }
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

  const canExport = profile && ['admin', 'backend'].includes(profile.role ?? '');

  const handleAdminFiltersChange = (newFilters: Partial<AdminFilters>) => {
    setAdminFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0);
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <Box>
      {/* Admin Advanced Filters */}
      {isAdmin && (
        <AdminTaskFilters
          filters={adminFilters}
          onFiltersChange={handleAdminFiltersChange}
          owners={owners || []}
          teams={teams || []}
          isLoading={isLoadingOwners || isLoadingTeams}
        />
      )}

      <FilterSection>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
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
            Filter Tasks
          </Typography>
          {canExport && (
            <ModernButton
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!data || data.length === 0}
              sx={{
                background: '#0ea5e9',
                '&:hover': {
                  background: '#0284c7',
                },
              }}
            >
              Export to Excel
            </ModernButton>
          )}
        </Box>
        <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Scheduled Date Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
            <Grow in={true} timeout={800} style={{ transitionDelay: '100ms' }}>
              <DatePicker
                label="Scheduled Date"
                value={filters.scheduledDate}
                onChange={(newValue) => handleFilterChange('scheduledDate', newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      minWidth: 160,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        transition: 'all 0.3s ease',
                        minHeight: 40,
                        '&:hover': {
                          transform: 'scale(1.02)',
                        },
                        '&.Mui-focused': {
                          transform: 'scale(1.02)',
                          boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 600,
                        color: '#475569',
                      },
                    },
                  },
                }}
              />
            </Grow>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
            <Grow in={true} timeout={800} style={{ transitionDelay: '200ms' }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  multiple
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value as string[])}
                  input={<OutlinedInput label="Status" />}
                  renderValue={(selected) => 
                    selected.map(s => statusOptions.find(opt => opt.value === s)?.label || s).join(', ')
                  }
                  MenuProps={MenuProps}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox checked={filters.status.indexOf(option.value) > -1} />
                      <ListItemText primary={option.label} />
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Grow>
          </Grid>

          {/* Segment Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
            <Grow in={true} timeout={800} style={{ transitionDelay: '300ms' }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel id="segment-filter-label">Segment</InputLabel>
                <Select
                  labelId="segment-filter-label"
                  multiple
                  value={filters.segments}
                  onChange={(e) => handleFilterChange('segments', e.target.value as string[])}
                  input={<OutlinedInput label="Segment" />}
                  renderValue={(selected) => selected.join(', ')}
                  MenuProps={MenuProps}
                >
                  {segmentOptions.map((segment) => (
                    <MenuItem key={segment} value={segment}>
                      <Checkbox checked={filters.segments.indexOf(segment) > -1} />
                      <ListItemText primary={segment} />
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Grow>
          </Grid>

          {/* Owner Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
            <Grow in={true} timeout={800} style={{ transitionDelay: '400ms' }}>
              <StyledFormControl fullWidth size="small" disabled={isLoadingOwners}>
                <InputLabel id="owner-filter-label">Owner</InputLabel>
                <Select
                  labelId="owner-filter-label"
                  multiple
                  value={filters.ownerIds}
                  onChange={(e) => handleFilterChange('ownerIds', e.target.value as string[])}
                  input={<OutlinedInput label="Owner" />}
                  renderValue={(selected) => selected.map(id => ownerMap[id] || id).join(', ')}
                  MenuProps={MenuProps}
                >
                  {(owners || []).map((owner) => (
                    <MenuItem key={owner.id} value={owner.id}>
                      <Checkbox checked={filters.ownerIds.indexOf(owner.id) > -1} />
                      <ListItemText primary={`${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim()} />
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Grow>
          </Grid>

          {/* Team Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
            <Grow in={true} timeout={800} style={{ transitionDelay: '500ms' }}>
              <StyledFormControl fullWidth size="small" disabled={isLoadingTeams}>
                <InputLabel id="team-filter-label">Team</InputLabel>
                <Select
                  labelId="team-filter-label"
                  multiple
                  value={filters.teamIds}
                  onChange={(e) => handleFilterChange('teamIds', e.target.value as string[])}
                  input={<OutlinedInput label="Team" />}
                  renderValue={(selected) => selected.map(id => teamMap[id] || id).join(', ')}
                  MenuProps={MenuProps}
                >
                  {(teams || []).map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      <Checkbox checked={filters.teamIds.indexOf(team.id) > -1} />
                      <ListItemText primary={team.name} />
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Grow>
          </Grid>
        </Grid>
      </FilterSection>

      {/* Table Section */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">Error loading daily tasks: {error?.message}</Alert>
      ) : !data || data.length === 0 ? (
        <Typography sx={{ mt: 2 }}>No daily tasks found matching filters.</Typography>
      ) : (
        <ModernPaper>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="daily tasks table">
              <StyledTableHead>
                <TableRow>
                  <TableCell>Segment</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Lead Owner</TableCell>
                  <TableCell>Lead Date</TableCell>
                  <TableCell>Close Reason</TableCell>
                  <TableCell>Scheduler</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {data.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onCloseTask={handleCloseTask}
                    onRescheduleTask={handleRescheduleTask}
                    formatDate={formatDate}
                    closeReasonOptions={closeReasonOptions}
                    isLoading={closeTaskMutation.isPending || rescheduleTaskMutation.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={response?.count || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </ModernPaper>
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

// TaskRow component for individual table rows
interface TaskRowProps {
  task: DailyTaskWithDetails;
  onCloseTask: (taskId: string, closeReason: CloseReason) => void;
  onRescheduleTask: (taskId: string, newDate: string) => void;
  formatDate: (dateString: string | null) => string;
  closeReasonOptions: { value: CloseReason; label: string }[];
  isLoading: boolean;
}

function TaskRow({ 
  task, 
  onCloseTask, 
  onRescheduleTask, 
  formatDate, 
  closeReasonOptions,
  isLoading 
}: TaskRowProps) {
  const [selectedCloseReason, setSelectedCloseReason] = useState<CloseReason | ''>('');
  const [rescheduleDate, setRescheduleDate] = useState<Dayjs | null>(null);

  const handleCloseReasonChange = (reason: CloseReason) => {
    setSelectedCloseReason(reason);
    if (reason && task.status === 'open') {
      onCloseTask(task.id, reason);
    }
  };

  const handleReschedule = () => {
    if (rescheduleDate) {
      onRescheduleTask(task.id, rescheduleDate.format('YYYY-MM-DD'));
      setRescheduleDate(null);
    }
  };

  return (
    <StyledTableRow>
      <TableCell>{task.lead?.segment ?? 'N/A'}</TableCell>
      <TableCell>{task.lead?.first_name ?? 'N/A'}</TableCell>
      <TableCell>{task.lead?.last_name ?? ''}</TableCell>
      <TableCell>
        {task.assigned_user?.first_name || task.assigned_user?.last_name 
          ? `${task.assigned_user?.first_name ?? ''} ${task.assigned_user?.last_name ?? ''}`.trim() 
          : 'Unassigned'}
      </TableCell>
      <TableCell>{formatDate(task.lead?.created_at)}</TableCell>
      <TableCell>
        {task.status === 'closed' && task.close_reason ? (
          <Typography variant="body2" color="success.main">
            {closeReasonOptions.find(opt => opt.value === task.close_reason)?.label || task.close_reason}
          </Typography>
        ) : (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedCloseReason}
              onChange={(e) => handleCloseReasonChange(e.target.value as CloseReason)}
              displayEmpty
              disabled={task.status === 'closed' || isLoading}
            >
              <MenuItem value="">
                <em>Select reason to close</em>
              </MenuItem>
              {closeReasonOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </TableCell>
      <TableCell>
        {task.status === 'open' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DatePicker
              label="New Date"
              value={rescheduleDate}
              onChange={setRescheduleDate}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 140 },
                },
              }}
              minDate={dayjs().add(1, 'day')}
            />
            <IconButton
              size="small"
              onClick={handleReschedule}
              disabled={!rescheduleDate || isLoading}
              sx={{ color: '#0ea5e9' }}
            >
              <ScheduleIcon />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Completed
          </Typography>
        )}
      </TableCell>
      <TableCell align="center">
        <Tooltip title="View/Edit Lead">
          <Link href={`/leads/${task.lead_id}/edit`} passHref target="_blank" rel="noopener noreferrer">
            <ModernIconButton size="small">
              <EditIcon fontSize="small" />
            </ModernIconButton>
          </Link>
        </Tooltip>
      </TableCell>
    </StyledTableRow>
  );
}