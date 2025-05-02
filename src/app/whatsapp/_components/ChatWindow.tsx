'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  Chip,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMessages, fetchLeadInfo, LeadInfo } from '@/lib/supabase/queries/whatsapp';
import MessageInput from './MessageInput';
import AssignLeadDialog from './AssignLeadDialog';
import { subscribeToSession } from '@/lib/supabase/realtime';

interface ChatWindowProps {
  sessionId: string;
  isAdmin: boolean;
}

// Helper function to format phone numbers for display
const formatPhoneNumber = (phoneNumber: string): string => {
  // If it starts with 91, remove it to get the 10-digit number
  let formattedNumber = phoneNumber;
  if (formattedNumber.startsWith('91') && formattedNumber.length > 10) {
    formattedNumber = formattedNumber.substring(2);
  }

  // Format as XXX-XXX-XXXX if it's a 10-digit number
  if (formattedNumber.length === 10) {
    return `${formattedNumber.substring(0, 3)}-${formattedNumber.substring(3, 6)}-${formattedNumber.substring(6)}`;
  }

  return phoneNumber; // Return original if not in expected format
};

// Helper function to check if a file is an image based on file type or name
const isImageFile = (fileType?: string, fileName?: string): boolean => {
  if (fileType && fileType.startsWith('image/')) {
    return true;
  }

  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  }

  return false;
};

// Helper function to download a file
const downloadFile = (url?: string, fileName?: string) => {
  if (!url || typeof window === 'undefined') return;

  try {
    // Create a direct download link to our server endpoint
    const downloadUrl = `/api/whatsapp/download-file?url=${encodeURIComponent(url)}&fileName=${encodeURIComponent(fileName || 'download')}`;

    // Create an invisible iframe to trigger the download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);

    // Remove the iframe after a delay
    setTimeout(() => {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 5000);

    console.log('Download initiated for:', fileName);
  } catch (error) {
    console.error('Error initiating download:', error);
    alert('Could not download the file. Please try again or right-click on the attachment and select "Save link as..."');
  }
};

export default function ChatWindow({ sessionId, isAdmin }: ChatWindowProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  // Fetch messages for the selected conversation
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ['whatsappMessages', sessionId],
    queryFn: () => fetchMessages(sessionId),
    enabled: !!sessionId,
  });

  // Fetch lead information for this conversation
  const {
    data: leadInfo,
    isLoading: isLoadingLeadInfo,
  } = useQuery<LeadInfo | null>({
    queryKey: ['whatsappLeadInfo', sessionId],
    queryFn: () => fetchLeadInfo(sessionId),
    enabled: !!sessionId,
  });

  // Set up Supabase realtime subscription for new messages
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up direct realtime subscription for session:', sessionId);

    // Subscribe to changes on the n8n_chat table for this session
    const unsubscribe = subscribeToSession(
      sessionId,
      // Handle INSERT events
      (payload) => {
        console.log('Handling INSERT event in ChatWindow:', payload);

        queryClient.setQueryData(['whatsappMessages', sessionId], (oldData: any) => {
          // If we don't have any data yet, fetch it
          if (!oldData || !Array.isArray(oldData)) {
            queryClient.invalidateQueries({ queryKey: ['whatsappMessages', sessionId] });
            return oldData;
          }

          // Check if the message already exists in the cache
          const messageExists = oldData.some((msg: any) => msg.id === payload.new.id);
          if (messageExists) {
            return oldData;
          }

          // Add the new message to the existing messages
          return [...oldData, payload.new];
        });
      },
      // Handle UPDATE events
      (payload) => {
        console.log('Handling UPDATE event in ChatWindow:', payload);
        queryClient.invalidateQueries({ queryKey: ['whatsappMessages', sessionId] });
      },
      // Handle DELETE events
      (payload) => {
        console.log('Handling DELETE event in ChatWindow:', payload);
        queryClient.invalidateQueries({ queryKey: ['whatsappMessages', sessionId] });
      }
    );

    // Cleanup subscription when component unmounts or sessionId changes
    return unsubscribe;
  }, [sessionId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleAssignClick = () => {
    handleMenuClose();
    setAssignDialogOpen(true);
  };

  const handleAssignDialogClose = () => {
    setAssignDialogOpen(false);
  };

  const handleAssignSuccess = () => {
    // Refetch conversations and lead info to update the assigned status
    queryClient.invalidateQueries({ queryKey: ['whatsappConversations'] });
    queryClient.invalidateQueries({ queryKey: ['whatsappLeadInfo', sessionId] });
    setAssignDialogOpen(false);
  };

  // Combined loading state
  const isLoading = isLoadingMessages || isLoadingLeadInfo;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (messagesError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading messages</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header */}
      <Box sx={{
        p: 2,
        bgcolor: '#f0f0f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top row with phone number and actions */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: leadInfo?.is_assigned ? 1 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {sessionId.startsWith('91')
                ? sessionId.substring(2, 3)
                : sessionId.substring(0, 1)}
            </Avatar>
            <Typography variant="h6">
              {formatPhoneNumber(sessionId)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isAdmin && (
              <>
                <IconButton onClick={handleMenuClick}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={menuAnchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleAssignClick}>
                    <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
                    Assign to User
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Box>

        {/* Lead assignment info row */}
        {leadInfo?.is_assigned && leadInfo.lead_owner_name && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Chip
              icon={<PersonIcon />}
              label={`Lead Assigned to ${leadInfo.lead_owner_name}`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            />
          </Box>
        )}
      </Box>
      <Divider />

      {/* Messages area */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: '#e5ded8'
      }}>
        {!messages || messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">No messages yet</Typography>
          </Box>
        ) : (
          <>
            {messages.map((message: any) => {
              // Check if message has an attachment
              const hasAttachment =
                message.message.attachment_url ||
                message.message.file_name ||
                (message.message.additional_kwargs?.attachment?.url);

              // Get attachment URL from either direct property or nested in additional_kwargs
              let attachmentUrl =
                message.message.attachment_url ||
                message.message.additional_kwargs?.attachment?.url;

              // Make sure attachmentUrl is a string
              if (attachmentUrl && typeof attachmentUrl === 'string') {
                // Ensure URL is properly formatted
                if (!attachmentUrl.startsWith('http')) {
                  // If URL doesn't start with http, assume it's a relative path and prepend the base URL
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  attachmentUrl = `${origin}${attachmentUrl.startsWith('/') ? '' : '/'}${attachmentUrl}`;
                }
              } else {
                // If no valid URL, set to undefined
                attachmentUrl = undefined;
              }

              // Get file name from either direct property or nested in additional_kwargs
              const fileName =
                message.message.file_name ||
                message.message.additional_kwargs?.attachment?.name ||
                'attachment';

              // Get file type from either direct property or nested in additional_kwargs
              const fileType =
                message.message.file_type ||
                message.message.additional_kwargs?.attachment?.type;

              // Check if the file is an image
              const isImage = isImageFile(fileType, fileName);

              return (
                <Box
                  key={message.id}
                  sx={{
                    alignSelf: message.message.type === 'human' ? 'flex-start' : 'flex-end',
                    maxWidth: '70%',
                    bgcolor: message.message.type === 'human' ? 'white' : '#dcf8c6',
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1
                  }}
                >
                  <Typography variant="body1">{message.message.content}</Typography>

                  {/* Render attachment if present */}
                  {hasAttachment && attachmentUrl ? (
                    <>
                      {/* Display image preview if it's an image file */}
                      {isImage ? (
                        <Box sx={{ mt: 1, mb: 1, maxWidth: '100%', borderRadius: 1, overflow: 'hidden' }}>
                          <Box
                            component="img"
                            src={attachmentUrl}
                            alt={fileName}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              display: 'block',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              downloadFile(attachmentUrl, fileName);
                            }}
                          />
                        </Box>
                      ) : null}

                      {/* Always show file info and download button */}
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <AttachFileIcon fontSize="small" />
                        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fileName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon fontSize="small" />}
                            onClick={(e) => {
                              e.preventDefault();
                              downloadFile(attachmentUrl, fileName);
                            }}
                            sx={{ fontSize: '0.75rem', py: 0.5 }}
                          >
                            Download
                          </Button>
                        </Box>
                      </Box>
                    </>
                  ) : null}

                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message input */}
      <MessageInput sessionId={sessionId} />

      {/* Assign Lead Dialog */}
      <AssignLeadDialog
        open={assignDialogOpen}
        onClose={handleAssignDialogClose}
        onSuccess={handleAssignSuccess}
        sessionId={sessionId}
      />
    </Box>
  );
}
