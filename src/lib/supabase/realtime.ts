import { supabase } from './client';

// Initialize realtime subscriptions for a specific session
export const subscribeToSession = (
  sessionId: string,
  onInsert: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) => {
  // Format the phone number if needed (ensure it has 91 prefix)
  const formattedSessionId = sessionId.startsWith('+')
    ? sessionId.substring(1)
    : sessionId.startsWith('91')
      ? sessionId
      : `91${sessionId}`;

  console.log('Setting up direct realtime subscription for session:', formattedSessionId);

  // Create a unique channel name
  const channelName = `chat-${formattedSessionId}-${Date.now()}`;
  
  // Subscribe to changes on the n8n_chat table for this session
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { self: true }
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'n8n_chat',
        filter: `session_id=eq.${formattedSessionId}`
      },
      (payload) => {
        console.log('Received new INSERT via realtime:', payload);
        onInsert(payload);
      }
    );

  if (onUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'n8n_chat',
        filter: `session_id=eq.${formattedSessionId}`
      },
      (payload) => {
        console.log('Received new UPDATE via realtime:', payload);
        onUpdate(payload);
      }
    );
  }

  if (onDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'n8n_chat',
        filter: `session_id=eq.${formattedSessionId}`
      },
      (payload) => {
        console.log('Received new DELETE via realtime:', payload);
        onDelete(payload);
      }
    );
  }
  
  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log(`Direct realtime subscription status for ${channelName}:`, status);
    
    if (status === 'SUBSCRIBED') {
      console.log(`Successfully subscribed to realtime changes for session ${formattedSessionId}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`Error subscribing to realtime changes for session ${formattedSessionId}`);
    }
  });

  // Return a function to unsubscribe
  return () => {
    console.log(`Cleaning up direct realtime subscription for channel ${channelName}`);
    supabase.removeChannel(channel);
  };
};

// Initialize realtime subscriptions for all conversations
export const subscribeToAllConversations = (
  onInsert: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) => {
  console.log('Setting up direct realtime subscription for all conversations');

  // Create a unique channel name
  const channelName = `all-chats-${Date.now()}`;
  
  // Subscribe to all changes on the n8n_chat table
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { self: true }
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'n8n_chat'
      },
      (payload) => {
        console.log('Received new INSERT via realtime for all conversations:', payload);
        onInsert(payload);
      }
    );

  if (onUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'n8n_chat'
      },
      (payload) => {
        console.log('Received new UPDATE via realtime for all conversations:', payload);
        onUpdate(payload);
      }
    );
  }

  if (onDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'n8n_chat'
      },
      (payload) => {
        console.log('Received new DELETE via realtime for all conversations:', payload);
        onDelete(payload);
      }
    );
  }
  
  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log(`Direct realtime subscription status for all conversations (${channelName}):`, status);
    
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to realtime changes for all conversations');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Error subscribing to realtime changes for all conversations');
    }
  });

  // Return a function to unsubscribe
  return () => {
    console.log(`Cleaning up direct realtime subscription for all conversations (${channelName})`);
    supabase.removeChannel(channel);
  };
};
