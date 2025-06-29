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

type ProfileSegment = Database['public']['Enums']['profile_segment'];
const profileSegments: ProfileSegment[] = ['PL', 'BL', 'PL_DIGITAL', 'BL_DIGITAL'];

export interface CreateUserFormData {
  email: string;
  password?: string; // Password is only needed on creation, not edit
  first_name: string;
  last_name: string;
  role: UserRole;
  segment: ProfileSegment | null;
  emp_code?: string; // Optional override for employee code
  salary_current?: number | null; // Salary field
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
    segment: null, // Default segment is null
    emp_code: '', // Auto-generated if empty
    salary_current: null, // Optional salary
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
        segment: null,
        emp_code: '',
        salary_current: null,
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    
    // Handle number fields specially
    if (name === 'salary_current') {
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name as keyof CreateUserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<UserRole | ProfileSegment | null>) => {
    const { name, value } = event.target;
    if (name) {
      if (name === 'role') {
        setFormData(prev => ({ ...prev, [name]: value as UserRole }));
      } else if (name === 'segment') {
        setFormData(prev => ({ ...prev, [name]: value as ProfileSegment | null }));
      }

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
     
     // Validate emp_code format if provided
     if (formData.emp_code && formData.emp_code.trim() && !/^EMP-\d{4}$/.test(formData.emp_code.trim())) {
       newErrors.emp_code = 'Employee code must be in format EMP-XXXX (e.g., EMP-0056)';
     }
     
     // Validate salary if provided
     if (formData.salary_current !== null && formData.salary_current !== undefined) {
       if (formData.salary_current < 0) {
         newErrors.salary_current = 'Salary cannot be negative';
       }
       if (formData.salary_current > 10000000) {
         newErrors.salary_current = 'Salary seems too high';
       }
     }

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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New User (Updated with Emp Code & Salary)</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ paddingBottom: 2 }}>
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

          <FormControl fullWidth margin="dense" disabled={isSubmitting}>
            <InputLabel id="segment-select-label">Segment</InputLabel>
            <Select
              labelId="segment-select-label"
              id="segment"
              name="segment"
              value={formData.segment || ''}
              label="Segment"
              onChange={handleSelectChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {profileSegments.map((segment) => (
                <MenuItem key={segment} value={segment}>
                  {segment}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            id="emp_code"
            name="emp_code"
            label="Employee Code"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.emp_code || ''}
            onChange={handleChange}
            error={!!errors.emp_code}
            helperText={errors.emp_code || 'Format: EMP-XXXX (leave empty for auto-generation)'}
            disabled={isSubmitting}
            placeholder="EMP-0056"
          />

          <TextField
            margin="dense"
            id="salary_current"
            name="salary_current"
            label="Current Salary (INR)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.salary_current || ''}
            onChange={handleChange}
            error={!!errors.salary_current}
            helperText={errors.salary_current || 'Monthly gross salary (optional)'}
            disabled={isSubmitting}
            placeholder="50000"
            inputProps={{
              min: 0,
              step: 1000,
            }}
          />
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