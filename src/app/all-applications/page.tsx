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
import { styled, keyframes } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';

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
const ModernContainer = styled(Container)(({ theme }) => ({
  background: '#f8fafc',
  minHeight: '100vh',
  paddingTop: theme.spacing(1),
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
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.06)',
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 160,
  width: '100%',
  maxWidth: 200,
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
  '& .MuiSelect-select': {
    paddingRight: '32px !important',
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

const ContentSection = styled(Box)(() => ({
  animation: `${fadeInUp} 1s ease-out 0.4s both`,
}));

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
            dateValue = (newValue as dayjs.Dayjs).format('YYYY-MM-DD');
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
        <ModernContainer maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            {canExport && (
              <Fade in={true} timeout={1200}>
                <ModernButton
                  variant="contained"
                  startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  onClick={handleExport}
                  disabled={isExporting}
                  sx={{
                    background: '#0ea5e9',
                    color: 'white',
                    '&:hover': {
                      background: '#0284c7',
                    },
                  }}
                >
                  {isExporting ? 'Exporting...' : 'Export to Excel'}
                </ModernButton>
              </Fade>
            )}
          </Box>

          <FilterSection>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
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
              Filter Applications
            </Typography>
            <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
                  <Grow in={true} timeout={800} style={{ transitionDelay: '100ms' }}>
                    <StyledFormControl fullWidth size="small">
                      <InputLabel id="segment-filter-label">Segment</InputLabel>
                      <Select
                        labelId="segment-filter-label"
                        multiple
                        value={filters.segments || []}
                        onChange={(e) => handleMultiSelectChange(e, 'segments')}
                        input={<OutlinedInput label="Segment" />}
                        renderValue={(selected) => selected.join(', ')}
                        MenuProps={MenuProps}
                        sx={{
                          '& .MuiSelect-select': {
                            transition: 'all 0.3s ease',
                          },
                        }}
                      >
                        {segmentOptions.map((segment: string) => (
                          <MenuItem key={segment} value={segment}>
                            <Checkbox checked={(filters.segments || []).indexOf(segment) > -1} />
                            <ListItemText primary={segment} />
                          </MenuItem>
                        ))}
                      </Select>
                    </StyledFormControl>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
                  <Grow in={true} timeout={800} style={{ transitionDelay: '200ms' }}>
                    <StyledFormControl fullWidth size="small">
                      <InputLabel id="stage-filter-label">Stage</InputLabel>
                      <Select
                        labelId="stage-filter-label"
                        multiple
                        value={filters.stages || []}
                        onChange={(e) => handleMultiSelectChange(e, 'stages')}
                        input={<OutlinedInput label="Stage" />}
                        renderValue={(selected) => selected.join(', ')}
                        MenuProps={MenuProps}
                        sx={{
                          '& .MuiSelect-select': {
                            transition: 'all 0.3s ease',
                          },
                        }}
                      >
                        {leadStageOptions.map((stage: string) => (
                          <MenuItem key={stage} value={stage}>
                            <Checkbox checked={(filters.stages || []).indexOf(stage) > -1} />
                            <ListItemText primary={stage} />
                          </MenuItem>
                        ))}
                      </Select>
                    </StyledFormControl>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
                  <Grow in={true} timeout={800} style={{ transitionDelay: '300ms' }}>
                    <StyledFormControl fullWidth size="small" disabled={isLoadingOwners}>
                      <InputLabel id="owner-filter-label">Lead Owner</InputLabel>
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
                        sx={{
                          '& .MuiSelect-select': {
                            transition: 'all 0.3s ease',
                          },
                        }}
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
                    </StyledFormControl>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
                  <Grow in={true} timeout={800} style={{ transitionDelay: '400ms' }}>
                    <StyledFormControl fullWidth size="small" disabled={isLoadingTeams}>
                      <InputLabel id="team-filter-label">Team</InputLabel>
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
                        sx={{
                          '& .MuiSelect-select': {
                            transition: 'all 0.3s ease',
                          },
                        }}
                      >
                        {teamOptions?.map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            <Checkbox checked={(filters.teams || []).indexOf(team.id) > -1} />
                            <ListItemText primary={team.name} />
                          </MenuItem>
                        ))}
                        {isLoadingTeams && <MenuItem disabled>Loading...</MenuItem>}
                      </Select>
                    </StyledFormControl>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
                  <Grow in={true} timeout={800} style={{ transitionDelay: '500ms' }}>
                    <DatePicker
                      label="Login Date Start"
                      value={filters.loginDateStart ? dayjs(filters.loginDateStart) : null}
                      onChange={(newValue) => handleDateChange(newValue, 'loginDateStart')}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          sx: {
                            minWidth: 160,
                            maxWidth: 200,
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
                <Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
                  <Grow in={true} timeout={800} style={{ transitionDelay: '600ms' }}>
                    <DatePicker
                      label="Login Date End"
                      value={filters.loginDateEnd ? dayjs(filters.loginDateEnd) : null}
                      onChange={(newValue) => handleDateChange(newValue, 'loginDateEnd')}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          sx: {
                            minWidth: 160,
                            maxWidth: 200,
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
            </Grid>

          </FilterSection>

          <ContentSection>
            <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={400} />}>
              <AllApplicationsTable filters={filters} />
            </Suspense>
          </ContentSection>
        </ModernContainer>
  );
}