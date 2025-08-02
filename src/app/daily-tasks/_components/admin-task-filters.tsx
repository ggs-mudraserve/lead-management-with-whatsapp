'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import Grow from '@mui/material/Grow';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Database } from '@/lib/supabase/database.types';

// Keyframes for animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
const AdminFilterSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
  marginBottom: theme.spacing(3),
  animation: `${fadeInUp} 0.8s ease-out 0.3s both`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 180,
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    minHeight: 40,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      transform: 'scale(1.02)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      transform: 'scale(1.02)',
      boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.2)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.8)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.8)',
    '&.Mui-focused': {
      color: 'white',
    },
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.8)',
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}));

const ViewTypeChip = styled(Chip)<{ selected?: boolean }>(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  borderRadius: theme.spacing(2),
  fontWeight: 600,
  transition: 'all 0.3s ease',
  backgroundColor: selected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  border: `1px solid ${selected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'}`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: 'scale(1.05)',
  },
  '&:focus': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
}));

// Interfaces
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

interface AdminTaskFiltersProps {
  filters: AdminFilters;
  onFiltersChange: (filters: Partial<AdminFilters>) => void;
  owners: Array<{ id: string; first_name: string | null; last_name: string | null }>;
  teams: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { 
  PaperProps: { 
    style: { 
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, 
      width: 250,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    } 
  } 
};

const segmentOptions: Database['public']['Enums']['segment_type'][] = ['PL', 'BL', 'PL_DIGITAL', 'BL_DIGITAL'];
const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const viewTypeOptions = [
  { value: 'agent', label: 'Agent View', icon: '👤' },
  { value: 'segment', label: 'Segment View', icon: '📊' },
  { value: 'team', label: 'Team View', icon: '👥' },
  { value: 'date', label: 'Date View', icon: '📅' },
  { value: 'status', label: 'Status View', icon: '✅' },
] as const;

const quickDateOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
] as const;

export default function AdminTaskFilters({
  filters,
  onFiltersChange,
  owners,
  teams,
  isLoading = false,
}: AdminTaskFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const handleViewTypeChange = (viewType: AdminFilters['viewType']) => {
    onFiltersChange({ viewType });
  };

  const handleQuickDateChange = (quickDate: AdminFilters['quickDateFilter']) => {
    let dateRange = { startDate: null, endDate: null };
    
    switch (quickDate) {
      case 'today':
        dateRange = {
          startDate: dayjs(),
          endDate: dayjs(),
        };
        break;
      case 'week':
        dateRange = {
          startDate: dayjs().startOf('week'),
          endDate: dayjs().endOf('week'),
        };
        break;
      case 'month':
        dateRange = {
          startDate: dayjs().startOf('month'),
          endDate: dayjs().endOf('month'),
        };
        break;
      case 'custom':
        dateRange = { startDate: null, endDate: null };
        break;
    }

    onFiltersChange({ 
      quickDateFilter: quickDate,
      dateRange 
    });
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: Dayjs | null) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
      quickDateFilter: 'custom',
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      viewType: null,
      dateRange: { startDate: null, endDate: null },
      quickDateFilter: null,
      segments: [],
      ownerIds: [],
      teamIds: [],
      status: ['open'],
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.viewType) count++;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.segments.length > 0) count++;
    if (filters.ownerIds.length > 0) count++;
    if (filters.teamIds.length > 0) count++;
    if (filters.status.length !== 1 || filters.status[0] !== 'open') count++;
    return count;
  };

  return (
    <AdminFilterSection>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FilterListIcon />
          Admin Advanced Filters
          {getActiveFiltersCount() > 0 && (
            <Chip
              label={`${getActiveFiltersCount()} active`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            />
          )}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ModernButton
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={getActiveFiltersCount() === 0}
          >
            Clear All
          </ModernButton>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{ color: 'white' }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* View Type Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          View Type
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {viewTypeOptions.map((option) => (
            <ViewTypeChip
              key={option.value}
              label={`${option.icon} ${option.label}`}
              selected={filters.viewType === option.value}
              onClick={() => handleViewTypeChange(option.value)}
              clickable
            />
          ))}
        </Box>
      </Box>

      {/* Quick Date Filters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Date Range
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {quickDateOptions.map((option) => (
            <ViewTypeChip
              key={option.value}
              label={option.label}
              selected={filters.quickDateFilter === option.value}
              onClick={() => handleQuickDateChange(option.value)}
              clickable
            />
          ))}
        </Box>
        
        {filters.quickDateFilter === 'custom' && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <DatePicker
                label="Start Date"
                value={filters.dateRange.startDate}
                onChange={(value) => handleDateRangeChange('startDate', value)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="End Date"
                value={filters.dateRange.endDate}
                onChange={(value) => handleDateRangeChange('endDate', value)}
                minDate={filters.dateRange.startDate || undefined}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                      },
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Grid container spacing={2}>
          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <Grow in={expanded} timeout={800} style={{ transitionDelay: '100ms' }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel id="admin-status-filter-label">Status</InputLabel>
                <Select
                  labelId="admin-status-filter-label"
                  multiple
                  value={filters.status}
                  onChange={(e) => onFiltersChange({ status: e.target.value as string[] })}
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
          <Grid item xs={12} sm={6} md={3}>
            <Grow in={expanded} timeout={800} style={{ transitionDelay: '200ms' }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel id="admin-segment-filter-label">Segment</InputLabel>
                <Select
                  labelId="admin-segment-filter-label"
                  multiple
                  value={filters.segments}
                  onChange={(e) => onFiltersChange({ segments: e.target.value as string[] })}
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
          <Grid item xs={12} sm={6} md={3}>
            <Grow in={expanded} timeout={800} style={{ transitionDelay: '300ms' }}>
              <StyledFormControl fullWidth size="small" disabled={isLoading}>
                <InputLabel id="admin-owner-filter-label">Owner</InputLabel>
                <Select
                  labelId="admin-owner-filter-label"
                  multiple
                  value={filters.ownerIds}
                  onChange={(e) => onFiltersChange({ ownerIds: e.target.value as string[] })}
                  input={<OutlinedInput label="Owner" />}
                  renderValue={(selected) => 
                    selected.map(id => {
                      const owner = owners.find(o => o.id === id);
                      return owner ? `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim() : id;
                    }).join(', ')
                  }
                  MenuProps={MenuProps}
                >
                  {owners.map((owner) => (
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
          <Grid item xs={12} sm={6} md={3}>
            <Grow in={expanded} timeout={800} style={{ transitionDelay: '400ms' }}>
              <StyledFormControl fullWidth size="small" disabled={isLoading}>
                <InputLabel id="admin-team-filter-label">Team</InputLabel>
                <Select
                  labelId="admin-team-filter-label"
                  multiple
                  value={filters.teamIds}
                  onChange={(e) => onFiltersChange({ teamIds: e.target.value as string[] })}
                  input={<OutlinedInput label="Team" />}
                  renderValue={(selected) => 
                    selected.map(id => {
                      const team = teams.find(t => t.id === id);
                      return team ? team.name : id;
                    }).join(', ')
                  }
                  MenuProps={MenuProps}
                >
                  {teams.map((team) => (
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
      </Collapse>
    </AdminFilterSection>
  );
}