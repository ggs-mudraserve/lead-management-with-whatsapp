'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';
import { differenceInDays, parseISO } from 'date-fns';
import { MOBILE_MASKING_DAYS } from '@/lib/env';
import { deleteLead } from '@/lib/supabase/queries/leads';

// Updated dropdown data based on PRD 3.3
const segments = ['PL', 'BL']; // Personal Loan, Business Loan
const rentalStatuses = ['Rented', 'Owned'];

// Interface for form state (camelCase)
interface LeadFormData {
  segment: string;
  firstName: string;
  lastName: string;
  mother_name: string;
  father_name: string; // New field
  pan: string; // New field
  mobile: string;
  current_resi_address: string;
  current_pin_code: string;
  rented_owned: string;
  permanent_address: string;
  company_name: string;
  net_salary: string;
  office_address: string;
  official_mail_id: string;
  personal_mail_id: string;
  dob: string;
  spouse_name: string;
  designation: string; // New field
  date_of_joining: string; // New field
  turnover: string; // New field
  nature_of_business: string; // New field
  reference_1_name: string;
  reference_1_phone: string;
  reference_1_address: string;
  reference_2_name: string;
  reference_2_phone: string;
  reference_2_address: string;
  leadOwner: string | null;
}

// Interface matching Supabase leads table (snake_case)
// Based on databasedetails.md
interface SupabaseLeadData {
  id: string;
  mobile_number: string;
  first_name: string;
  last_name: string | null;
  mother_name: string | null;
  father_name: string | null; // New field
  pan: string | null; // New field
  current_resi_address: string | null;
  current_pin_code: string | null;
  permanent_address: string | null;
  company_name: string | null;
  net_salary: number | null; // numeric(12,2)
  office_address: string | null;
  official_mail_id: string | null;
  personal_mail_id: string | null;
  dob: string | null; // date
  spouse_name: string | null;
  designation: string | null; // New field
  date_of_joining: string | null; // New field - date
  turnover: number | null; // New field - numeric
  nature_of_business: string | null; // New field
  reference_1_name: string | null;
  reference_1_phone: string | null;
  reference_1_address: string | null;
  reference_2_name: string | null;
  reference_2_phone: string | null;
  reference_2_address: string | null;
  lead_owner: string | null; // uuid
  created_at: string | null; // timestamp with time zone
  updated_at: string | null; // timestamp with time zone
  segment: 'PL' | 'BL' | null; // segment_type enum
  rented_owned: 'Rented' | 'Owned' | null; // rental_status enum
}

// Interface for assignable user data
interface AssignableUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

// Helper function to mask mobile number
const maskMobileNumberHelper = (mobile: string): string => {
  if (!mobile || mobile.length <= 4) {
    return mobile; // Return original if invalid or too short
  }
  return 'XXXXXX' + mobile.slice(-4);
};

export function LeadForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const leadId = params.id as string | undefined;
  const isCreateMode = !leadId || leadId === 'create';
  const mobileFromQuery = searchParams.get('mobile');

  // Use the custom hook to get auth state
  const { profile, loading: authLoading } = useAuth();
  // Get role from the fetched profile data
  const userRole = profile?.role;
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [formData, setFormData] = useState<LeadFormData>({
    segment: '',
    firstName: '',
    lastName: '',
    mother_name: '',
    father_name: '',
    pan: '',
    mobile: '',
    current_resi_address: '',
    current_pin_code: '',
    rented_owned: '',
    permanent_address: '',
    company_name: '',
    net_salary: '',
    office_address: '',
    official_mail_id: '',
    personal_mail_id: '',
    dob: '',
    spouse_name: '',
    designation: '',
    date_of_joining: '',
    turnover: '',
    nature_of_business: '',
    reference_1_name: '',
    reference_1_phone: '',
    reference_1_address: '',
    reference_2_name: '',
    reference_2_phone: '',
    reference_2_address: '',
    leadOwner: null,
  });

  // Snackbar state for success/error messages
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Task 4.1: Fetch lead data using TanStack Query
  const { data: leadData, isLoading: isLoadingLead, isError, error: leadError } = useQuery<
    SupabaseLeadData,
    Error
  >(
    {
      queryKey: ['lead', leadId],
      queryFn: async (): Promise<SupabaseLeadData> => {
        if (!leadId || isCreateMode) {
             throw new Error('Query should not run in create mode or without leadId');
        }

        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (error) {
          console.error("Error fetching lead:", error);
          if (error.code === 'PGRST116') {
             throw new Error('Lead not found or access denied.');
          }
          throw error;
        }
        if (!data) {
             throw new Error('Lead not found.');
        }
        return data as SupabaseLeadData;
      },
      enabled: !isCreateMode && !!leadId,
      retry: 1, // Don't retry excessively on error like 404
      refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
    }
  );

  // Task 4.5: Fetch assignable users (active Agents/TLs) for Admin dropdown
  const { data: assignableUsers, isLoading: isLoadingUsers } = useQuery<AssignableUser[], Error>({
      queryKey: ['assignableUsers'],
      queryFn: async () => {
          const { data, error } = await supabase
              .from('profile')
              .select('id, first_name, last_name')
              .in('role', ['agent', 'team_leader'])
              .eq('is_active', true)
              .order('first_name', { ascending: true });

          if (error) {
              console.error("Error fetching assignable users:", error);
              throw new Error('Failed to fetch users for assignment.');
          }
          return data || [];
      },
      enabled: !!profile && userRole === 'admin' && !isCreateMode && !authLoading,
      refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isCreateMode && mobileFromQuery) {
      setFormData((prev) => ({ ...prev, mobile: mobileFromQuery, leadOwner: null }));
    }
  }, [isCreateMode, mobileFromQuery]);

  useEffect(() => {
    if (leadData && !isCreateMode) {
      // Map fetched Supabase data (snake_case) to form state (camelCase)
      setFormData({
        segment: leadData.segment || '',
        firstName: leadData.first_name || '',
        lastName: leadData.last_name || '',
        mother_name: leadData.mother_name || '',
        father_name: leadData.father_name || '',
        pan: leadData.pan || '',
        mobile: leadData.mobile_number || '',
        current_resi_address: leadData.current_resi_address || '',
        current_pin_code: leadData.current_pin_code || '',
        rented_owned: leadData.rented_owned || '',
        permanent_address: leadData.permanent_address || '',
        company_name: leadData.company_name || '',
        net_salary: leadData.net_salary !== null ? String(leadData.net_salary) : '',
        office_address: leadData.office_address || '',
        official_mail_id: leadData.official_mail_id || '',
        personal_mail_id: leadData.personal_mail_id || '',
        dob: leadData.dob || '',
        spouse_name: leadData.spouse_name || '',
        designation: leadData.designation || '',
        date_of_joining: leadData.date_of_joining || '',
        turnover: leadData.turnover !== null ? String(leadData.turnover) : '',
        nature_of_business: leadData.nature_of_business || '',
        reference_1_name: leadData.reference_1_name || '',
        reference_1_phone: leadData.reference_1_phone || '',
        reference_1_address: leadData.reference_1_address || '',
        reference_2_name: leadData.reference_2_name || '',
        reference_2_phone: leadData.reference_2_phone || '',
        reference_2_address: leadData.reference_2_address || '',
        leadOwner: leadData.lead_owner || null,
      });
    }
  }, [leadData, isCreateMode]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target;
    setFormData((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

 const handleSelectChange = (event: SelectChangeEvent<string>) => {
     const target = event.target;
     setFormData(prev => ({
         ...prev,
         [target.name]: target.value === '' ? null : target.value
     }));
  };

 // Task 4.3/4.5: Implement mutation for saving lead data (Updated for leadOwner)
 const saveLeadMutation = useMutation<
    SupabaseLeadData, // Return type of the mutation function
    Error,            // Type of error
    LeadFormData      // Type of variables passed to mutationFn
 >({
    mutationFn: async (formDataToSave: LeadFormData) => {
        // Map form data (camelCase) to Supabase schema (snake_case)
        const mappedData: Partial<SupabaseLeadData> = {
            first_name: formDataToSave.firstName,
            last_name: formDataToSave.lastName || null,
            mother_name: formDataToSave.mother_name || null,
            father_name: formDataToSave.father_name || null,
            pan: formDataToSave.pan || null,
            mobile_number: formDataToSave.mobile,
            current_resi_address: formDataToSave.current_resi_address || null,
            current_pin_code: formDataToSave.current_pin_code || null,
            permanent_address: formDataToSave.permanent_address || null,
            company_name: formDataToSave.company_name || null,
            net_salary: formDataToSave.net_salary ? parseFloat(formDataToSave.net_salary) : null,
            office_address: formDataToSave.office_address || null,
            official_mail_id: formDataToSave.official_mail_id || null,
            personal_mail_id: formDataToSave.personal_mail_id || null,
            dob: formDataToSave.dob || null,
            spouse_name: formDataToSave.spouse_name || null,
            designation: formDataToSave.designation || null,
            date_of_joining: formDataToSave.date_of_joining || null,
            turnover: formDataToSave.turnover ? parseFloat(formDataToSave.turnover) : null,
            nature_of_business: formDataToSave.nature_of_business || null,
            reference_1_name: formDataToSave.reference_1_name || null,
            reference_1_phone: formDataToSave.reference_1_phone || null,
            reference_1_address: formDataToSave.reference_1_address || null,
            reference_2_name: formDataToSave.reference_2_name || null,
            reference_2_phone: formDataToSave.reference_2_phone || null,
            reference_2_address: formDataToSave.reference_2_address || null,
            segment: (formDataToSave.segment as 'PL' | 'BL') || null,
            rented_owned: (formDataToSave.rented_owned as 'Rented' | 'Owned') || null,
        };

        // Task 4.5: Only include lead_owner if user is admin
        if (userRole === 'admin') {
           mappedData.lead_owner = formDataToSave.leadOwner;
        }

        let data: SupabaseLeadData | null = null;
        let error: Error | null = null;

        if (isCreateMode) {
            // Insert new lead
            const { data: insertData, error: insertError } = await supabase
                .from('leads')
                .insert(mappedData)
                .select()
                .single();
            data = insertData as SupabaseLeadData | null;
            error = insertError;
        } else {
            // Update existing lead
            const { data: updateData, error: updateError } = await supabase
                .from('leads')
                .update(mappedData)
                .eq('id', leadId!)
                .select()
                .single();
             data = updateData as SupabaseLeadData | null;
             error = updateError;
        }

        if (error) throw error;
        if (!data) throw new Error('Failed to save lead. No data returned.');

        return data;
    },
    onSuccess: (savedData, variables) => {
        console.log('Save successful! Saved Data:', savedData);
        console.log('Variables passed to mutation:', variables);
        try {
            setSnackbar({ open: true, message: `Lead ${isCreateMode ? 'created' : 'updated'} successfully!`, severity: 'success' });
            if (isCreateMode && savedData.id) {
                console.log(`Navigating to new lead edit page: /leads/${savedData.id}/edit`);
                router.push(`/leads/${savedData.id}/edit`);
            } else {
                console.log(`Invalidating query: ['lead', ${leadId}]`);
                queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
            }
        } catch (e) {
            console.error('Error in onSuccess handler:', e);
            // Optionally show an error snackbar here too
        }
    },
    onError: (error, variables) => {
         console.error("Error saving lead:", error);
         console.log('Variables passed to mutation during error:', variables);
         setSnackbar({ open: true, message: error.message || 'Failed to save lead.', severity: 'error' });
    }
 });

 // Delete lead mutation
 const deleteLeadMutation = useMutation({
    mutationFn: () => {
      if (!leadId) throw new Error('Lead ID is required for deletion');
      return deleteLead(supabase, leadId);
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Lead deleted successfully!', severity: 'success' });
      setDeleteConfirmOpen(false);
      // Redirect to leads list page
      router.push('/leads');
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Failed to delete lead: ${error.message}`, severity: 'error' });
      setDeleteConfirmOpen(false);
    },
 });

 // Update handleSubmit to call the mutation
 const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Basic frontend validation (can be enhanced)
    if (!formData.firstName || !formData.lastName) {
        setSnackbar({ open: true, message: 'First Name and Last Name are required.', severity: 'error' });
        return;
    }
    saveLeadMutation.mutate(formData);
  };

  const handleSnackbarClose = () => {
     setSnackbar(prev => ({ ...prev, open: false }));
  }

  const openDeleteDialog = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteLeadMutation.mutate();
  };

  // Combine all loading states
  const isProcessing = authLoading || isLoadingLead || saveLeadMutation.isPending || deleteLeadMutation.isPending || (userRole === 'admin' && !isCreateMode && isLoadingUsers);

  // Display loading indicator if any relevant data is loading
  if (isProcessing && !isCreateMode) { // Show loading primarily in edit mode
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle lead fetch error (only relevant in edit mode)
  if (isError && !isCreateMode) {
    return (
        <Alert severity="error" sx={{ mt: 4 }}>
            {leadError?.message || 'Failed to load lead details. Please try again.'}
        </Alert>
    )
  }

  // If auth is still loading in create mode, maybe show a generic loader?
  // Or allow form render but disable submission until auth loads?
  // For now, form will render with potentially undefined userRole initially.

  // Ensure leadData?.created_at is handled if null/undefined
  // Re-introduce role and date check for display masking
  const calculateDisplayMobileNumber = (): string => {
      // Condition 1: Admin sees full number
      if (userRole === 'admin') {
          return formData.mobile;
      }

      // Condition 2: Non-admin, check date
      if (leadData?.created_at) {
          try {
              const createdAtDate = parseISO(leadData.created_at);
              const daysDiff = differenceInDays(new Date(), createdAtDate);
              if (daysDiff > MOBILE_MASKING_DAYS) {
                  // Apply mask if older than the configured number of days
                  return maskMobileNumberHelper(formData.mobile);
              }
          } catch (dateError) {
              console.error("Error parsing lead creation date for display masking:", dateError);
              // Fallback to original number on date parse error
              return formData.mobile;
          }
      }

      // Condition 3: Default - Non-admin, lead newer than 20 days or no date
      return formData.mobile;
  };
  const displayMobileNumber = calculateDisplayMobileNumber();

  // --- Export to Excel Function --- START
  const handleExport = async () => {
    if (!profile || !['admin', 'backend'].includes(profile.role ?? '')) {
      setSnackbar({ open: true, message: 'Permission denied for export.', severity: 'error' });
      return;
    }
    if (!leadData) {
        setSnackbar({ open: true, message: 'No lead data available to export.', severity: 'error' });
        return;
    }

    setIsExporting(true);
    try {
      // Define a custom order for columns (keys from SupabaseLeadData)
      // You can rearrange this array to change the order of columns in the exported file
      const orderedColumns = [
        // Personal Information
        'first_name',
        'last_name',
        'mobile_number',
        'segment',
        'mother_name',
        'father_name',
        'pan',
        'dob',
        'spouse_name',

        // Contact Information
        'personal_mail_id',
        'official_mail_id',

        // Address Information
        'current_resi_address',
        'current_pin_code',
        'rented_owned',
        'permanent_address',

        // Employment Information
        'company_name',
        'designation',
        'date_of_joining',
        'net_salary',
        'turnover',
        'nature_of_business',
        'office_address',

        // References
        'reference_1_name',
        'reference_1_phone',
        'reference_1_address',
        'reference_2_name',
        'reference_2_phone',
        'reference_2_address',

        // Lead Management
        'lead_owner',
        'created_at',
        'updated_at'
      ];

      // Filter out any columns that don't exist in the leadData
      const headers = orderedColumns.filter(column =>
        column in leadData && column !== 'id'
      );

      // Add any columns from leadData that might not be in our ordered list
      // This ensures we don't miss any data that might be in the database
      Object.keys(leadData)
        .filter(key => key !== 'id' && !headers.includes(key))
        .forEach(key => headers.push(key));

      // Check if masking is needed
      let shouldMask = false;
      if (userRole === 'backend' && leadData.created_at) {
        try {
            const createdAtDate = parseISO(leadData.created_at);
            const daysDiff = differenceInDays(new Date(), createdAtDate);
            if (daysDiff > MOBILE_MASKING_DAYS) {
                shouldMask = true;
            }
        } catch (dateError) {
            console.error("Error parsing lead creation date:", dateError);
            // Decide how to handle parse errors, e.g., don't mask or show error
        }
      }

      // Prepare data row, applying mask if necessary
      const dataRow = headers.map(header => {
        const value = leadData[header as keyof SupabaseLeadData];
        if (header === 'mobile_number' && shouldMask) {
          return maskMobileNumberHelper(String(value ?? '')); // Mask the mobile number
        }
        return value ?? ''; // Return original value or empty string
      });

      const sheetData = [
        headers.map(h => h.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())), // Format headers
        dataRow // Use the potentially masked dataRow
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lead Details');

      // Generate filename
      const safeLeadId = leadId ?? ''; // Provide fallback for undefined leadId
      const fileName = `Lead_${leadData.first_name || ''}_${leadData.last_name || ''}_${safeLeadId.substring(0, 6) || 'details'}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setSnackbar({ open: true, message: 'Export successful!', severity: 'success' });

    } catch (error) {
      console.error("Export failed:", error);
      setSnackbar({ open: true, message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' });
    } finally {
      setIsExporting(false);
    }
  };
  // --- Export to Excel Function --- END

  const canExport = profile && ['admin', 'backend'].includes(profile.role ?? '') && !isCreateMode; // Can export only in edit mode

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 3 }}>
            <Typography variant="h4" component="h1">
                {isCreateMode ? 'Create New Lead' : 'Edit Lead'}
            </Typography>
            {canExport && (
                 <Button
                    variant="outlined"
                    startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleExport}
                    disabled={isExporting || !leadData}
                >
                    {isExporting ? 'Exporting...' : 'Export Lead Data'}
                </Button>
            )}
        </Box>

       {/* --- Admin Only: Lead Owner Assignment (Task 4.5) --- */}
       {userRole === 'admin' && !isCreateMode && profile && (
         <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>Lead Assignment</Typography>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel id="leadOwner-label">Lead Owner</InputLabel>
                  <Select
                    labelId="leadOwner-label"
                    id="leadOwner"
                    name="leadOwner"
                    value={formData.leadOwner || ''}
                    label="Lead Owner"
                    onChange={handleSelectChange}
                    disabled={isLoadingUsers}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {assignableUsers?.map((assignableUser) => (
                      <MenuItem key={assignableUser.id} value={assignableUser.id}>
                        {assignableUser.first_name || ''} {assignableUser.last_name || ''} ({assignableUser.id.substring(0, 6)}...)
                      </MenuItem>
                    ))}
                  </Select>
                  {isLoadingUsers && <CircularProgress size={20} sx={{ position: 'absolute', top: '50%', right: '10px', marginTop: '-10px' }} />}
                </FormControl>
            </CardContent>
         </Card>
       )}

       {/* --- Personal Information Card --- */}
       <Card sx={{ mb: 3 }}>
         <CardContent>
           <Typography variant="h6" gutterBottom>Personal Information</Typography>
           <Grid container spacing={2}>
             <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ minWidth: '200px' }}>
                  <InputLabel id="segment-label">Segment (PL/BL)</InputLabel>
                  <Select
                    labelId="segment-label"
                    id="segment"
                    name="segment"
                    value={formData.segment}
                    label="Segment (PL/BL)"
                    onChange={handleSelectChange}
                    sx={{ width: '100%' }}
                  >
                    {segments.map((seg) => (
                      <MenuItem key={seg} value={seg}>
                        {seg}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
             </Grid>
             <Grid item xs={12} sm={6}></Grid>
             <Grid item xs={12} sm={6}>
                <TextField required fullWidth id="firstName" label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
             </Grid>
             <Grid item xs={12} sm={6}>
                <TextField required fullWidth id="lastName" label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
             </Grid>
             <Grid item xs={12} sm={6}>
                <TextField fullWidth id="father_name" label="Father's Name" name="father_name" value={formData.father_name} onChange={handleChange} />
             </Grid>
             <Grid item xs={12} sm={6}>
                <TextField fullWidth id="mother_name" label="Mother's Name" name="mother_name" value={formData.mother_name} onChange={handleChange} />
             </Grid>
             <Grid item xs={12} sm={6}>
                 <TextField fullWidth id="dob" label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} InputLabelProps={{ shrink: true }} />
             </Grid>
             <Grid item xs={12} sm={6}>
                 <TextField fullWidth id="spouse_name" label="Spouse Name" name="spouse_name" value={formData.spouse_name} onChange={handleChange} />
             </Grid>
             <Grid item xs={12} sm={6}>
                 <TextField fullWidth id="pan" label="PAN Number" name="pan" value={formData.pan} onChange={handleChange} inputProps={{ maxLength: 10 }} />
             </Grid>
           </Grid>
         </CardContent>
       </Card>

       {/* --- Contact Information Card (Mobile Number Masking Task 4.4) --- */}
       <Card sx={{ mb: 3 }}>
         <CardContent>
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="mobile"
                      label="Mobile Number"
                      name="mobile"
                      value={displayMobileNumber}
                      onChange={handleChange}
                      InputProps={{ readOnly: (isCreateMode && !!mobileFromQuery) || (displayMobileNumber !== formData.mobile) }}
                      inputProps={{ maxLength: 10, pattern: '\\d{10}', title: 'Please enter exactly 10 digits' }}
                      helperText={displayMobileNumber !== formData.mobile ? "Number masked for privacy" : ""}
                    />
                </Grid>
                <Grid item xs={12} sm={6}></Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth id="personal_mail_id" label="Personal Email" name="personal_mail_id" type="email" value={formData.personal_mail_id} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth id="official_mail_id" label="Official Email" name="official_mail_id" type="email" value={formData.official_mail_id} onChange={handleChange} />
                </Grid>
            </Grid>
         </CardContent>
       </Card>

       {/* --- Address Information Card --- */}
       <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Address Information</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField fullWidth id="current_resi_address" label="Current Residential Address" name="current_resi_address" multiline rows={3} value={formData.current_resi_address} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth id="current_pin_code" label="Current Pincode" name="current_pin_code" value={formData.current_pin_code} onChange={handleChange} inputProps={{ maxLength: 6, pattern: '\\d{6}', title: 'Please enter exactly 6 digits' }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ minWidth: '200px' }}>
                    <InputLabel id="rented_owned-label">Rental Status</InputLabel>
                    <Select
                        labelId="rented_owned-label"
                        id="rented_owned"
                        name="rented_owned"
                        value={formData.rented_owned}
                        label="Rental Status"
                        onChange={handleSelectChange}
                        sx={{ width: '100%' }}
                    >
                        {rentalStatuses.map((status) => (<MenuItem key={status} value={status}>{status}</MenuItem>))}
                    </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth id="permanent_address" label="Permanent Address (if different)" name="permanent_address" multiline rows={3} value={formData.permanent_address} onChange={handleChange} />
                </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* --- Employment Information Card --- */}
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>Employment Information</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth id="company_name" label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth id="designation" label="Designation" name="designation" value={formData.designation} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth id="date_of_joining" label="Date of Joining" name="date_of_joining" type="date" value={formData.date_of_joining} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth id="net_salary" label="Net Salary" name="net_salary" type="number" value={formData.net_salary} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth id="turnover" label="Turnover" name="turnover" type="number" value={formData.turnover} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth id="nature_of_business" label="Nature of Business" name="nature_of_business" value={formData.nature_of_business} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth id="office_address" label="Office Address" name="office_address" multiline rows={3} value={formData.office_address} onChange={handleChange} />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>

        {/* --- References Card --- */}
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>References</Typography>
                 {/* Reference 1 */}
                <Typography variant="subtitle1" component="h3" sx={{ mt: 2, mb: 1 }}>Reference 1</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField fullWidth id="reference_1_name" label="Ref 1 Name" name="reference_1_name" value={formData.reference_1_name} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth id="reference_1_phone" label="Ref 1 Phone" name="reference_1_phone" value={formData.reference_1_phone} onChange={handleChange} inputProps={{ maxLength: 10, pattern: '\\d{10}' }} /></Grid>
                    <Grid item xs={12}><TextField fullWidth id="reference_1_address" label="Ref 1 Address" name="reference_1_address" multiline rows={2} value={formData.reference_1_address} onChange={handleChange} /></Grid>
                </Grid>
                 {/* Reference 2 */}
                 <Typography variant="subtitle1" component="h3" sx={{ mt: 3, mb: 1 }}>Reference 2</Typography>
                 <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField fullWidth id="reference_2_name" label="Ref 2 Name" name="reference_2_name" value={formData.reference_2_name} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth id="reference_2_phone" label="Ref 2 Phone" name="reference_2_phone" value={formData.reference_2_phone} onChange={handleChange} inputProps={{ maxLength: 10, pattern: '\\d{10}' }} /></Grid>
                    <Grid item xs={12}><TextField fullWidth id="reference_2_address" label="Ref 2 Address" name="reference_2_address" multiline rows={2} value={formData.reference_2_address} onChange={handleChange} /></Grid>
                 </Grid>
            </CardContent>
        </Card>

        {/* TODO: Add sections for Notes (Task 5), Documents (Task 6), Bank Apps (Task 7) - likely within their own Cards */}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 4 }}>
          <Button type="submit" variant="contained" sx={{ flexGrow: 1 }} disabled={isProcessing || saveLeadMutation.isPending}>
            {saveLeadMutation.isPending ? 'Saving...' : (isCreateMode ? 'Create Lead' : 'Save Changes')}
          </Button>

          {/* Delete button - only visible to admin users in edit mode */}
          {userRole === 'admin' && !isCreateMode && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteDialog}
              disabled={isProcessing || deleteLeadMutation.isPending}
              sx={{ ml: 2 }}
            >
              {deleteLeadMutation.isPending ? 'Deleting...' : 'Delete Lead'}
            </Button>
          )}
        </Box>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">Confirm Delete Lead</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to permanently delete this lead? This action cannot be undone and will remove all associated data.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLeadMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              disabled={deleteLeadMutation.isPending}
              startIcon={deleteLeadMutation.isPending ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {deleteLeadMutation.isPending ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for feedback */}
         <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
     </Box>
  );
}