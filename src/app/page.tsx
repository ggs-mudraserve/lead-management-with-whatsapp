'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to all applications
        router.replace('/all-applications');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading spinner while determining auth state
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f8fafc'
      }}
    >
      <CircularProgress />
    </Box>
  );
}