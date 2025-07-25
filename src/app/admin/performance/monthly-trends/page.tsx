'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Fade,
  Skeleton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { useRouter } from 'next/navigation';

import DateSelector from './_components/date-selector';
import AgentComparison from './_components/agent-comparison';
import SegmentComparison from './_components/segment-comparison';
import {
  getMonthlyComparisonData,
  getSegmentComparisonData,
  getMonthlyTrendsSummary,
  MonthlyComparisonData,
  SegmentComparisonData,
} from '@/lib/supabase/queries/monthly-comparison';
import {
  getTeams,
  TeamOption,
  segmentOptions,
} from '@/lib/supabase/queries/filters';

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

const ModernContainer = styled(Container)(({ theme }) => ({
  background: '#f8fafc',
  minHeight: '100vh',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

const ModernCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  animation: `${fadeInUp} 0.8s ease-out`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.06)',
  },
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

export default function MonthlyTrendsPage() {
  const router = useRouter();
  const [compareDate, setCompareDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Fetch teams for filtering
  const { data: teamOptions } = useQuery<TeamOption[], Error>({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  // Fetch summary data
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['monthlyTrendsSummary', compareDate],
    queryFn: () => getMonthlyTrendsSummary({ compareDate }),
    enabled: !!compareDate,
  });

  // Fetch agent comparison data
  const { 
    data: agentData, 
    isLoading: isAgentLoading, 
    error: agentError 
  } = useQuery<MonthlyComparisonData[], Error>({
    queryKey: ['monthlyComparison', compareDate, selectedSegments, selectedTeams],
    queryFn: () =>
      getMonthlyComparisonData({
        compareDate,
        segments: selectedSegments.length > 0 ? selectedSegments : undefined,
        teamIds: selectedTeams.length > 0 ? selectedTeams : undefined,
      }),
    enabled: !!compareDate,
  });

  // Fetch segment comparison data
  const { 
    data: segmentData, 
    isLoading: isSegmentLoading, 
    error: segmentError 
  } = useQuery<SegmentComparisonData[], Error>({
    queryKey: ['segmentComparison', compareDate],
    queryFn: () => getSegmentComparisonData({ compareDate }),
    enabled: !!compareDate,
  });

  const getTrendIcon = (changePercent: number, size: number = 24) => {
    if (changePercent > 0) {
      return <TrendingUpIcon sx={{ fontSize: size, color: '#059669' }} />;
    } else if (changePercent < 0) {
      return <TrendingDownIcon sx={{ fontSize: size, color: '#dc2626' }} />;
    } else {
      return <TrendingFlatIcon sx={{ fontSize: size, color: '#6b7280' }} />;
    }
  };

  const getTrendColor = (changePercent: number) => {
    if (changePercent > 0) return '#059669';
    if (changePercent < 0) return '#dc2626';
    return '#6b7280';
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  const handleSegmentChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedSegments(typeof value === 'string' ? value.split(',') : value);
  };

  const handleTeamChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTeams(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <ModernContainer maxWidth="xl">
      <Fade in={true} timeout={800}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ModernButton
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/admin/performance')}
                sx={{
                  borderColor: '#64748b',
                  color: '#64748b',
                  '&:hover': {
                    borderColor: '#475569',
                    backgroundColor: 'rgba(100, 116, 139, 0.04)',
                  },
                }}
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
                Monthly Trends Comparison
              </Typography>
            </Box>
          </Box>

          {/* Filters */}
          <ModernCard sx={{ mb: 3 }}>
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{
                  fontWeight: 600,
                  color: '#0f172a',
                  mb: 3,
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
                Comparison Settings
              </Typography>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <DateSelector
                    selectedDate={compareDate}
                    onDateChange={setCompareDate}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Segments</InputLabel>
                    <Select
                      multiple
                      value={selectedSegments}
                      onChange={handleSegmentChange}
                      input={<OutlinedInput label="Segments" />}
                      renderValue={(selected) => selected.join(', ')}
                      MenuProps={MenuProps}
                    >
                      {segmentOptions.map((segment) => (
                        <MenuItem key={segment} value={segment}>
                          <Checkbox checked={selectedSegments.indexOf(segment) > -1} />
                          <ListItemText primary={segment} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Teams</InputLabel>
                    <Select
                      multiple
                      value={selectedTeams}
                      onChange={handleTeamChange}
                      input={<OutlinedInput label="Teams" />}
                      renderValue={(selected) => {
                        if (selected.length === 0) return '';
                        if (selected.length === 1) {
                          return teamOptions?.find(t => t.id === selected[0])?.name ?? '';
                        }
                        return `${selected.length} selected`;
                      }}
                      MenuProps={MenuProps}
                    >
                      {teamOptions?.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          <Checkbox checked={selectedTeams.indexOf(team.id) > -1} />
                          <ListItemText primary={team.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </ModernCard>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <ModernCard>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 2 }}>
                    Total Disbursals
                  </Typography>
                  {isSummaryLoading ? (
                    <Skeleton variant="text" width="80%" height={40} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {summaryData?.current_count || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Current Month
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTrendIcon(summaryData?.count_change_percent || 0, 32)}
                        <Box>
                          <Typography 
                            variant="h6" 
                            sx={{ color: getTrendColor(summaryData?.count_change_percent || 0) }}
                          >
                            {summaryData?.count_change >= 0 ? '+' : ''}{summaryData?.count_change || 0}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ color: getTrendColor(summaryData?.count_change_percent || 0) }}
                          >
                            {formatPercent(summaryData?.count_change_percent || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </ModernCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ModernCard>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 2 }}>
                    Total Amount
                  </Typography>
                  {isSummaryLoading ? (
                    <Skeleton variant="text" width="80%" height={40} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {formatCurrency(summaryData?.current_amount || 0)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Current Month
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTrendIcon(summaryData?.amount_change_percent || 0, 32)}
                        <Box>
                          <Typography 
                            variant="h6" 
                            sx={{ color: getTrendColor(summaryData?.amount_change_percent || 0) }}
                          >
                            {formatCurrency(summaryData?.amount_change || 0)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ color: getTrendColor(summaryData?.amount_change_percent || 0) }}
                          >
                            {formatPercent(summaryData?.amount_change_percent || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </ModernCard>
            </Grid>
          </Grid>

          {/* Comparison Tables */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SegmentComparison 
                data={segmentData || []} 
                isLoading={isSegmentLoading} 
                error={segmentError} 
              />
            </Grid>
            <Grid item xs={12}>
              <AgentComparison 
                data={agentData || []} 
                isLoading={isAgentLoading} 
                error={agentError} 
              />
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </ModernContainer>
  );
}