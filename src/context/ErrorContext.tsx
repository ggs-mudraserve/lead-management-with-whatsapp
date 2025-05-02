import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface ErrorInfo {
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

interface ErrorContextType {
  showError: (error: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorInfo(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showError = useCallback((error: any) => {
    console.error('Error Handler:', error); // Log the original error

    let message = 'An unexpected error occurred.';
    let severity: ErrorInfo['severity'] = 'error';

    // Check if it's a Supabase error structure (or similar structure from RPC)
    if (error && typeof error === 'object' && error.errorCode && error.message) {
      switch (error.errorCode) {
        case 'RLS_DENIAL':
        case 'AUTHORIZATION_ERROR':
          message = 'Permission Denied: You do not have access to perform this action or view this resource.';
          severity = 'warning';
          break;
        case 'NOT_FOUND':
          message = 'Resource Not Found: The item you are looking for does not exist or could not be accessed.';
          severity = 'warning';
          break;
        case 'VALIDATION_ERROR':
          message = `Validation Failed: ${error.message}`;
          severity = 'warning';
          break;
        case 'UNIQUE_VIOLATION':
        case 'CONSTRAINT_VIOLATION':
           message = `Data Conflict: ${error.message}`;
           severity = 'warning';
           break;
        case 'AUTHENTICATION_ERROR':
          message = 'Authentication Required: Please log in again.';
          severity = 'error';
          // Optionally redirect to login here
          break;
        default:
          message = `Error: ${error.message}`;
          severity = 'error';
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    setErrorInfo({ message, severity });
  }, []);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <Snackbar
        open={!!errorInfo}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={errorInfo?.severity || 'error'} sx={{ width: '100%' }}>
          {errorInfo?.message}
        </Alert>
      </Snackbar>
    </ErrorContext.Provider>
  );
}

export function useErrorHandler(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
} 