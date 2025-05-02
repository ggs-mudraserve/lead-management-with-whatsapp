'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  SelectChangeEvent
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { assignConversationToUser } from '@/lib/supabase/queries/whatsapp';

interface AssignLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionId: string;
}

interface UserOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

// Function to fetch active users
const fetchActiveUsers = async (): Promise<UserOption[]> => {
  const { data, error } = await supabase
    .from('profile')
    .select('id, first_name, last_name, email')
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error('Failed to fetch users');
  }

  return data || [];
};

export default function AssignLeadDialog({ 
  open, 
  onClose, 
  onSuccess, 
  sessionId 
}: AssignLeadDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch active users
  const { 
    data: users, 
    isLoading: isLoadingUsers, 
    error: usersError 
  } = useQuery({
    queryKey: ['activeUsers'],
    queryFn: fetchActiveUsers,
    enabled: open, // Only fetch when dialog is open
  });

  // Assign conversation mutation
  const assignMutation = useMutation({
    mutationFn: assignConversationToUser,
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleUserChange = (event: SelectChangeEvent<string>) => {
    setSelectedUserId(event.target.value);
  };

  const handleAssign = () => {
    if (selectedUserId) {
      assignMutation.mutate({ 
        sessionId, 
        userId: selectedUserId 
      });
    }
  };

  const handleClose = () => {
    if (!assignMutation.isPending) {
      setSelectedUserId('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Conversation to User</DialogTitle>
      <DialogContent>
        {assignMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {assignMutation.error.message}
          </Alert>
        )}
        
        {isLoadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : usersError ? (
          <Alert severity="error" sx={{ my: 2 }}>
            Error loading users
          </Alert>
        ) : (
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="user-select-label">Select User</InputLabel>
            <Select
              labelId="user-select-label"
              value={selectedUserId}
              onChange={handleUserChange}
              label="Select User"
              disabled={assignMutation.isPending}
            >
              {users && users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={assignMutation.isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleAssign} 
          variant="contained" 
          disabled={!selectedUserId || assignMutation.isPending}
          startIcon={assignMutation.isPending ? <CircularProgress size={20} /> : null}
        >
          {assignMutation.isPending ? 'Assigning...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
