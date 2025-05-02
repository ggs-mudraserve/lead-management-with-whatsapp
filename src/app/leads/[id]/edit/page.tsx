'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation'; // Import useParams
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography'; // Import Typography
import { LeadForm } from '../../_components/lead-form'; // Corrected import path
import { LeadNotesSection } from './_components/lead-notes-section'; // Import the new component
import { LeadDocumentsSection } from './_components/lead-documents-section'; // Import the new component
import { AssociatedBankApplications } from './_components/AssociatedBankApplications'; // Import the new component

// This page now simply wraps the reusable form in Suspense and provides layout
// export default function LeadEditPage() {
export default function LeadEditPage() {
    const params = useParams();
    const leadId = params?.id as string; // Safely access id, type assertion

    // Basic validation or handling if leadId is missing/invalid
    if (!leadId) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Typography color="error">Lead ID not found in URL.</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md"> {/* Add container for layout */}
            <Suspense
                fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                }
            >
                 <LeadForm /> {/* Render the reusable form */}
                 {/* Render the Notes Section below the form */}
                 <LeadNotesSection leadId={leadId} />
                 {/* Add the Documents Section below notes */}
                 <LeadDocumentsSection leadId={leadId} />
                 {/* Add the Associated Bank Applications section */}
                 <AssociatedBankApplications leadId={leadId} />
            </Suspense>
        </Container>
    );
}

// Define types/interfaces if needed
// interface LeadEditCreatePageProps { ... }