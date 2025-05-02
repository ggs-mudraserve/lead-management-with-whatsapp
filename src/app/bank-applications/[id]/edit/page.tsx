'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CircularProgress, Typography, Alert, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
// Import the exported client instance directly
import { supabase } from '@/lib/supabase/client';
import { fetchBankApplicationById } from '@/lib/supabase/queries/bank-applications';

// Import the form component from the _components subfolder
import BankApplicationForm from './_components/BankApplicationForm';

export default function BankApplicationEditPage() {
  const params = useParams();
  const id = params?.id as string;
  // No need to call createClient(), supabase is the instance
  // const supabase = createClient(); 

  const {
    data: applicationData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['bankApplication', id],
    queryFn: async () => {
      if (!id) throw new Error('ID is required');
      return fetchBankApplicationById(supabase, id);
    },
    enabled: !!id,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (!id) {
    return <Alert severity="error">Bank Application ID not found in URL.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Bank Application
      </Typography>
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && (
        <Alert severity="error">
          Error loading application data: {error instanceof Error ? error.message : 'An unknown error occurred'}
        </Alert>
      )}
      {applicationData && (
        <BankApplicationForm applicationData={applicationData} />
      )}
    </Box>
  );
} 