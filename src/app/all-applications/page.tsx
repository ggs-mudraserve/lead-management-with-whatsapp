'use client';

import React, { useState, Suspense } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import DownloadIcon from '@mui/icons-material/Download';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

import { AllApplicationsTable } from './_components/all-applications-table';
import Skeleton from '@mui/material/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  segmentOptions,
  leadStageOptions,
  getActiveLeadOwners,
  getTeams,
  UserOption,
  TeamOption,
} from '../../lib/supabase/queries/filters';
import {
    BankApplicationFilters,
    getAllFilteredBankApplications,
    BankApplicationRow
} from '../../lib/supabase/queries/all-applications';
import { useAuth } from '../../context/AuthContext';

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

export default function AllApplicationsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  const [filters, setFilters] = useState<Omit<BankApplicationFilters, 'page' | 'rowsPerPage'>>({
    segments: [],
    stages: [],
    owners: [],
    teams: [],
    loginDateStart: null,
    loginDateEnd: null,
  });

  const { data: ownerOptions, isLoading: isLoadingOwners } = useQuery<UserOption[], Error>({
    queryKey: ['activeLeadOwners'],
    queryFn: getActiveLeadOwners,
  });

  const { data: teamOptions, isLoading: isLoadingTeams } = useQuery<TeamOption[], Error>({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  const handleMultiSelectChange = (event: SelectChangeEvent<string[]>, field: keyof BankApplicationFilters) => {
    const { target: { value } } = event;
    setFilters((prev: Omit<BankApplicationFilters, 'page' | 'rowsPerPage'>) => ({
      ...prev,
      [field]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleDateChange = (newValue: unknown | null, field: 'loginDateStart' | 'loginDateEnd') => {
    setFilters((prev: Omit<BankApplicationFilters, 'page' | 'rowsPerPage'>) => {
        let dateValue: string | null = null;

        // Handle dayjs object
        if (newValue && dayjs.isDayjs(newValue)) {
            dateValue = (newValue as any).format('YYYY-MM-DD');
        }
        // Handle Date object (fallback)
        else if (newValue instanceof Date) {
            try {
                dateValue = newValue.toISOString().split('T')[0];
            } catch (e) {
                console.error("Error formatting date:", e);
                dateValue = null;
            }
        }

        return {
            ...prev,
            [field]: dateValue,
        }
    });
  };

  const handleExport = async () => {
    if (!profile || !['admin', 'backend'].includes(profile.role ?? '')) {
      alert('Permission denied.');
      return;
    }
    setIsExporting(true);
    try {
      const dataToExport = await queryClient.fetchQuery<BankApplicationRow[], Error>({
           queryKey: ['allBankApplicationsForExport', filters],
           queryFn: () => getAllFilteredBankApplications(filters),
           staleTime: 5 * 60 * 1000,
      });

      if (!dataToExport || dataToExport.length === 0) {
        alert('No data found for the selected filters to export.');
        return;
      }

      const headers = [
        'Segment', 'First Name', 'Last Name', 'Approved Amount', 'Bank Name',
        'Lead Stage', 'Login Date', 'Lead Owner', 'Team'
      ];

      const sheetData = [
        headers,
        ...dataToExport.map(row => [
          row.lead_segment,
          row.lead_first_name,
          row.lead_last_name,
          row.approved_amount,
          row.bank_name,
          row.lead_stage,
          row.login_date ? new Date(row.login_date).toLocaleDateString() : null,
          row.lead_owner_name,
          row.team_name
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Applications');

      XLSX.writeFile(wb, 'Bank_Applications_Export.xlsx');

    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = profile && ['admin', 'backend'].includes(profile.role ?? '');

  return (
        <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="h4" component="h1">
                    All Bank Applications
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

            <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
                <Grid item xs={12} sm={6} md={2} sx={{ width: '160px' }}>
                    <FormControl fullWidth size="small" sx={{ width: '160px' }}>
                    <InputLabel id="segment-filter-label" sx={{ fontWeight: 'bold' }}>Segment</InputLabel>
                    <Select
                        labelId="segment-filter-label"
                        multiple
                        value={filters.segments || []}
                        onChange={(e) => handleMultiSelectChange(e, 'segments')}
                        input={<OutlinedInput label="Segment" />}
                        renderValue={(selected) => selected.join(', ')}
                        MenuProps={MenuProps}
                        sx={{ width: '160px' }}
                    >
                        {segmentOptions.map((segment: string) => (
                        <MenuItem key={segment} value={segment}>
                            <Checkbox checked={(filters.segments || []).indexOf(segment) > -1} />
                            <ListItemText primary={segment} />
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2} sx={{ width: '160px' }}>
                     <FormControl fullWidth size="small" sx={{ width: '160px' }}>
                    <InputLabel id="stage-filter-label" sx={{ fontWeight: 'bold' }}>Stage</InputLabel>
                    <Select
                        labelId="stage-filter-label"
                        multiple
                        value={filters.stages || []}
                        onChange={(e) => handleMultiSelectChange(e, 'stages')}
                        input={<OutlinedInput label="Stage" />}
                        renderValue={(selected) => selected.join(', ')}
                        MenuProps={MenuProps}
                        sx={{ width: '160px' }}
                    >
                        {leadStageOptions.map((stage: string) => (
                        <MenuItem key={stage} value={stage}>
                            <Checkbox checked={(filters.stages || []).indexOf(stage) > -1} />
                            <ListItemText primary={stage} />
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>

                 <Grid item xs={12} sm={6} md={2} sx={{ width: '160px' }}>
                    <FormControl fullWidth size="small" disabled={isLoadingOwners} sx={{ width: '160px' }}>
                        <InputLabel id="owner-filter-label" sx={{ fontWeight: 'bold' }}>Lead Owner</InputLabel>
                        <Select
                            labelId="owner-filter-label"
                            multiple
                            value={filters.owners || []}
                            onChange={(e) => handleMultiSelectChange(e, 'owners')}
                            input={<OutlinedInput label="Lead Owner" />}
                            renderValue={(selected) => {
                                if (selected.length === 0) return '';
                                return selected
                                    .map((id: string) => {
                                        if (id === 'unassigned') return 'Unassigned';
                                        return ownerOptions?.find(opt => opt.id === id)?.name ?? id;
                                    })
                                    .join(', ');
                            }}
                            MenuProps={MenuProps}
                            sx={{ width: '160px' }}
                        >
                            {/* Special option for unassigned leads - only visible to admin users */}
                            {profile?.role === 'admin' &&
                                <MenuItem key="unassigned" value="unassigned">
                                    <Checkbox checked={(filters.owners || []).indexOf('unassigned') > -1} />
                                    <ListItemText primary="Unassigned" />
                                </MenuItem>
                            }

                            {/* Divider between unassigned and regular users */}
                            {profile?.role === 'admin' &&
                                <Divider sx={{ my: 1 }} />
                            }

                            {ownerOptions?.map((owner) => (
                                <MenuItem key={owner.id} value={owner.id}>
                                    <Checkbox checked={(filters.owners || []).indexOf(owner.id) > -1} />
                                    <ListItemText primary={owner.name} />
                                </MenuItem>
                            ))}
                            {isLoadingOwners && <MenuItem disabled>Loading...</MenuItem>}
                        </Select>
                    </FormControl>
                </Grid>

                 <Grid item xs={12} sm={6} md={2} sx={{ width: '160px' }}>
                    <FormControl fullWidth size="small" disabled={isLoadingTeams} sx={{ width: '160px' }}>
                        <InputLabel id="team-filter-label" sx={{ fontWeight: 'bold' }}>Team</InputLabel>
                        <Select
                            labelId="team-filter-label"
                            multiple
                            value={filters.teams || []}
                            onChange={(e) => handleMultiSelectChange(e, 'teams')}
                            input={<OutlinedInput label="Team" />}
                            renderValue={(selected) => {
                                if (selected.length === 0) return '';
                                return selected
                                    .map((id: string) => teamOptions?.find(opt => opt.id === id)?.name ?? id)
                                    .join(', ');
                            }}
                            MenuProps={MenuProps}
                            sx={{ width: '160px' }}
                        >
                            {teamOptions?.map((team) => (
                                <MenuItem key={team.id} value={team.id}>
                                    <Checkbox checked={(filters.teams || []).indexOf(team.id) > -1} />
                                    <ListItemText primary={team.name} />
                                </MenuItem>
                            ))}
                            {isLoadingTeams && <MenuItem disabled>Loading...</MenuItem>}
                        </Select>
                    </FormControl>
                </Grid>

                 <Grid item xs={12} sm={6} md={2} sx={{ width: '160px' }}>
                    <DatePicker
                        label="Login Date Start"
                        value={filters.loginDateStart ? dayjs(filters.loginDateStart) : null}
                        onChange={(newValue) => handleDateChange(newValue, 'loginDateStart')}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                                sx: { width: '160px' },
                                InputLabelProps: {
                                    sx: { fontWeight: 'bold' }
                                }
                            }
                        }}
                    />
                 </Grid>
                 <Grid item xs={12} sm={6} md={2} sx={{ width: '160px' }}>
                    <DatePicker
                        label="Login Date End"
                        value={filters.loginDateEnd ? dayjs(filters.loginDateEnd) : null}
                        onChange={(newValue) => handleDateChange(newValue, 'loginDateEnd')}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                                sx: { width: '160px' },
                                InputLabelProps: {
                                    sx: { fontWeight: 'bold' }
                                }
                            }
                        }}
                    />
                 </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
            <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={400} />}>
                 <AllApplicationsTable filters={filters} />
            </Suspense>
            </Box>
        </Box>
        </Container>
  );
}