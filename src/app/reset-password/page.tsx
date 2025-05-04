'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'warning' }>({
    text: 'Processing your password reset request...',
    type: 'info'
  });
  const [loading, setLoading] = useState(true);
  const [sessionEstablished, setSessionEstablished] = useState(false);

  // 1. On mount, grab the token from the URL and create a session
  useEffect(() => {
    const processToken = async () => {
      try {
        console.log('Processing reset password token...');

        // Check if we have a hash fragment with the token
        const hashFragment = window.location.hash;
        console.log('Hash fragment:', hashFragment ? 'Present' : 'Not present');

        // Check if we have the access_token in the hash
        if (hashFragment && hashFragment.includes('access_token=')) {
          console.log('Found access_token in hash fragment');

          try {
            // Parse the hash fragment to get the token
            const params = new URLSearchParams(hashFragment.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const tokenType = params.get('type');

            console.log('Token type:', tokenType);

            if (accessToken && tokenType === 'recovery') {
              console.log('Found recovery token, attempting to set session...');

              // Explicitly set the session with the token
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });

              if (error) {
                console.error('Error setting session with token:', error);
                setMessage({
                  text: 'Error establishing session. Please request a new password reset link.',
                  type: 'error'
                });
              } else if (data?.session) {
                console.log('Session established successfully with token');
                setSessionEstablished(true);
                setMessage({
                  text: 'Please enter your new password below.',
                  type: 'info'
                });
              } else {
                console.log('No session established after setSession');
                setMessage({
                  text: 'Could not establish a session. Please request a new password reset link.',
                  type: 'error'
                });
              }
            } else {
              console.log('Token not found or not a recovery token');
              setMessage({
                text: 'Invalid password reset link. Please request a new password reset link.',
                type: 'error'
              });
            }
          } catch (parseErr) {
            console.error('Error parsing token from URL:', parseErr);
            setMessage({
              text: 'Error processing recovery token. Please request a new password reset link.',
              type: 'error'
            });
          }
        } else {
          console.log('No token found in URL');
          setMessage({
            text: 'No recovery token found. Please request a new password reset link.',
            type: 'error'
          });
        }
      } catch (err) {
        console.error('Exception processing reset token:', err);
        setMessage({
          text: 'An unexpected error occurred. Please try again or request a new password reset link.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    processToken();
  }, []);

  // Validate password
  const validatePassword = () => {
    if (newPassword.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  // 2. When they submit their new password
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate passwords
    const validationError = validatePassword();
    if (validationError) {
      setMessage({ text: validationError, type: 'error' });
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to update password...');

      // First check if we have an active session
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        console.error('No active session found');
        setMessage({
          text: 'Your session has expired. Please request a new password reset link.',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      console.log('Active session found, updating password...');

      // Update the password using the current session
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        setMessage({
          text: error.message || 'Failed to update password. Please try again.',
          type: 'error'
        });
        return;
      }

      // Password updated successfully
      console.log('Password updated successfully');
      setMessage({
        text: 'Password updated successfully! You will be redirected to the login page.',
        type: 'success'
      });

      // Sign out the user to clear the recovery session
      await supabase.auth.signOut();

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('Exception updating password:', err);
      setMessage({
        text: 'An unexpected error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Reset Your Password
        </Typography>

        <Alert
          severity={message.type}
          sx={{ width: '100%', mb: 3 }}
        >
          {message.text}
        </Alert>

        {sessionEstablished && message.type !== 'success' && (
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </Box>
        )}

        {message.type === 'success' && (
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        )}
      </Paper>
    </Container>
  );
}
