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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
}

// Data fetching function
const fetchAdminUsers = async (): Promise<AdminUserView[]> => {
  const { data, error } = await supabase
    .from('profile')
    .select('id, first_name, last_name, email, role, is_active')
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

  // State for dialog
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
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
      
      // --- SECURITY WARNING --- 
      // Calling admin methods directly from the client is insecure.
      // This should ideally be done within a Supabase Edge Function.
      // Example using admin.createUser (requires secure setup or Edge Function):
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true, // Or false if you don't require email confirmation initially
        // user_metadata: { name: `${formData.first_name} ${formData.last_name}` } // Optional
      });

      if (authError || !authData.user) {
        console.error("Auth User Creation Error:", authError);
        throw new Error(authError?.message || 'Failed to create user authentication entry.');
      }

      const userId = authData.user.id;

      // Task 12.4: Immediately update the profile table
      const { error: profileError } = await supabase
        .from('profile')
        .update({ 
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            // email is automatically set by trigger/auth
            // is_active defaults to true
         })
        .eq('id', userId);

      if (profileError) {
        console.error("Profile Update Error:", profileError);
        // Attempt to clean up auth user if profile update fails?
        // This part needs careful consideration based on desired transactional behavior.
        // await supabase.auth.admin.deleteUser(userId); // Risky, could fail.
        throw new Error(profileError.message || 'Failed to update user profile after creation.');
      }

      return { userId }; // Return success indicator
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
                <TableCell align="center">Actions</TableCell> {/* Placeholder for Edit/Delete */} 
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
                    <TableCell align="center">
                      {/* TODO: Add Edit button (Task 12.5) */}
                      {/* TODO: Add Change Password button (Task 12.6) */}
                      {/* Placeholder */}
                      -
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No users found.</TableCell>
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