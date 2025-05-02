'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../../lib/supabase/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Link from 'next/link';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import { CreateBankApplicationDialog } from './CreateBankApplicationDialog';
import Snackbar from '@mui/material/Snackbar';

interface AssociatedBankApplicationsProps {
    leadId: string;
}

interface BankApplicationSummary {
    id: string;
    bank_name: string;
    lead_stage: string | null;
    applied_amount: number | null;
}

async function fetchAssociatedBankApps(leadId: string): Promise<BankApplicationSummary[]> {
    const { data, error } = await supabase
        .from('bank_application')
        .select('id, bank_name, lead_stage, applied_amount')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching associated bank applications:', error);
        throw new Error('Failed to fetch associated bank applications.');
    }
    return data || [];
}

export function AssociatedBankApplications({ leadId }: AssociatedBankApplicationsProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const { data: applications, isLoading, error, isError } = useQuery<BankApplicationSummary[], Error>({
        queryKey: ['associatedBankApps', leadId],
        queryFn: () => fetchAssociatedBankApps(leadId),
    });

    const handleOpenCreateDialog = () => {
        setIsCreateDialogOpen(true);
    };

    const handleCloseCreateDialog = () => {
        setIsCreateDialogOpen(false);
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                    Associated Bank Applications
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                    size="small"
                >
                    Create New
                </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                </Box>
            )}
            {isError && (
                <Alert severity="error" sx={{ my: 2 }}>
                    Error loading applications: {error?.message}
                </Alert>
            )}
            {!isLoading && !isError && (
                <List dense>
                    {applications && applications.length > 0 ? (
                        applications.map((app) => (
                            <ListItem
                                key={app.id}
                                divider
                                secondaryAction={
                                    <Link href={`/bank-applications/${app.id}/edit`}>
                                        <IconButton edge="end" aria-label="edit">
                                            <EditIcon />
                                        </IconButton>
                                    </Link>
                                }
                            >
                                <ListItemText
                                    primary={app.bank_name}
                                    secondary={`Stage: ${app.lead_stage || 'N/A'} | Applied Amount: ${formatCurrency(app.applied_amount)}`}
                                />
                            </ListItem>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                            No associated bank applications found.
                        </Typography>
                    )}
                </List>
            )}

            <CreateBankApplicationDialog
                open={isCreateDialogOpen}
                onClose={handleCloseCreateDialog}
                leadId={leadId}
                onSuccess={(message) => showSnackbar(message, 'success')}
                onError={(message) => showSnackbar(message, 'error')}
            />

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
} 