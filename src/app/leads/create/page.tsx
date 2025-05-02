'use client';

import React, { Suspense } from 'react';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
// Note the relative path difference compared to the edit page
import { LeadForm } from '../_components/lead-form';

// This page handles the /leads/create route
export default function LeadCreatePage() {
    return (
        <Container maxWidth="md"> {/* Add container for layout */}
            <Suspense
                fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                }
            >
                 {/* The LeadForm component internally checks if it's in create mode */}
                 <LeadForm />
            </Suspense>
        </Container>
    );
} 