'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { Database } from '@/lib/supabase/database.types';
import { SelectChangeEvent } from '@mui/material/Select';

type UserRole = Database['public']['Enums']['user_role'];
const userRoles: UserRole[] = ['admin', 'backend', 'team_leader', 'agent'];

export interface CreateUserFormData {
  email: string;
  password?: string; // Password is only needed on creation, not edit
  first_name: string;
  last_name: string;
  role: UserRole;
}

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateUserFormData) => Promise<unknown>; // Allow any promise return type
  isSubmitting: boolean;
}

export function CreateUserDialog({ open, onClose, onSubmit, isSubmitting }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'agent', // Default role
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserFormData, string>>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'agent',
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateUserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<UserRole>) => {
    const { name, value } = event.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value as UserRole }));
       if (errors[name as keyof CreateUserFormData]) {
         setErrors(prev => ({ ...prev, [name]: undefined }));
       }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserFormData, string>> = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.password || formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
     if (!formData.role) {
       newErrors.role = 'Role is required';
     }
    // Add other validations as needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
      // onClose(); // Keep dialog open on error, close on success handled by parent
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New User</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="email"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isSubmitting}
            required
          />
          <TextField
            margin="dense"
            id="password"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            disabled={isSubmitting}
            required
          />
          <TextField
            margin="dense"
            id="first_name"
            name="first_name"
            label="First Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.first_name}
            onChange={handleChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
            disabled={isSubmitting}
            required
          />
          <TextField
            margin="dense"
            id="last_name"
            name="last_name"
            label="Last Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.last_name}
            onChange={handleChange}
            // No validation, optional
            disabled={isSubmitting}
          />
          <FormControl fullWidth margin="dense" error={!!errors.role} required disabled={isSubmitting}>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              id="role"
              name="role"
              value={formData.role}
              label="Role"
              onChange={handleSelectChange}
            >
              {userRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ position: 'relative', p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Create User
          </Button>
           {isSubmitting && (
              <CircularProgress
                  size={24}
                  sx={{
                      position: 'absolute',
                      top: '50%',
                      right: '24px', // Adjust as needed
                      marginTop: '-12px',
                  }}
              />
            )}
        </DialogActions>
      </form>
    </Dialog>
  );
} 