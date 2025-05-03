'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { debounce } from '@/utils/performance';

interface InactivityWarningProps {
  timeoutMinutes: number;
}

export function InactivityWarning({ timeoutMinutes }: InactivityWarningProps) {
  const { signOut, user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  
  // Use refs to store the timer IDs so they persist across renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to reset the timers
  const resetTimers = useCallback(() => {
    // Only proceed if user is logged in
    if (!user) return;
    
    // Convert minutes to milliseconds
    const timeoutDuration = timeoutMinutes * 60 * 1000;
    // Warning will show 1 minute before logout
    const warningTime = 1 * 60 * 1000;
    
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    
    // Hide warning if it's showing
    setShowWarning(false);
    
    // Set a new warning timer (9 minutes)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, timeoutDuration - warningTime);

    // Set a new timeout timer (10 minutes)
    timeoutRef.current = setTimeout(() => {
      signOut();
    }, timeoutDuration);
  }, [timeoutMinutes, signOut, user]);
  
  // Debounce the resetTimers function to prevent excessive calls
  const debouncedResetTimers = useCallback(
    debounce(() => resetTimers(), 300),
    [resetTimers]
  );

  // Define the activity event handler
  const handleActivity = useCallback(() => {
    debouncedResetTimers();
  }, [debouncedResetTimers]);
  
  // Handle closing the warning
  const handleWarningClose = useCallback(() => {
    setShowWarning(false);
    // Reset timers when user interacts with the warning
    resetTimers();
  }, [resetTimers]);
  
  // Set up event listeners for user activity
  useEffect(() => {
    // Only set up the inactivity timeout if the user is logged in
    if (!user) return;
    
    // Initialize the timers
    resetTimers();

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('touchmove', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, resetTimers, handleActivity]);

  return (
    <Snackbar
      open={showWarning}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={handleWarningClose}
    >
      <Alert
        onClose={handleWarningClose}
        severity="warning"
        sx={{ width: '100%' }}
      >
        Your session will expire in 1 minute due to inactivity. Click or move to stay logged in.
      </Alert>
    </Snackbar>
  );
}
