'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  CircularProgress,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import { Database } from '@/lib/supabase/database.types';

type Profile = Database['public']['Tables']['profile']['Row'];
type EligibleUser = Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email' | 'role'>;

// Fetch eligible users (active Agents/TLs)
const fetchEligibleUsers = async (): Promise<EligibleUser[]> => {
  const { data, error } = await supabase
    .from('profile')
    .select('id, first_name, last_name, email, role')
    .in('role', ['agent', 'team_leader'])
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  if (error) {
    console.error("Error fetching eligible users:", error);
    throw new Error('Failed to fetch eligible users.');
  }
  return data || [];
};

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (selectedUserIds: string[]) => Promise<unknown>;
  isSubmitting: boolean;
  existingMemberUserIds: string[];
}

export function AddMemberDialog({ 
    open, 
    onClose, 
    onSubmit, 
    isSubmitting, 
    existingMemberUserIds 
}: AddMemberDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { 
      data: allEligibleUsers, 
      isLoading: isLoadingUsers, 
      error: usersError, 
      isError: isUsersError 
  } = useQuery<EligibleUser[], Error>({
    queryKey: ['eligibleTeamMembers'],
    queryFn: fetchEligibleUsers,
    enabled: open, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter out users already in the team
  const availableUsers = useMemo(() => {
    if (!allEligibleUsers) return [];
    return allEligibleUsers.filter(user => !existingMemberUserIds.includes(user.id));
  }, [allEligibleUsers, existingMemberUserIds]);

  // Reset selection when dialog opens/closes or available users change
  useEffect(() => {
    if (open) {
      setSelectedUserIds([]);
    }
  }, [open, availableUsers]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) return; // Don't submit if nothing selected
    await onSubmit(selectedUserIds);
    // Parent handles closing on success
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Members to Team</DialogTitle>
      <DialogContent dividers>
        {isLoadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}> <CircularProgress /> </Box>
        ) : isUsersError ? (
            <Alert severity="error">Error loading users: {usersError?.message}</Alert>
        ) : availableUsers.length === 0 ? (
             <Typography sx={{ textAlign: 'center', my: 3 }}>No more eligible users to add.</Typography>
        ) : (
          <List dense sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availableUsers.map((user) => (
              <ListItem 
                key={user.id} 
                dense 
                component="button"
                onClick={() => handleToggleUser(user.id)} 
                disabled={isSubmitting}
                sx={{ textAlign: 'left', width: '100%' }}
              >
                <Checkbox
                  edge="start"
                  checked={selectedUserIds.includes(user.id)}
                  tabIndex={-1}
                  disableRipple
                  disabled={isSubmitting}
                />
                <ListItemText 
                  primary={`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}
                  secondary={`${user.email ?? 'No Email'} - ${user.role ?? 'No Role'}`}
                 />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ position: 'relative', p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={isSubmitting || selectedUserIds.length === 0}
        >
          Add Selected ({selectedUserIds.length})
        </Button>
        {isSubmitting && (
          <CircularProgress
            size={24}
            sx={{ position: 'absolute', top: '50%', right: '24px', marginTop: '-12px' }}
          />
        )}
      </DialogActions>
    </Dialog>
  );
} 