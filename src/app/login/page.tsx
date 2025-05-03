'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Stack, TextField, Typography, Alert } from '@mui/material';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error parameters in the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');

    if (errorParam === 'account_inactive') {
      setError('Your account has been deactivated. Please contact your administrator.');
    } else if (errorParam === 'account_verification_failed') {
      setError('Error verifying account status. Please contact support.');
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Authenticate the user with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Supabase Sign In Error:', signInError);
        setError(signInError.message || 'An unexpected error occurred.');
        return;
      }

      // Step 2: Check if the user's profile has is_active = false
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profile')
          .select('is_active')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Error verifying account status. Please contact support.');
          // Sign out the user since we couldn't verify their status
          await supabase.auth.signOut();
          return;
        }

        // If the user is inactive, sign them out and show an error
        if (profileData && profileData.is_active === false) {
          console.log('Inactive user attempted to log in:', email);
          await supabase.auth.signOut();
          setError('Your account has been deactivated. Please contact your administrator.');
          return;
        }

        // User is authenticated and active, proceed with login
        console.log('Login successful!');
        router.push('/all-applications');
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred. Please try again.');
      // Attempt to sign out in case of unexpected errors
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.error('Error signing out after failed login:', signOutErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
          <Stack spacing={2}>
            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}