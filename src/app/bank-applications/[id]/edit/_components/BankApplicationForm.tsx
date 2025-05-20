'use client';

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  BankApplicationDetails,
  BankApplicationUpdatePayload,
  Bank,
  fetchBanks,
  updateBankApplication,
  fetchAppNotes,
  addAppNote,
  deleteAppNote,
  AppNoteWithCreator,
  deleteBankApplication,
} from '@/lib/supabase/queries/bank-applications';
import { Database } from '@/lib/supabase/database.types';

// Explicitly type as a tuple of the specific enum values
const LEAD_STAGE_OPTIONS: [Database['public']['Enums']['lead_stage'], ...Database['public']['Enums']['lead_stage'][]] = [
  'New',
  'Sent to Bank',
  'Under Review',
  'Reject Review',
  'Reject',
  'Approved',
  'Disbursed',
  'documents_incomplete',
];

// Define Zod schema for validation
const schema = z.object({
  bank_name: z.string().min(1, 'Bank name is required'),
  loan_app_number: z.string().nullable().optional(),
  applied_amount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) ? null : Number(val)),
    z.number()
      .min(49000, 'Amount must be at least 49,000')
      .max(5000000, 'Amount must not exceed 5,000,000')
      .nullable()
      .optional()
  ),
  approved_amount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) ? null : Number(val)),
    z.number()
      .min(49000, 'Amount must be at least 49,000')
      .max(5000000, 'Amount must not exceed 5,000,000')
      .nullable()
      .optional()
  ),
  login_date: z.instanceof(dayjs as unknown as typeof Dayjs).nullable().optional(),
  disburse_date: z.instanceof(dayjs as unknown as typeof Dayjs).nullable().optional()
    .refine(val => !val || dayjs(val).isBefore(dayjs().add(1, 'day')), {
        message: 'Disburse Date cannot be in the future',
    })
    .refine(val => !val || dayjs(val).isAfter(dayjs().subtract(1, 'month').subtract(1, 'day')), {
        message: 'Disburse Date cannot be older than 1 month',
    }),
  lead_stage: z.enum(LEAD_STAGE_OPTIONS),
}).refine(data => {
  if (['Approved', 'Disbursed'].includes(data.lead_stage) && (data.approved_amount == null || data.approved_amount === 0 || isNaN(data.approved_amount))) {
    return false;
  }
  return true;
}, {
  message: 'Approved Amount is required and must be valid when stage is Approved or Disbursed',
  path: ['approved_amount'],
}).refine(data => {
  if (data.lead_stage === 'Disbursed' && data.disburse_date == null) {
    return false;
  }
  return true;
}, {
  message: 'Disburse Date is required when stage is Disbursed',
  path: ['disburse_date'],
});

type BankApplicationFormData = z.infer<typeof schema>;

interface BankApplicationFormProps {
  applicationData: BankApplicationDetails;
  userRole: Database['public']['Enums']['user_role'];
}

export default function BankApplicationForm({ applicationData, userRole }: BankApplicationFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [newNote, setNewNote] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [appDeleteConfirmOpen, setAppDeleteConfirmOpen] = useState(false);

  const { data: banks, isLoading: isLoadingBanks } = useQuery({
    queryKey: ['banks'],
    queryFn: () => fetchBanks(supabase),
  });

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BankApplicationFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      bank_name: applicationData.bank_name ?? '',
      loan_app_number: applicationData.loan_app_number ?? null,
      applied_amount: applicationData.applied_amount ?? undefined,
      approved_amount: applicationData.approved_amount ?? undefined,
      login_date: applicationData.login_date && dayjs(applicationData.login_date).isValid() ? dayjs(applicationData.login_date) : null,
      disburse_date: applicationData.disburse_date && dayjs(applicationData.disburse_date).isValid() ? dayjs(applicationData.disburse_date) : null,
      lead_stage: applicationData.lead_stage ?? 'New',
    },
  });

  const currentStage = watch('lead_stage');
  const showApprovedAmount = React.useMemo(() => ['Approved', 'Disbursed'].includes(currentStage), [currentStage]);
  const showDisburseDate = React.useMemo(() => currentStage === 'Disbursed', [currentStage]);

  const updateMutation = useMutation({
    mutationFn: async (formData: BankApplicationFormData) => {
       const payload: BankApplicationUpdatePayload = {
            bank_name: formData.bank_name,
            loan_app_number: formData.loan_app_number || null,
            applied_amount: formData.applied_amount ?? null,
            approved_amount: showApprovedAmount ? (formData.approved_amount ?? null) : null,
            lead_stage: formData.lead_stage,
            login_date: formData.login_date && dayjs.isDayjs(formData.login_date) ? formData.login_date.format('YYYY-MM-DD') : null,
            disburse_date: showDisburseDate && formData.disburse_date && dayjs.isDayjs(formData.disburse_date) ? formData.disburse_date.format('YYYY-MM-DD') : null,
        };
        console.log('[Update Mutation] Preparing to call updateBankApplication with payload:', payload);
        try {
            const result = await updateBankApplication(supabase, applicationData.id, payload);
            console.log('[Update Mutation] updateBankApplication RPC call successful:', result);
            if (result && result.id) {
                return result;
            } else {
                 console.error('[Update Mutation] RPC success but unexpected data format:', result);
                 return { id: applicationData.id };
            }
        } catch (error) {
            console.error('[Update Mutation] Error calling updateBankApplication:', error);
            throw error;
        }
    },
    onSuccess: (data) => {
        console.log('[Update Mutation] onSuccess triggered:', data);
        setSnackbar({ open: true, message: 'Bank application updated successfully!', severity: 'success' });
        queryClient.invalidateQueries({ queryKey: ['bankApplication', applicationData.id] });
        queryClient.invalidateQueries({ queryKey: ['bankApplications', applicationData.lead_id] });
        queryClient.invalidateQueries({ queryKey: ['allBankApplications'] });
    },
    onError: (error: Error) => {
      console.error('[Update Mutation] onError triggered:', error);
      setSnackbar({ open: true, message: `Update failed: ${error.message}`, severity: 'error' });
    },
  });

  const { data: appNotes, isLoading: isLoadingNotes, error: notesError } = useQuery({
    queryKey: ['appNotes', applicationData.id],
    queryFn: () => fetchAppNotes(supabase, applicationData.id),
    enabled: !!applicationData.id,
  });

  const addNoteMutation = useMutation({
    mutationFn: (noteContent: string) => addAppNote(supabase, applicationData.id, noteContent),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Note added successfully!', severity: 'success' });
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['appNotes', applicationData.id] });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Failed to add note: ${error.message}`, severity: 'error' });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteAppNote(supabase, noteId),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Note deleted successfully!', severity: 'success' });
      setNoteToDelete(null);
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['appNotes', applicationData.id] });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Failed to delete note: ${error.message}`, severity: 'error' });
      setNoteToDelete(null);
      setDeleteDialogOpen(false);
    },
  });

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  const openDeleteNoteDialog = (noteId: string) => {
      setNoteToDelete(noteId);
      setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteNote = () => {
      if (noteToDelete) {
          deleteNoteMutation.mutate(noteToDelete);
      }
  };

  const deleteAppMutation = useMutation({
      mutationFn: () => deleteBankApplication(supabase, applicationData.id),
      onSuccess: () => {
          setSnackbar({ open: true, message: 'Bank application deleted successfully!', severity: 'success' });
          setAppDeleteConfirmOpen(false);
          router.push(`/leads/${applicationData.lead_id}/edit`);
          queryClient.invalidateQueries({ queryKey: ['bankApplications', applicationData.lead_id] });
          queryClient.invalidateQueries({ queryKey: ['allBankApplications'] });
      },
      onError: (error: Error) => {
          setSnackbar({ open: true, message: `Failed to delete application: ${error.message}`, severity: 'error' });
          setAppDeleteConfirmOpen(false);
      },
  });

  const openDeleteAppDialog = () => {
      setAppDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteApp = () => {
      deleteAppMutation.mutate();
  };

  const onSubmit: SubmitHandler<BankApplicationFormData> = (data) => {
    console.log("Form submitted with data:", data);
    updateMutation.mutate(data);
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoadingBanks) {
    return <CircularProgress />;
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 3, mb: 3 }}>
       <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
           <Button
               variant="outlined"
               onClick={() => router.push(`/leads/${applicationData.lead_id}/edit`)}
               disabled={!applicationData.lead_id}
           >
               View Associated Lead
           </Button>
       </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.bank_name}>
            <InputLabel id="bank-name-label">Bank Name</InputLabel>
            <Controller
              name="bank_name"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="bank-name-label"
                  label="Bank Name"
                  {...field}
                  value={field.value || ''}
                >
                  {(banks || []).map((bank: Bank) => (
                    <MenuItem key={bank.name} value={bank.name}>
                      {bank.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.bank_name && <FormHelperText>{errors.bank_name.message}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.lead_stage}>
            <InputLabel id="lead-stage-label">Lead Stage</InputLabel>
            <Controller
              name="lead_stage"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="lead-stage-label"
                  label="Lead Stage"
                  {...field}
                  value={field.value || ''}
                >
                  {LEAD_STAGE_OPTIONS.map((stage) => (
                    <MenuItem key={stage} value={stage}>
                      {stage}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.lead_stage && <FormHelperText>{errors.lead_stage.message}</FormHelperText>}
          </FormControl>
        </Grid>

         <Grid item xs={12} md={6}>
           <Controller
             name="loan_app_number"
             control={control}
             render={({ field }) => (
               <TextField
                 {...field}
                 label="Loan Application Number"
                 fullWidth
                 error={!!errors.loan_app_number}
                 helperText={errors.loan_app_number?.message}
                 value={field.value ?? ''}
               />
             )}
           />
         </Grid>

         <Grid item xs={12} md={6}>
           <Controller
             name="applied_amount"
             control={control}
             render={({ field }) => (
               <TextField
                 {...field}
                 label="Applied Amount"
                 type="number"
                 fullWidth
                 error={!!errors.applied_amount}
                 helperText={errors.applied_amount?.message}
                 value={field.value ?? ''}
                 onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
               />
             )}
           />
         </Grid>

        {showApprovedAmount && (
            <Grid item xs={12} md={6}>
                <Controller
                    name="approved_amount"
                    control={control}
                    render={({ field }) => (
                    <TextField
                        {...field}
                        label="Approved Amount"
                        type="number"
                        fullWidth
                        required={showApprovedAmount}
                        error={!!errors.approved_amount}
                        helperText={errors.approved_amount?.message}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                    )}
                />
            </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Controller
            name="login_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Login Date"
                value={field.value || null}
                onChange={(newValue) => field.onChange(newValue)}
                readOnly={userRole !== 'admin'}
                disabled={userRole !== 'admin'}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.login_date,
                    helperText: errors.login_date?.message || (userRole !== 'admin' ? 'Only admin can edit this field' : ''),
                  },
                }}
              />
            )}
          />
        </Grid>

        {showDisburseDate && (
            <Grid item xs={12} md={6}>
                <Controller
                name="disburse_date"
                control={control}
                render={({ field }) => (
                    <DatePicker
                    label="Disburse Date"
                    value={field.value || null}
                    onChange={(newValue) => field.onChange(newValue)}
                    slotProps={{
                        textField: {
                        fullWidth: true,
                        error: !!errors.disburse_date,
                        helperText: errors.disburse_date?.message,
                        },
                    }}
                    />
                )}
                />
            </Grid>
        )}

      </Grid>

      <Button
        type="submit"
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={updateMutation.isPending || isSubmitting}
      >
        {updateMutation.isPending ? <CircularProgress size={24} /> : 'Save Application Details'}
      </Button>

      {userRole === 'admin' && (
           <Button
               variant="contained"
               color="error"
               sx={{ mt: 3, mb: 2, ml: 2 }}
               onClick={openDeleteAppDialog}
               disabled={deleteAppMutation.isPending}
           >
               {deleteAppMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Delete Application'}
           </Button>
       )}

      <Divider sx={{ my: 4 }} />
      <Typography variant="h6" gutterBottom component="div">
        Application Notes
      </Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Add a new note"
          multiline
          rows={3}
          fullWidth
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          variant="outlined"
          disabled={addNoteMutation.isPending}
        />
        <Button
          variant="contained"
          onClick={handleAddNote}
          disabled={addNoteMutation.isPending || !newNote.trim()}
          sx={{ mt: 1 }}
        >
          {addNoteMutation.isPending ? <CircularProgress size={24} /> : 'Add Note'}
        </Button>
      </Box>

      {isLoadingNotes && <CircularProgress />}
      {notesError && <Alert severity="error">Failed to load notes: {notesError.message}</Alert>}
      {!isLoadingNotes && !notesError && (
        <List sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}>
          {(appNotes && appNotes.length > 0) ? appNotes.map((note: AppNoteWithCreator) => (
            <React.Fragment key={note.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  userRole === 'admin' ? (
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => openDeleteNoteDialog(note.id)}
                      disabled={deleteNoteMutation.isPending && noteToDelete === note.id}
                    >
                       {deleteNoteMutation.isPending && noteToDelete === note.id ? <CircularProgress size={20} /> : <DeleteIcon />}
                    </IconButton>
                  ) : null
                }
              >
                <ListItemText
                  primary={note.note}
                  secondary={
                      <>
                          <Typography
                              sx={{ display: 'inline' }}
                              component="span"
                              variant="body2"
                              color="text.primary"
                          >
                              {note.profile?.first_name || 'Unknown'} {note.profile?.last_name || 'User'}
                          </Typography>
                          {` - ${dayjs(note.created_at).format('MMM D, YYYY h:mm A')}`}
                      </>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          )) : (
             <ListItem>
                <ListItemText primary="No notes added yet." />
              </ListItem>
          )}
        </List>
      )}

      <Dialog
           open={deleteDialogOpen}
           onClose={() => setDeleteDialogOpen(false)}
       >
           <DialogTitle>Confirm Delete</DialogTitle>
           <DialogContent>
               <DialogContentText>
                   Are you sure you want to delete this note? This action cannot be undone.
               </DialogContentText>
           </DialogContent>
           <DialogActions>
               <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
               <Button onClick={handleConfirmDeleteNote} color="error" disabled={deleteNoteMutation.isPending}>
                   Delete
               </Button>
           </DialogActions>
       </Dialog>

       <Dialog
           open={appDeleteConfirmOpen}
           onClose={() => setAppDeleteConfirmOpen(false)}
       >
           <DialogTitle>Confirm Delete Application</DialogTitle>
           <DialogContent>
               <DialogContentText>
                   Are you sure you want to permanently delete this entire bank application? This action cannot be undone.
               </DialogContentText>
           </DialogContent>
           <DialogActions>
               <Button onClick={() => setAppDeleteConfirmOpen(false)}>Cancel</Button>
               <Button onClick={handleConfirmDeleteApp} color="error" disabled={deleteAppMutation.isPending}>
                   Delete Application
               </Button>
           </DialogActions>
       </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}