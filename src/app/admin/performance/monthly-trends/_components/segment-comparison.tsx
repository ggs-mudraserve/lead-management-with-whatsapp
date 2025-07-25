'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SegmentComparisonData } from '@/lib/supabase/queries/monthly-comparison';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: '#0f172a !important',
  '& .MuiTableCell-root': {
    background: 'transparent !important',
    backgroundColor: 'transparent !important',
    color: 'white !important',
    fontWeight: '700 !important',
    fontSize: '0.875rem !important',
    borderBottom: 'none !important',
    padding: `${theme.spacing(2)} !important`,
  },
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  overflow: 'hidden',
}));

interface SegmentComparisonProps {
  data: SegmentComparisonData[];
  isLoading: boolean;
  error: Error | null;
}

export default function SegmentComparison({ data, isLoading, error }: SegmentComparisonProps) {
  const getTrendIcon = (changePercent: number) => {
    if (changePercent > 0) {
      return <TrendingUpIcon sx={{ fontSize: 20, color: '#059669' }} />;
    } else if (changePercent < 0) {
      return <TrendingDownIcon sx={{ fontSize: 20, color: '#dc2626' }} />;
    } else {
      return <TrendingFlatIcon sx={{ fontSize: 20, color: '#6b7280' }} />;
    }
  };

  const getTrendColor = (changePercent: number) => {
    if (changePercent > 0) return '#059669';
    if (changePercent < 0) return '#dc2626';
    return '#6b7280';
  };

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'PL': { bg: '#e0f2fe', text: '#0369a1' },
      'BL': { bg: '#f0fdf4', text: '#166534' },
      'PL_DIGITAL': { bg: '#fef3c7', text: '#d97706' },
      'BL_DIGITAL': { bg: '#fce7f3', text: '#be185d' },
    };
    return colors[segment] || { bg: '#f1f5f9', text: '#475569' };
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

  if (isLoading) {
    return (
      <ModernPaper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
          Loading segment comparison data...
        </Typography>
      </ModernPaper>
    );
  }

  if (error) {
    return (
      <ModernPaper sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading segment comparison: {error.message}
        </Alert>
      </ModernPaper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ModernPaper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          No segment comparison data available for the selected period.
        </Typography>
      </ModernPaper>
    );
  }

  return (
    <ModernPaper>
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
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
              backgroundColor: '#10b981',
              borderRadius: 2,
              mr: 2,
            },
          }}
        >
          Segment-wise Performance Comparison
        </Typography>
      </Box>
      
      <TableContainer>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell>Segment</TableCell>
              <TableCell align="center">Current Month</TableCell>
              <TableCell align="center">Previous Month</TableCell>
              <TableCell align="center">Count Change</TableCell>
              <TableCell align="center">Amount Change</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {data.map((row, index) => {
              const segmentColors = getSegmentColor(row.segment);
              return (
                <TableRow 
                  key={`${row.segment}-${index}`}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Chip 
                      label={row.segment} 
                      size="medium"
                      sx={{ 
                        backgroundColor: segmentColors.bg,
                        color: segmentColors.text,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        minWidth: 100
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a' }}>
                        {row.current_month_count}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatCurrency(row.current_month_amount)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a' }}>
                        {row.previous_month_count}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatCurrency(row.previous_month_amount)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {getTrendIcon(row.count_change_percent)}
                      <Box>
                        <Typography 
                          variant="body1" 
                          fontWeight={700}
                          sx={{ color: getTrendColor(row.count_change_percent) }}
                        >
                          {row.count_change >= 0 ? '+' : ''}{row.count_change}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ color: getTrendColor(row.count_change_percent) }}
                        >
                          {formatPercent(row.count_change_percent)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {getTrendIcon(row.amount_change_percent)}
                      <Box>
                        <Typography 
                          variant="body1" 
                          fontWeight={700}
                          sx={{ color: getTrendColor(row.amount_change_percent) }}
                        >
                          {formatCurrency(row.amount_change)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ color: getTrendColor(row.amount_change_percent) }}
                        >
                          {formatPercent(row.amount_change_percent)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </ModernPaper>
  );
}