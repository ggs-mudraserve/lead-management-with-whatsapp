'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../../lib/supabase/client'; // Import the exported client instance
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton'; // Import IconButton
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon
import Dialog from '@mui/material/Dialog'; // Import Dialog components
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useAuth } from '@/context/AuthContext'; // Assuming an Auth context exists

interface LeadNotesSectionProps {
    leadId: string;
}

interface Profile {
    first_name: string | null;
    last_name: string | null;
}

// Intermediate type reflecting potential DB response structure
interface NoteFromDBRaw {
    id: string;
    note: string;
    created_at: string;
    profile: Profile[] | Profile | null; // Allow array or single object
}

// Final type after processing
interface Note {
    id: string;
    note: string;
    created_at: string;
    profile: Profile; // Ensure profile is not null after mapping
}

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

    // Type assertion for raw data
    const rawData = data as NoteFromDBRaw[] | null;

    // Map and process profile, ensuring it's a single object or default
    return rawData?.map((note): Note => {
        let profileData: Profile | null = null;
        if (Array.isArray(note.profile)) {
            // If it's an array, take the first element if it exists
            profileData = note.profile.length > 0 ? note.profile[0] : null;
        } else {
            // Otherwise, assume it's already an object or null
            profileData = note.profile;
        }

        return {
            ...note,
            profile: profileData ?? { first_name: 'Unknown', last_name: 'User' }
        };
    }) || [];
}

// --- Add Note Mutation Function ---
interface AddNotePayload {
    leadId: string;
    noteContent: string;
}

async function addLeadNote({ leadId, noteContent }: AddNotePayload) {
    // 1. Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Error fetching user:', userError);
        throw new Error('Could not authenticate user to add note.');
    }
    const userId = user.id;

    // 2. Perform the insert
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
        // Attempt to provide a more specific message if possible
        const message = insertError.message || 'Failed to add note.';
        // Check for RLS denial hint
        if (insertError.message.includes('violates row-level security policy')) {
             throw new Error('Permission denied to add note for this lead.');
        }
        throw new Error(message);
    }

    // No need to return data on successful insert for this mutation
    return null;
}

// --- Delete Note Mutation Function ---
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

export function LeadNotesSection({ leadId }: LeadNotesSectionProps) {
    const [newNote, setNewNote] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [dialogOpen, setDialogOpen] = useState(false); // State for confirmation dialog
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null); // State for note ID to delete

    const { profileData } = useAuth(); // Try accessing profile data directly from context
    const isAdmin = profileData?.role === 'admin';

    const queryClient = useQueryClient();

    // Notes Query
    const { data: notes, isLoading, error: queryError, isError } = useQuery<Note[], Error>({
        queryKey: ['leadNotes', leadId],
        queryFn: () => fetchLeadNotes(leadId),
    });

    // Add Note Mutation
    const addNoteMutation = useMutation<null, Error, AddNotePayload>({
        mutationFn: addLeadNote,
        onSuccess: () => {
            setNewNote(''); // Clear input field
            queryClient.invalidateQueries({ queryKey: ['leadNotes', leadId] }); // Refetch notes
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
            handleDialogClose(); // Close dialog on success
        },
        onError: (error) => {
            setSnackbarMessage(`Error deleting note: ${error.message}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            handleDialogClose(); // Close dialog even on error
        },
    });

    const handleAddNote = () => {
        if (!newNote.trim()) return; // Prevent adding empty notes
        addNoteMutation.mutate({ leadId, noteContent: newNote.trim() });
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const handleDeleteClick = (noteId: string) => {
        setNoteToDelete(noteId);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setNoteToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (noteToDelete) {
            deleteNoteMutation.mutate(noteToDelete);
        }
    };

    const getCreatorName = (note: Note): string => {
        const firstName = note.profile?.first_name;
        const lastName = note.profile?.last_name;
        if (firstName && lastName) return `${firstName} ${lastName}`;
        if (firstName) return firstName;
        if (lastName) return lastName;
        // Should not happen due to mapping, but keep fallback
        return 'Unknown User';
    }

    return (
        <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom component="div">
                Lead Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Add Note Section */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    label="Add a new note"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    disabled={addNoteMutation.isPending} // Disable while adding
                />
                <Button
                    variant="contained"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addNoteMutation.isPending} // Disable if empty or adding
                    sx={{ alignSelf: 'flex-end' }} // Align button to bottom if TextField grows
                >
                    {addNoteMutation.isPending ? <CircularProgress size={24} /> : 'Add Note'}
                </Button>
            </Box>

            {/* Display Notes Section */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                </Box>
            )}
            {isError && (
                <Alert severity="error" sx={{ my: 2 }}>
                    Error loading notes: {queryError?.message}
                </Alert>
            )}
            {!isLoading && !isError && (
                <List dense sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {notes && notes.length > 0 ? (
                        notes.map((note: Note, index: number) => (
                            <React.Fragment key={note.id}>
                                <ListItem
                                    alignItems="flex-start"
                                    secondaryAction={ // Add delete button here
                                        isAdmin ? (
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => handleDeleteClick(note.id)}
                                                disabled={deleteNoteMutation.isPending} // Disable while deleting
                                            >
                                                <DeleteIcon />
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
                                                    {getCreatorName(note)}
                                                </Typography>
                                                {` — ${new Date(note.created_at).toLocaleString()}`}
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < notes.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                            No notes added yet.
                        </Typography>
                    )}
                </List>
            )}

            {/* Snackbar for Notifications */}
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

            {/* Confirmation Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to permanently delete this note?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} disabled={deleteNoteMutation.isPending}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={deleteNoteMutation.isPending}>
                         {deleteNoteMutation.isPending ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
} 