'use client';

import React, { Suspense } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { styled, keyframes } from '@mui/material/styles';
import DailyTasksTable from './_components/daily-tasks-table';

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

const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    width: 6,
    height: 32,
    backgroundColor: '#0ea5e9',
    borderRadius: 3,
    marginRight: theme.spacing(2),
  },
}));

export default function DailyTasksPage() {
  return (
    <ModernContainer maxWidth="xl">
      <ContentSection>
        <PageTitle variant="h4">
          Daily Tasks
        </PageTitle>
        <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={400} />}>
          <DailyTasksTable />
        </Suspense>
      </ContentSection>
    </ModernContainer>
  );
}