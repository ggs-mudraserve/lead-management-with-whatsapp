'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Snackbar,
  Alert as MuiAlert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import KeyIcon from '@mui/icons-material/Key';
import { Database } from '@/lib/supabase/database.types';
import { CreateUserDialog, CreateUserFormData } from './_components/create-user-dialog';

// Interface for user data display
interface AdminUserView {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: Database['public']['Enums']['user_role'] | null;
  is_active: boolean | null;
  present_today: boolean | null;
}

// Data fetching function
const fetchAdminUsers = async (): Promise<AdminUserView[]> => {
  const { data, error } = await supabase
    .from('profile')
    .select('id, first_name, last_name, email, role, is_active, present_today')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching admin users:", error);
    throw new Error('Failed to fetch users.');
  }
  return data as AdminUserView[];
};

export default function UserManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // State for dialogs
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{
    open: boolean;
    userId: string;
    email: string | null;
  }>({ open: false, userId: '', email: null });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data: users, isLoading: usersLoading, error, isError } = useQuery<AdminUserView[], Error>({
    queryKey: ['adminUsers'],
    queryFn: fetchAdminUsers,
    enabled: !!profile && profile.role === 'admin', // Only fetch if user is admin
  });

  // --- Create User Mutation ---
  const createUserMutation = useMutation({
    mutationFn: async (formData: CreateUserFormData) => {
      if (!formData.password) {
        throw new Error("Password is required for creation.");
      }

      console.log('Client: Sending user creation request to API');

      // Call our server-side API endpoint to create the user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          segment: formData.segment,
          emp_code: formData.emp_code,
          salary_current: formData.salary_current,
        }),
      });

      // Parse the response
      const result = await response.json();

      // Handle errors
      if (!response.ok) {
        console.error("User Creation API Error:", result.error);
        throw new Error(result.error || 'Failed to create user');
      }

      console.log('Client: User created successfully', result);
      return { userId: result.userId }; // Return success indicator with the user ID
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'User created successfully!', severity: 'success' });
      setCreateDialogOpen(false); // Close dialog on success
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); // Refresh user list
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `User creation failed: ${error.message}`, severity: 'error' });
      // Keep dialog open for correction
    },
  });
  // --- End Create User Mutation ---

  // --- Toggle User Status Mutation ---
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      // Call our server-side API endpoint to update user status
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      // Parse the response
      const result = await response.json();

      // Handle errors
      if (!response.ok) {
        console.error("User Status Update API Error:", result.error);
        throw new Error(result.error || 'Failed to update user status');
      }

      return {
        userId: result.userId,
        isActive: result.is_active,
        updatedLeadsCount: result.updatedLeadsCount
      };
    },
    onSuccess: (data) => {
      const statusText = data.isActive ? 'activated' : 'deactivated';
      let message = `User ${statusText} successfully!`;

      // Add information about lead ownership changes if any leads were updated
      if (!data.isActive && data.updatedLeadsCount > 0) {
        message += ` ${data.updatedLeadsCount} lead${data.updatedLeadsCount !== 1 ? 's' : ''} unassigned.`;
      }

      setSnackbar({
        open: true,
        message,
        severity: 'success'
      });

      // Refresh user list and any other affected data
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

      // If leads were updated, we might want to invalidate other queries that depend on lead data
      if (data.updatedLeadsCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['allApplications'] });
        queryClient.invalidateQueries({ queryKey: ['missedOpportunities'] });
      }
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: `Failed to update user status: ${error.message}`,
        severity: 'error'
      });
    },
  });
  // --- End Toggle User Status Mutation ---

  // --- Reset Password Mutation ---
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        console.error("Error sending password reset email:", error);
        throw new Error(error.message || 'Failed to send password reset email.');
      }

      return { email };
    },
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: `Password reset link sent to ${data.email}`,
        severity: 'success'
      });
      setResetPasswordDialog(prev => ({ ...prev, open: false }));
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: `Failed to send password reset: ${error.message}`,
        severity: 'error'
      });
    },
  });
  // --- End Reset Password Mutation ---

  const isLoading = authLoading || usersLoading;

  // Admin access check
  if (!authLoading && (!profile || profile.role !== 'admin')) {
    // Optionally redirect or show access denied message
    // router.push('/'); // Redirect to home or login
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Access Denied. You do not have permission to view this page.</Alert>
      </Container>
    );
  }

  const handleCreateUserClick = () => {
    setCreateDialogOpen(true); // Open the dialog
  };

  const handleCloseCreateDialog = () => {
    if (!createUserMutation.isPending) { // Prevent closing while submitting
        setCreateDialogOpen(false);
    }
  };

   const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
     if (reason === 'clickaway') {
       return;
     }
     setSnackbar({ ...snackbar, open: false });
   };

   const handleToggleUserStatus = (userId: string, currentStatus: boolean | null) => {
     // Use the current status (or default to true if null) and toggle it
     const newStatus = !(currentStatus ?? true);
     toggleUserStatusMutation.mutate({ userId, isActive: newStatus });
   };

   const handleOpenResetPasswordDialog = (userId: string, email: string | null) => {
     if (!email) {
       setSnackbar({
         open: true,
         message: 'User has no email address to send reset link',
         severity: 'error'
       });
       return;
     }
     setResetPasswordDialog({
       open: true,
       userId,
       email
     });
   };

   const handleCloseResetPasswordDialog = () => {
     if (!resetPasswordMutation.isPending) {
       setResetPasswordDialog(prev => ({ ...prev, open: false }));
     }
   };

   const handleResetPassword = () => {
     if (resetPasswordDialog.email) {
       resetPasswordMutation.mutate(resetPasswordDialog.email);
     }
   };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUserClick}
          disabled={isLoading} // Disable if initial data is loading
        >
          Create User
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">Error loading users: {error?.message}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="user management table">
            <TableHead sx={{ backgroundColor: 'grey.200' }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Present Today</TableCell>
                <TableCell align="center">Active Status Control</TableCell>
                <TableCell align="center">Reset Password</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email ?? 'N/A'}</TableCell>
                    <TableCell>{user.role ?? 'Not Assigned'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.present_today ? 'Present' : 'Absent'}
                        color={user.present_today ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ position: 'relative' }}>
                        <FormControl component="fieldset">
                          <RadioGroup
                            row
                            value={user.is_active ? 'active' : 'inactive'}
                            onChange={() => handleToggleUserStatus(user.id, user.is_active)}
                          >
                            <Tooltip title="Set user as active">
                              <FormControlLabel
                                value="active"
                                control={<Radio size="small" />}
                                label="Active"
                                disabled={toggleUserStatusMutation.isPending}
                              />
                            </Tooltip>
                            <Tooltip title="Set user as inactive">
                              <FormControlLabel
                                value="inactive"
                                control={<Radio size="small" />}
                                label="Inactive"
                                disabled={toggleUserStatusMutation.isPending}
                              />
                            </Tooltip>
                          </RadioGroup>
                        </FormControl>
                        {toggleUserStatusMutation.isPending && toggleUserStatusMutation.variables?.userId === user.id && (
                          <CircularProgress
                            size={20}
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              right: '-25px',
                              marginTop: '-10px',
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Send password reset link">
                        <span> {/* Wrapper to handle disabled state */}
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenResetPasswordDialog(user.id, user.email)}
                            disabled={!user.email || resetPasswordMutation.isPending}
                            size="small"
                          >
                            <KeyIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* --- Render Create User Dialog --- */}
      <CreateUserDialog
          open={isCreateDialogOpen}
          onClose={handleCloseCreateDialog}
          onSubmit={createUserMutation.mutateAsync} // Pass the mutate function
          isSubmitting={createUserMutation.isPending} // Pass loading state
      />
      {/* --- End Render Dialog --- */}

      {/* Reset Password Confirmation Dialog */}
      <Dialog
        open={resetPasswordDialog.open}
        onClose={handleCloseResetPasswordDialog}
        aria-labelledby="reset-password-dialog-title"
      >
        <DialogTitle id="reset-password-dialog-title">Send Password Reset Link</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to send a password reset link to {resetPasswordDialog.email}?
            The user will receive an email with instructions to reset their password.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ position: 'relative', p: 2 }}>
          <Button
            onClick={handleCloseResetPasswordDialog}
            disabled={resetPasswordMutation.isPending}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="primary"
            disabled={resetPasswordMutation.isPending}
          >
            Send Reset Link
          </Button>
          {resetPasswordMutation.isPending && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                right: '24px',
                marginTop: '-12px',
              }}
            />
          )}
        </DialogActions>
      </Dialog>

       {/* Snackbar for feedback */}
       <Snackbar
         open={snackbar.open}
         autoHideDuration={6000}
         onClose={handleSnackbarClose}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
       >
         <MuiAlert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
           {snackbar.message}
         </MuiAlert>
       </Snackbar>

    </Container>
  );
}