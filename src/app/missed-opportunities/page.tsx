'use client';

import React, { Suspense } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import { styled, keyframes } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import MissedOpportunitiesTable from './_components/missed-opportunities-table';

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

const ContentSection = styled(Box)(() => ({
  animation: `${fadeInUp} 1s ease-out 0.4s both`,
}));

export default function MissedOpportunitiesPage() {
  return (
    <ModernContainer maxWidth="xl">
      <ContentSection>
        <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={400} />}>
          <MissedOpportunitiesTable />
        </Suspense>
      </ContentSection>
    </ModernContainer>
  );
} 