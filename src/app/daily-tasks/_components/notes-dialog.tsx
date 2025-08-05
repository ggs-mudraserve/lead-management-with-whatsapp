'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
  Box,
  IconButton,
  Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    minWidth: 600,
    maxWidth: 800,
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: '#0f172a',
  color: 'white',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    width: 4,
    height: 24,
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
    marginRight: theme.spacing(2),
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const AddNoteSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f8fafc',
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

interface NotesDialogProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadName?: string;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
}

interface NoteFromDBRaw {
  id: string;
  note: string;
  created_at: string;
  profile: Profile[] | Profile | null;
}

interface Note {
  id: string;
  note: string;
  created_at: string;
  profile: Profile;
}

// Data fetching functions
async function fetchLeadNotes(leadId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('lead_notes')
    .select(`
      id,
      note,
      created_at,
      profile (
        first_name,
        last_name
      )
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching lead notes:', error);
    throw new Error('Failed to fetch lead notes');
  }

  const rawData = data as NoteFromDBRaw[] | null;

  return rawData?.map((note): Note => {
    let profileData: Profile | null = null;
    if (Array.isArray(note.profile)) {
      profileData = note.profile.length > 0 ? note.profile[0] : null;
    } else {
      profileData = note.profile;
    }

    return {
      ...note,
      profile: profileData ?? { first_name: 'Unknown', last_name: 'User' }
    };
  }) || [];
}

interface AddNotePayload {
  leadId: string;
  noteContent: string;
}

async function addLeadNote({ leadId, noteContent }: AddNotePayload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error fetching user:', userError);
    throw new Error('Could not authenticate user to add note.');
  }
  const userId = user.id;

  const { error: insertError } = await supabase
    .from('lead_notes')
    .insert([
      {
        lead_id: leadId,
        note: noteContent,
        created_by_user_id: userId
      }
    ]);

  if (insertError) {
    console.error('Error adding lead note:', insertError);
    const message = insertError.message || 'Failed to add note.';
    if (insertError.message.includes('violates row-level security policy')) {
      throw new Error('Permission denied to add note for this lead.');
    }
    throw new Error(message);
  }

  return null;
}

async function deleteLeadNote(noteId: string) {
  const { error } = await supabase
    .from('lead_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting lead note:', error);
    const message = error.message || 'Failed to delete note.';
    if (error.message.includes('violates row-level security policy')) {
      throw new Error('Permission denied to delete this note.');
    }
    throw new Error(message);
  }
  return null;
}

export default function NotesDialog({ open, onClose, leadId, leadName }: NotesDialogProps) {
  const [newNote, setNewNote] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();

  // Notes Query
  const { data: notes, isLoading, error: queryError, isError } = useQuery<Note[], Error>({
    queryKey: ['leadNotes', leadId],
    queryFn: () => fetchLeadNotes(leadId),
    enabled: open, // Only fetch when dialog is open
  });

  // Add Note Mutation
  const addNoteMutation = useMutation<null, Error, AddNotePayload>({
    mutationFn: addLeadNote,
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['leadNotes', leadId] });
      setSnackbarMessage('Note added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    onError: (error) => {
      setSnackbarMessage(`Error adding note: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    },
  });

  // Delete Note Mutation
  const deleteNoteMutation = useMutation<null, Error, string>({
    mutationFn: deleteLeadNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadNotes', leadId] });
      setSnackbarMessage('Note deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    onError: (error) => {
      setSnackbarMessage(`Error deleting note: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({ leadId, noteContent: newNote.trim() });
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const getCreatorName = (note: Note): string => {
    const firstName = note.profile?.first_name;
    const lastName = note.profile?.last_name;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return 'Unknown User';
  };

  const handleClose = () => {
    setNewNote(''); // Clear input when closing
    onClose();
  };

  return (
    <>
      <StyledDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <StyledDialogTitle>
          <NoteAddIcon sx={{ mr: 1 }} />
          Notes for {leadName || 'Lead'}
        </StyledDialogTitle>
        
        <StyledDialogContent>
          {/* Add Note Section */}
          <AddNoteSection>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Add New Note
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Enter your note"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={addNoteMutation.isPending}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleAddNote}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                sx={{
                  minWidth: 100,
                  backgroundColor: '#0ea5e9',
                  '&:hover': {
                    backgroundColor: '#0284c7',
                  },
                }}
              >
                {addNoteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Add'}
              </Button>
            </Box>
          </AddNoteSection>

          {/* Display Notes Section */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Alert severity="error" sx={{ my: 2 }}>
              Error loading notes: {queryError?.message}
            </Alert>
          )}

          {!isLoading && !isError && (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mb: 2 }}>
                All Notes ({notes?.length || 0})
              </Typography>
              
              {notes && notes.length > 0 ? (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {notes.map((note: Note, index: number) => (
                    <React.Fragment key={note.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          backgroundColor: index % 2 === 0 ? '#f8fafc' : 'transparent',
                          borderRadius: 1,
                          mb: 1,
                        }}
                        secondaryAction={
                          isAdmin ? (
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={deleteNoteMutation.isPending}
                              size="small"
                              sx={{
                                color: '#ef4444',
                                '&:hover': {
                                  backgroundColor: '#fef2f2',
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          ) : null
                        }
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', pr: isAdmin ? 4 : 0 }}>
                              {note.note}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {getCreatorName(note)} • {new Date(note.created_at).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < notes.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    backgroundColor: '#f8fafc',
                    borderRadius: 1,
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No notes available for this lead.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </StyledDialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </StyledDialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}