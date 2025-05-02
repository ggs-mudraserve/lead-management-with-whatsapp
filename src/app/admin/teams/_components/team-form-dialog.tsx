'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Database } from '@/lib/supabase/database.types';

type Team = Database['public']['Tables']['team']['Row'];

export interface TeamFormData {
  name: string;
}

interface TeamFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: TeamFormData) => Promise<unknown>;
  isSubmitting: boolean;
  initialData?: Team | null; // Pass existing team data for editing
}

export function TeamFormDialog({ open, onClose, onSubmit, isSubmitting, initialData }: TeamFormDialogProps) {
  const [formData, setFormData] = useState<TeamFormData>({ name: '' });
  const [error, setError] = useState<string | null>(null);

  const dialogTitle = initialData ? 'Edit Team' : 'Create New Team';
  const submitButtonText = initialData ? 'Save Changes' : 'Create Team';

  useEffect(() => {
    if (open) {
        setFormData({ name: initialData?.name ?? '' });
        setError(null);
    } else {
        // Reset form when closing
        setFormData({ name: '' });
        setError(null);
    }
  }, [open, initialData]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ name: event.target.value });
    if (error) {
      setError(null);
    }
  };

  const validate = (): boolean => {
    if (!formData.name.trim()) {
      setError('Team name cannot be empty.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (validate()) {
      await onSubmit(formData);
      // Parent component will handle closing on success
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Team Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange}
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
            required
          />
        </DialogContent>
        <DialogActions sx={{ position: 'relative', p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {submitButtonText}
          </Button>
           {isSubmitting && (
              <CircularProgress
                  size={24}
                  sx={{
                      position: 'absolute',
                      top: '50%',
                      right: '24px', // Adjust position as needed
                      marginTop: '-12px',
                  }}
              />
            )}
        </DialogActions>
      </form>
    </Dialog>
  );
} 