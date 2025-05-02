'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../../lib/supabase/client';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid'; // For layout
import Typography from '@mui/material/Typography';

interface CreateBankApplicationDialogProps {
    open: boolean;
    onClose: () => void;
    leadId: string;
    onSuccess: (message: string) => void; // Callback for success message
    onError: (message: string) => void;   // Callback for error message
}

interface Bank {
    name: string;
    // Add other fields if needed
}

// Interface for RPC parameters based on databasedetails.md
interface InsertBankAppParams {
    p_lead_id: string;
    p_bank_name: string;
    p_loan_app_number: string | null;
    p_applied_amount: number | null;
    p_login_date: string | null; // Sending as ISO string YYYY-MM-DD
    // p_lead_stage defaults to 'New' in the function
}

// Expected JSON response from RPC based on PRD/DB details
interface RpcResponse {
    id?: string; // UUID on success
    errorCode?: string;
    message?: string;
}

// Fetch banks for dropdown
async function fetchBanks(): Promise<Bank[]> {
    const { data, error } = await supabase
        .from('bank')
        .select('name')
        .order('name');
    if (error) {
        console.error('Error fetching banks:', error);
        throw new Error('Failed to fetch banks.');
    }
    return data || [];
}

// RPC call mutation function
async function createBankApplication(params: InsertBankAppParams): Promise<RpcResponse> {
    // Revert to original rpc call signature
    // const { data, error } = await supabase.rpc<RpcResponse, InsertBankAppParams>('insert_bank_application', params);
    const { data, error } = await supabase.rpc<RpcResponse>('insert_bank_application', params);

    if (error) {
        console.error('RPC Error inserting bank application:', error);
        throw new Error(`Failed to create application: ${error.message}`);
    }

    // Explicitly cast data to RpcResponse type for checking
    const responseData = data as RpcResponse | null;

    // if (typeof data !== 'object' || data === null) {
    if (typeof responseData !== 'object' || responseData === null) {
        console.error('Unexpected RPC response format:', responseData);
        throw new Error('Unexpected format received from create application function.');
    }

    // Check properties on the casted type
    // if (data.errorCode) {
    if (responseData.errorCode) {
        // throw new Error(data.message || 'An error occurred during application creation.');
        throw new Error(responseData.message || 'An error occurred during application creation.');
    }

    // if (!data.id) {
    if (!responseData.id) {
        console.warn('RPC success but no ID returned:', responseData);
    }

    // return data; // Return the original data which might be typed as 'object' by default
    return responseData; // Return the casted response
}

export function CreateBankApplicationDialog({ open, onClose, leadId, onSuccess, onError }: CreateBankApplicationDialogProps) {
    const queryClient = useQueryClient();
    const [bankName, setBankName] = useState('');
    const [loanAppNumber, setLoanAppNumber] = useState('');
    const [appliedAmount, setAppliedAmount] = useState<number | string>('');
    const [loginDate, setLoginDate] = useState('');
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Fetch banks query
    const { data: banks, isLoading: isLoadingBanks, error: banksError } = useQuery<Bank[], Error>({
        queryKey: ['banksList'],
        queryFn: fetchBanks,
        enabled: open, // Only fetch when the dialog is open
        staleTime: Infinity, // Bank list doesn't change often
        gcTime: Infinity,
    });

    // Create mutation
    const createMutation = useMutation<RpcResponse, Error, InsertBankAppParams>({
        mutationFn: createBankApplication,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['associatedBankApps', leadId] }); // Refresh list on lead page
            onSuccess(`Bank application (ID: ${data.id?.substring(0, 6)}...) created successfully!`);
            resetFormAndClose();
        },
        onError: (error) => {
            onError(`Error creating application: ${error.message}`);
             // Potentially parse specific errors from message if needed
        },
    });

    useEffect(() => {
        // Reset form when dialog opens/closes or leadId changes (though leadId shouldn't change while open)
        if (!open) {
            resetFormFields();
        }
    }, [open]);

    const resetFormFields = () => {
        setBankName('');
        setLoanAppNumber('');
        setAppliedAmount('');
        setLoginDate('');
        setFormErrors({});
    };

    const resetFormAndClose = () => {
        resetFormFields();
        onClose();
    };

    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};
        let isValid = true;

        if (!bankName) {
            errors.bankName = 'Bank name is required.';
            isValid = false;
        }
        if (appliedAmount === '' || appliedAmount === null) {
             errors.appliedAmount = 'Applied amount is required.';
             isValid = false;
        } else if (isNaN(Number(appliedAmount)) || Number(appliedAmount) < 49000 || Number(appliedAmount) > 5000000) {
            errors.appliedAmount = 'Amount must be between 49,000 and 5,000,000.';
            isValid = false;
        }
         if (!loginDate) {
            errors.loginDate = 'Login date is required.';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const params: InsertBankAppParams = {
            p_lead_id: leadId,
            p_bank_name: bankName,
            p_loan_app_number: loanAppNumber.trim() || null,
            p_applied_amount: appliedAmount === '' ? null : Number(appliedAmount),
            p_login_date: loginDate || null,
        };

        createMutation.mutate(params);
    };

    return (
        <Dialog open={open} onClose={resetFormAndClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Bank Application</DialogTitle>
            <DialogContent>
                {banksError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>Could not load bank list: {banksError.message}</Alert>
                )}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!formErrors.bankName} required>
                            <InputLabel id="bank-name-label">Bank Name</InputLabel>
                            <Select
                                labelId="bank-name-label"
                                id="bank-name"
                                value={bankName}
                                label="Bank Name"
                                onChange={(e) => setBankName(e.target.value)}
                                disabled={isLoadingBanks || createMutation.isPending}
                            >
                                {isLoadingBanks && <MenuItem disabled value=""><CircularProgress size={20} sx={{ mr: 1 }} />Loading banks...</MenuItem>}
                                {banks && banks.map((bank) => (
                                    <MenuItem key={bank.name} value={bank.name}>{bank.name}</MenuItem>
                                ))}
                            </Select>
                            {formErrors.bankName && <FormHelperText>{formErrors.bankName}</FormHelperText>}
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            margin="dense"
                            id="loan-app-number"
                            label="Loan Application Number"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={loanAppNumber}
                            onChange={(e) => setLoanAppNumber(e.target.value)}
                            disabled={createMutation.isPending}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            margin="dense"
                            id="applied-amount"
                            label="Applied Amount"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={appliedAmount}
                            onChange={(e) => setAppliedAmount(e.target.value)}
                            required
                            error={!!formErrors.appliedAmount}
                            helperText={formErrors.appliedAmount}
                            disabled={createMutation.isPending}
                            InputProps={{
                                inputProps: {
                                    min: 49000,
                                    max: 5000000,
                                    step: "any"
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            margin="dense"
                            id="login-date"
                            label="Login Date"
                            type="date" // Use date type input
                            fullWidth
                            variant="outlined"
                            value={loginDate}
                            onChange={(e) => setLoginDate(e.target.value)}
                            required
                            error={!!formErrors.loginDate}
                            helperText={formErrors.loginDate}
                            disabled={createMutation.isPending}
                            InputLabelProps={{
                                shrink: true, // Keep label floated for date type
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                 {createMutation.isError && (
                     <Typography variant="caption" color="error" sx={{ mr: 'auto' }}> 
                         {/* Display specific error from mutation state */} 
                         {createMutation.error?.message || 'An error occurred.'} 
                     </Typography>
                )} 
                <Button onClick={resetFormAndClose} disabled={createMutation.isPending}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <CircularProgress size={24} /> : 'Create Application'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 