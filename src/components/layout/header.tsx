'use client'; // Required for hook usage

import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button'; // Import Button
import Box from '@mui/material/Box'; // Import Box for layout
import Skeleton from '@mui/material/Skeleton'; // Import Skeleton
import Link from 'next/link'; // Import Next Link
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import TextField from '@mui/material/TextField';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client'; // Import the initialized client instance
import { useRouter, usePathname } from 'next/navigation'; // Next.js router
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';
import { styled, keyframes } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

// Expected response type from check_lead_status_by_mobile RPC
interface CheckLeadStatusResponse {
  status: 'DOES_NOT_EXIST' | 'EXISTS_ACCESSIBLE' | 'EXISTS_INACCESSIBLE';
  leadId?: string; // Changed to camelCase to match actual response
}

// Animation keyframes
const slideInFromTop = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
const ModernAppBar = styled(AppBar)(() => ({
  background: '#ffffff',
  color: '#0f172a',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)',
  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
  animation: `${slideInFromTop} 0.8s ease-out`,
}));

const LogoTypography = styled(Typography)(() => ({
  background: 'linear-gradient(45deg, #0ea5e9 30%, #0f172a 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontFamily: 'monospace',
  fontWeight: 700,
  letterSpacing: '.1rem',
  textDecoration: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    filter: 'drop-shadow(2px 2px 4px rgba(15,23,42,0.2))',
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1, 2),
  fontWeight: 600,
  textTransform: 'none',
  color: '#475569',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.1)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(15,23,42,0.05), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: '#f8fafc',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      transform: 'scale(1.02)',
    },
    '&.Mui-focused': {
      backgroundColor: '#f1f5f9',
      transform: 'scale(1.02)',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
    },
    '& fieldset': {
      borderColor: 'rgba(226, 232, 240, 0.8)',
    },
    '&:hover fieldset': {
      borderColor: '#94a3b8',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0ea5e9',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#64748b',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#0ea5e9',
  },
  '& .MuiOutlinedInput-input': {
    color: '#0f172a',
    fontWeight: 500,
  },
}));

const SearchButton = styled(ModernButton)(({ theme }) => ({
  background: '#0ea5e9',
  color: 'white',
  marginLeft: theme.spacing(1),
  '&:hover': {
    background: '#0284c7',
    color: 'white',
  },
  '&:disabled': {
    background: '#94a3b8',
    color: '#e2e8f0',
  },
}));

// Per rule 14: Use named exports for components
export function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSearch, setMobileSearch] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');

  // Reset state when pathname changes and optimize for performance
  useEffect(() => {
    // Clear any previous search or errors when navigating
    setMobileSearch('');
    setSnackbarOpen(false);

    // This helps ensure the component is fully ready after navigation
    const timeoutId = setTimeout(() => {
      // Force a re-render to ensure everything is properly updated
      // This is a no-op that triggers React's update cycle
      setSnackbarMessage(prev => prev);
    }, 0);

    return () => {
      // Clean up the timeout to prevent memory leaks
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Define menu items based on roles (PRD 3.6)
  // TODO: Replace placeholders with actual links and potentially icons
  const commonLinks = [
    { label: 'All Applications', href: '/all-applications' },
  ];

  // WhatsApp link removed

  // Individual links based on PRD 3.6 visibility
  const disbursedLink = { label: 'Disbursed', href: '/disbursed-applications' };
  const missedLink = { label: 'Missed', href: '/missed-opportunities' };

  // Removed agentTlLinks (Search box is handled separately)

  // Removed backendAdminLinks array

  const adminOnlyLinks = [
    { label: 'Users', href: '/admin/users' }, // Example route
    { label: 'Teams', href: '/admin/teams' }, // Example route
    { label: 'Performance Report', href: '/admin/performance' }, // Updated to new performance route
    // { label: 'Report', href: '/admin/conversion-report' }, // Keep old one commented/removed
  ];

  let menuLinks: { label: string; href: string }[] = [];
  if (user && profile) { // Ensure profile exists
    menuLinks = [...commonLinks];
    const role = profile.role; // Removed optional chaining as we check profile exists

    // Add links visible to Agent, TL, Backend, Admin
    if (role === 'agent' || role === 'team_leader' || role === 'backend' || role === 'admin') {
        // Search box is separate UI element, not a link here
    }

    // Add links visible to Agent, TL, Admin (PRD 3.6 for Disbursed/Missed)
    if (role === 'agent' || role === 'team_leader' || role === 'admin') {
      menuLinks.push(disbursedLink);
      menuLinks.push(missedLink);
    }

    // Add links visible only to Backend (Currently none specific other than search/common)
    // Can add Backend specific logic here if needed in future

    // Add links visible only to Admin
    if (role === 'admin') {
      menuLinks = [...menuLinks, ...adminOnlyLinks];
    }
  }

  // Mutation to check lead status
  const checkLeadMutation = useMutation<CheckLeadStatusResponse, Error, string>({
    mutationFn: async (mobile: string) => {
      const { data, error } = await supabase.rpc('check_lead_status_by_mobile', {
        search_mobile: mobile,
      });

      if (error) {
        console.error('RPC Error:', error);
        // Throw the error to be caught by onError
        throw new Error(error.message || 'Failed to check lead status.');
      }

      // Check if the RPC function itself returned a structured error (though this function likely won't)
      // This pattern is useful if the function could return { error: { errorCode: '...', message: '...' } }
      if (data && typeof data === 'object' && 'errorCode' in data) {
         throw new Error(data.message || 'An error occurred in the function.');
      }

      return data as CheckLeadStatusResponse; // Assume success if no error thrown
    },
    onSuccess: (data) => {
      if (!data || !data.status) {
         setSnackbarMessage('Received invalid response from server.');
         setSnackbarSeverity('error');
         setSnackbarOpen(true);
         return;
      }
      if (data.status === 'DOES_NOT_EXIST') {
        router.push(`/leads/create?mobile=${mobileSearch}`);
      } else if (data.status === 'EXISTS_ACCESSIBLE' && data.leadId) {
        router.push(`/leads/${data.leadId}/edit`);
      } else if (data.status === 'EXISTS_INACCESSIBLE') {
        setSnackbarMessage('Access Denied: You do not have permission to view this lead.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    },
    onError: (error) => {
      setSnackbarMessage(error.message || 'An unexpected error occurred.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMobileSearch(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // triggerSearch(); // Call the core logic
    // Basic validation for 10 digits (more robust validation needed)
    // console.log('--- handleSearchSubmit / triggerSearch ---'); // Removed log
    if (/^\d{10}$/.test(mobileSearch)) {
      checkLeadMutation.mutate(mobileSearch);
    } else {
      setSnackbarMessage('Invalid mobile number format. Please enter exactly 10 digits.');
      // Ensure severity is set correctly when validation fails
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Roles that can see the search bar (PRD 3.3)
  // Make comparison case-insensitive or check for known variations
  const canSearch = user && (profile?.role?.toLowerCase() === 'agent' || profile?.role?.toLowerCase() === 'tl' || profile?.role?.toLowerCase() === 'backend' || profile?.role?.toLowerCase() === 'admin'); // simplified back

  return (
    <ModernAppBar position="static">
      <Container maxWidth={false}> {/* Use Container for consistent padding */}
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Left side: Logo and Menu Links */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LogoTypography
              variant="h6"
              noWrap
              component={Link} // Use Next Link
              href={user ? "/all-applications" : "/login"} // Link to dashboard or login
              sx={{ mr: 2 }}
            >
              LEADAPP
            </LogoTypography>

            {/* Navigation Links - Render only if logged in */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 2 }}>
                {loading && (
                    // Show skeletons for links while loading auth state
                    <>
                        <Skeleton variant="text" width={100} sx={{ mr: 2 }}/>
                        <Skeleton variant="text" width={80} sx={{ mr: 2 }}/>
                    </>
                )}
                {!loading && user && menuLinks.map((link, index) => (
                  <Fade in={true} timeout={800} style={{ transitionDelay: `${index * 100}ms` }} key={link.label}>
                    <ModernButton
                      component={Link}
                      href={link.href}
                      sx={{ my: 2, color: '#0f172a', display: 'block' }}
                    >
                      {link.label}
                    </ModernButton>
                  </Fade>
                ))}
            </Box>
          </Box>

          {/* Right side: User Info & Logout or Login Button */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {loading && (
              <Skeleton variant="text" width={150} sx={{ mr: 2 }} />
            )}
            {!loading && user && profile && (
              <Typography sx={{ mr: 2, display: { xs: 'none', sm: 'block' }, color: '#475569' }}> {/* Hide on extra small screens */}
                Welcome, {profile.first_name || user.email} ({profile.role})
              </Typography>
            )}
            {!loading && user && (
              <Fade in={true} timeout={1000}>
                <ModernButton onClick={signOut} sx={{ color: '#0f172a' }}>
                  Logout
                </ModernButton>
              </Fade>
            )}
            {!loading && !user && (
              <Fade in={true} timeout={1000}>
                <ModernButton component={Link} href="/login" sx={{ color: '#0f172a' }}>
                  Login
                </ModernButton>
              </Fade>
            )}
          </Box>

          {/* Conditional Search Box */}
          {canSearch && (
            <Fade in={true} timeout={1200} style={{ transitionDelay: '300ms' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                <SearchField
                  label="Search Mobile (10 digits)"
                  variant="outlined"
                  size="small"
                  value={mobileSearch}
                  onChange={handleSearchChange}
                  inputProps={{
                    maxLength: 10,
                    pattern: '\\d{10}',
                    title: 'Please enter exactly 10 digits',
                  }}
                  disabled={checkLeadMutation.isPending}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <SearchButton
                  type="submit"
                  variant="contained"
                  size="medium"
                  disabled={checkLeadMutation.isPending}
                >
                  {checkLeadMutation.isPending ? 'Searching...' : 'Search / Create'}
                </SearchButton>
              </form>
            </Fade>
          )}

        </Toolbar>
      </Container>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ModernAppBar>
  );
}

// No subcomponents, helper functions, or types needed yet