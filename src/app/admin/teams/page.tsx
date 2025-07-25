'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Grid,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { Database } from '@/lib/supabase/database.types';
import { TeamFormDialog, TeamFormData } from './_components/team-form-dialog';
import { AddMemberDialog } from './_components/add-member-dialog';

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
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  overflow: 'hidden',
  animation: `${fadeInUp} 0.8s ease-out`,
  padding: theme.spacing(3),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.06)',
  },
  transition: 'all 0.3s ease',
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}));

// Interfaces
type Team = Database['public']['Tables']['team']['Row'];
type Profile = Database['public']['Tables']['profile']['Row'];
// Corrected TeamMember interface using composition
interface TeamMember {
  id: string; // From team_members table
  user_id: string;
  team_id: string;
  profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email' | 'role'> | null; // Profile is an object or null
}

// Data fetching function
const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase
    .from('team')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching teams:", error);
    throw new Error('Failed to fetch teams.');
  }
  return data;
};

const fetchTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
    console.log(`Fetching members for team ID: ${teamId}`);
    const { data, error } = await supabase
      .from('team_members')
      // Use !inner hint for profile to ensure it's treated as an object relationship
      .select(`
        id, 
        user_id, 
        team_id,
        profile!inner ( id, first_name, last_name, email, role )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true }); // Consider ordering by profile name
  
    if (error) {
      console.error(`Error fetching members for team ${teamId}:`, error);
      throw new Error('Failed to fetch team members.');
    }
    console.log(`Fetched members for team ID ${teamId}:`, data);
    // Use safer casting if direct cast fails due to inference issues
    return (data || []) as unknown as TeamMember[];
};

export default function TeamManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  // State for dialogs
  const [isTeamFormOpen, setTeamFormOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null); // For edit mode
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [isAddMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  const { data: teams, isLoading: teamsLoading, error: teamsError, isError: isTeamsError } = useQuery<Team[], Error>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    enabled: !!profile && profile.role === 'admin', // Only fetch if user is admin
  });

  // Query for members of the selected team
  const { data: members, isLoading: membersLoading, error: membersError, isError: isMembersError } = useQuery<TeamMember[], Error>({ 
      queryKey: ['teamMembers', selectedTeam?.id], 
      queryFn: () => fetchTeamMembers(selectedTeam!.id), 
      enabled: !!selectedTeam, // Only run query if a team is selected
  });

  // Memoize existing member IDs - Placed after dependent query, before early return
  const existingMemberUserIds = useMemo(() => {
      return members ? members.map(m => m.user_id) : [];
  }, [members]);

  // --- Mutations --- 
  const createTeamMutation = useMutation({
    mutationFn: async (formData: TeamFormData) => {
        const { data, error } = await supabase
            .from('team')
            .insert({ name: formData.name })
            .select()
            .single(); // Select the newly created row
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        setSnackbar({ open: true, message: 'Team created successfully!', severity: 'success' });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        setTeamFormOpen(false);
    },
    onError: (error: Error) => {
        setSnackbar({ open: true, message: `Failed to create team: ${error.message}`, severity: 'error' });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: TeamFormData }) => {
        const { data, error } = await supabase
            .from('team')
            .update({ name: formData.name })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
     onSuccess: (updatedTeam) => {
        setSnackbar({ open: true, message: 'Team updated successfully!', severity: 'success' });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        // If the updated team was the selected one, update the selection
        if (selectedTeam?.id === updatedTeam?.id) {
            setSelectedTeam(updatedTeam);
        }
        setTeamFormOpen(false);
    },
    onError: (error: Error) => {
        setSnackbar({ open: true, message: `Failed to update team: ${error.message}`, severity: 'error' });
    }
  });

  const deleteTeamMutation = useMutation({
      mutationFn: async (teamId: string) => {
          // Potential issue: Need to handle team members if FK constraint doesn't cascade
          // Simple approach: delete team row, let DB handle constraints/errors
           const { error } = await supabase
              .from('team')
              .delete()
              .eq('id', teamId);
          if (error) throw error;
          return teamId;
      },
      onSuccess: (deletedTeamId) => {
          setSnackbar({ open: true, message: 'Team deleted successfully', severity: 'success' });
          queryClient.invalidateQueries({ queryKey: ['teams'] });
          // If the deleted team was selected, clear the selection
          if (selectedTeam?.id === deletedTeamId) {
              setSelectedTeam(null);
          }
      },
      onError: (error: Error) => {
          // Handle specific errors like FK violation if needed
          setSnackbar({ open: true, message: `Failed to delete team: ${error.message}`, severity: 'error' });
      }
  });

  const removeMemberMutation = useMutation({
      mutationFn: async (memberId: string) => {
          // memberId here is the ID from the team_members table
          const { error } = await supabase
              .from('team_members')
              .delete()
              .eq('id', memberId);
          if (error) throw error;
          return memberId;
      },
      onSuccess: () => {
          setSnackbar({ open: true, message: 'Member removed successfully', severity: 'success' });
          queryClient.invalidateQueries({ queryKey: ['teamMembers', selectedTeam?.id] }); // Refetch members for the current team
      },
      onError: (error: Error) => {
          setSnackbar({ open: true, message: `Failed to remove member: ${error.message}`, severity: 'error' });
      }
  });

  const addMembersMutation = useMutation({
      mutationFn: async (userIds: string[]) => {
          if (!selectedTeam) throw new Error("No team selected");

          const membersToAdd = userIds.map(userId => ({
              user_id: userId,
              team_id: selectedTeam.id,
          }));

          const { error } = await supabase
              .from('team_members')
              .insert(membersToAdd);

          if (error) throw error;
          return userIds;
      },
      onSuccess: (addedUserIds) => {
          setSnackbar({ open: true, message: `${addedUserIds.length} member(s) added successfully`, severity: 'success' });
          queryClient.invalidateQueries({ queryKey: ['teamMembers', selectedTeam?.id] }); // Refetch members
          setAddMemberDialogOpen(false); // Close dialog on success
      },
      onError: (error: Error) => {
          setSnackbar({ open: true, message: `Failed to add members: ${error.message}`, severity: 'error' });
      }
  });
  // --- End Mutations ---

  const isLoading = authLoading || teamsLoading;
  const isProcessingMember = removeMemberMutation.isPending || addMembersMutation.isPending;

  // Admin access check
  if (!authLoading && (!profile || profile.role !== 'admin')) {
    // Redirect or show access denied message
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Access Denied. You do not have permission to view this page.</Alert>
      </Container>
    );
  }

  const handleCreateTeamClick = () => {
    setTeamToEdit(null); // Ensure edit mode is off
    setTeamFormOpen(true);
  };

  const handleEditTeamClick = (team: Team) => {
    setTeamToEdit(team);
    setTeamFormOpen(true);
  };

  const handleDeleteTeamClick = (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team? Associated members might also be affected depending on database setup.')) {
        deleteTeamMutation.mutate(teamId);
    }
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    // Member query will automatically run/refetch due to enabled flag
  };

  const handleCloseTeamForm = () => {
    if (!createTeamMutation.isPending && !updateTeamMutation.isPending) {
        setTeamFormOpen(false);
        setTeamToEdit(null);
    }
  };

  const handleTeamFormSubmit = async (formData: TeamFormData) => {
     if (teamToEdit) {
         // Update existing team
         await updateTeamMutation.mutateAsync({ id: teamToEdit.id, formData });
     } else {
         // Create new team
         await createTeamMutation.mutateAsync(formData);
     }
     // Dialog closes automatically on success via mutation handler
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRemoveMemberClick = (memberId: string) => {
       if (window.confirm('Are you sure you want to remove this member from the team?')) {
           removeMemberMutation.mutate(memberId);
       }
  };

  const handleAddMemberClick = () => {
      if (selectedTeam) {
          setAddMemberDialogOpen(true);
      }
  };

  const handleCloseAddMemberDialog = () => {
      if (!addMembersMutation.isPending) {
          setAddMemberDialogOpen(false);
      }
  };

  const handleAddMembersSubmit = async (selectedUserIds: string[]) => {
      await addMembersMutation.mutateAsync(selectedUserIds);
      // Dialog closes on success in mutation handler
  };

  return (
    <ModernContainer maxWidth="lg">
      <Fade in={true} timeout={800}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            '&::before': {
              content: '""',
              width: 4,
              height: 32,
              backgroundColor: '#0ea5e9',
              borderRadius: 2,
              mr: 2,
            },
          }}
        >
          Team Management
        </Typography>
      </Fade>

      <Grid container spacing={3}>
        {/* Teams List Section */}
        <Grid item xs={12} md={5}>
          <ModernPaper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Teams</Typography>
              <ModernButton
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreateTeamClick}
                disabled={isLoading}
                sx={{
                  background: '#0ea5e9',
                  '&:hover': {
                    background: '#0284c7',
                  },
                }}
              >
                Create Team
              </ModernButton>
            </Box>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}> <CircularProgress /> </Box>
            ) : isTeamsError ? (
              <Alert severity="error">Error loading teams: {teamsError?.message}</Alert>
            ) : teams && teams.length > 0 ? (
              <List dense disablePadding>
                {teams.map((team) => {
                  const isSelected = selectedTeam?.id === team.id;
                  return (
                    <ListItem
                      key={team.id}
                      disablePadding
                      divider
                      secondaryAction={
                        <>
                          <IconButton 
                            edge="end" 
                            aria-label="edit" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleEditTeamClick(team); }} 
                            disabled={deleteTeamMutation.isPending || updateTeamMutation.isPending}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTeamClick(team.id); }} 
                            sx={{ ml: 0.5 }} 
                            disabled={deleteTeamMutation.isPending || updateTeamMutation.isPending}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      }
                      sx={{ 
                        ...(isSelected && {
                          backgroundColor: 'action.selected', 
                        }),
                      }} 
                    >
                      <ListItemButton 
                        selected={isSelected} 
                        onClick={() => handleSelectTeam(team)}
                        sx={{ py: 0.5 }}
                      >
                        <ListItemText primary={team.name} sx={{ flexGrow: 1, mr: 1 }}/>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">No teams found. Create one to get started.</Typography>
            )}
          </ModernPaper>
        </Grid>

        {/* Team Members Section */}
        <Grid item xs={12} md={7}>
          <ModernPaper sx={{ minHeight: '300px' }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    {selectedTeam ? `Members of ${selectedTeam.name}` : 'Select a Team'}
                </Typography>
                {selectedTeam && (
                    <ModernButton
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddMemberClick}
                        disabled={!selectedTeam || membersLoading || isProcessingMember}
                        sx={{
                          background: '#0ea5e9',
                          '&:hover': {
                            background: '#0284c7',
                          },
                        }}
                    >
                        Add Member
                    </ModernButton>
                )}
             </Box>
            {selectedTeam ? (
                membersLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}> <CircularProgress /> </Box>
                ) : isMembersError ? (
                    <Alert severity="error">Error loading members: {membersError?.message}</Alert>
                ) : members && members.length > 0 ? (
                    <List dense disablePadding>
                        {members.map((member) => (
                            <ListItem key={member.id} divider>
                                <ListItemText 
                                    primary={`${member.profile?.first_name ?? ''} ${member.profile?.last_name ?? ''}`.trim()}
                                    secondary={`${member.profile?.email ?? 'No Email'} - ${member.profile?.role ?? 'No Role'}`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton 
                                        edge="end" 
                                        aria-label="remove member" 
                                        size="small" 
                                        onClick={() => handleRemoveMemberClick(member.id)}
                                        disabled={isProcessingMember}
                                    >
                                        <PersonRemoveIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No members found in this team.</Typography>
                )
            ) : (
                 <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                     Select a team from the list to view and manage its members.
                 </Typography>
            )}
          </ModernPaper>
        </Grid>
      </Grid>

      {/* --- Render Dialogs --- */}
      <TeamFormDialog
        open={isTeamFormOpen}
        onClose={handleCloseTeamForm}
        onSubmit={handleTeamFormSubmit}
        isSubmitting={createTeamMutation.isPending || updateTeamMutation.isPending}
        initialData={teamToEdit}
      />
      {/* Add Member Dialog - Render unconditionally, control visibility via 'open' prop */}
      {/* {selectedTeam && ( */}
        <AddMemberDialog
            open={isAddMemberDialogOpen && !!selectedTeam} // Only open if dialog state is true AND a team is selected
            onClose={handleCloseAddMemberDialog}
            onSubmit={handleAddMembersSubmit}
            isSubmitting={addMembersMutation.isPending}
             // Pass the memoized value directly; it's already [] if members are null
            existingMemberUserIds={existingMemberUserIds} 
            // Optionally pass teamId if needed by the dialog
            // teamId={selectedTeam?.id}
        />
      {/* )} */}

      {/* --- Snackbar for feedback --- */}
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

    </ModernContainer>
  );
} 