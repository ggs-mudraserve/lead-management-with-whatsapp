'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchConversations } from '@/lib/supabase/queries/whatsapp';
import ConversationList from './_components/ConversationList';
import ChatWindow from './_components/ChatWindow';
import { subscribeToAllConversations } from '@/lib/supabase/realtime';

export default function WhatsAppPage() {
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Fetch conversations
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['whatsappConversations'],
    queryFn: fetchConversations,
    enabled: !!user, // Only fetch when user is authenticated
    // No refetchInterval needed as we're using realtime subscriptions
  });

  // Set up Supabase realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    console.log('Setting up direct realtime subscription for all conversations');

    // Subscribe to all changes on the n8n_chat table
    const unsubscribe = subscribeToAllConversations(
      // Handle INSERT events
      (payload) => {
        console.log('Handling INSERT event in WhatsAppPage:', payload);
        queryClient.invalidateQueries({ queryKey: ['whatsappConversations'] });
      },
      // Handle UPDATE events
      (payload) => {
        console.log('Handling UPDATE event in WhatsAppPage:', payload);
        queryClient.invalidateQueries({ queryKey: ['whatsappConversations'] });
      },
      // Handle DELETE events
      (payload) => {
        console.log('Handling DELETE event in WhatsAppPage:', payload);
        queryClient.invalidateQueries({ queryKey: ['whatsappConversations'] });
      }
    );

    // Cleanup subscription when component unmounts
    return unsubscribe;
  }, [user, queryClient]);

  // Select the first conversation by default when data loads
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].session_id);
    }
  }, [conversations, selectedConversation]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You must be logged in to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      height: 'calc(100vh - 64px)', // Subtract header height
      bgcolor: '#f0f2f5', // WhatsApp background color
      p: 2
    }}>
      {/* Left sidebar with conversations */}
      <Box sx={{
        width: '30%',
        maxWidth: '420px',
        height: '100%',
        mr: 2,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1
      }}>
        {isLoadingConversations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : conversationsError ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">Error loading conversations</Alert>
          </Box>
        ) : (
          <ConversationList
            conversations={conversations || []}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        )}
      </Box>

      {/* Right side with chat window */}
      <Box sx={{
        flexGrow: 1,
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1,
        bgcolor: 'white'
      }}>
        {selectedConversation ? (
          <ChatWindow
            sessionId={selectedConversation}
            isAdmin={profile?.role === 'admin'}
          />
        ) : (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            bgcolor: '#f0f0f0'
          }}>
            <Typography variant="h6" color="textSecondary">
              Select a conversation to start chatting
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
