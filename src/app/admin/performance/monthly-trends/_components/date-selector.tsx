'use client';

import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDateField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    background: '#ffffff',
    '&:hover fieldset': {
      borderColor: '#0ea5e9',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0ea5e9',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    '&.Mui-focused': {
      color: '#0ea5e9',
    },
  },
}));

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(event.target.value);
  };

  // Get formatted date for display
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const currentMonth = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' });
    const day = date.getDate();
    
    return `${currentMonth} ${day} vs ${previousMonth} ${day}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <StyledDateField
        id="compare-date"
        label="Compare Date"
        type="date"
        size="small"
        value={selectedDate}
        onChange={handleDateChange}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{ minWidth: 200 }}
      />
      {selectedDate && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#64748b',
            fontWeight: 500,
            fontSize: '0.75rem'
          }}
        >
          Comparing: {formatDateForDisplay(selectedDate)}
        </Typography>
      )}
    </Box>
  );
}