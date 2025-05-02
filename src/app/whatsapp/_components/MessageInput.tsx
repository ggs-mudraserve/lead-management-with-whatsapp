'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage, uploadAttachment } from '@/lib/supabase/queries/whatsapp';

interface MessageInputProps {
  sessionId: string;
}

export default function MessageInput({ sessionId }: MessageInputProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      // Clear the input field
      setMessage('');

      // No need to manually update the cache or invalidate queries
      // The realtime subscription will handle this automatically
    },
    onError: (error: Error) => {
      setSnackbarMessage(`Failed to send message: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  });

  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: uploadAttachment,
    onSuccess: () => {
      // No need to manually update the cache or invalidate queries
      // The realtime subscription will handle this automatically

      setSnackbarMessage('File uploaded successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    onError: (error: Error) => {
      setSnackbarMessage(`Failed to upload file: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate({ sessionId, content: message });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSnackbarMessage('File size exceeds the limit of 10MB');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      uploadAttachmentMutation.mutate({ sessionId, file });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{
      p: 2,
      bgcolor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      <Tooltip title="Attach file">
        <IconButton
          onClick={handleAttachClick}
          disabled={uploadAttachmentMutation.isPending}
          color="primary"
        >
          {uploadAttachmentMutation.isPending ? (
            <CircularProgress size={24} />
          ) : (
            <AttachFileIcon />
          )}
        </IconButton>
      </Tooltip>
      <TextField
        fullWidth
        placeholder="Type a message"
        variant="outlined"
        size="small"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={sendMessageMutation.isPending}
        multiline
        maxRows={4}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            bgcolor: 'white',
          }
        }}
      />
      <IconButton
        color="primary"
        onClick={handleSendMessage}
        disabled={!message.trim() || sendMessageMutation.isPending}
      >
        {sendMessageMutation.isPending ? (
          <CircularProgress size={24} />
        ) : (
          <SendIcon />
        )}
      </IconButton>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
