import { supabase } from '@/lib/supabase/client';
import { Conversation } from '@/app/whatsapp/_components/ConversationList';
import {
  sendWhatsAppTextMessage,
  sendWhatsAppDocument,
  validateWhatsAppConfig
} from '@/lib/whatsapp/api';

// Interface for lead information
export interface LeadInfo {
  id: string;
  mobile_number: string;
  lead_owner: string | null;
  lead_owner_name?: string;
  is_assigned: boolean;
}

// Fetch all conversations (grouped by session_id)
export async function fetchConversations(): Promise<Conversation[]> {
  try {
    console.log('Fetching all conversations');

    // First, get all unique session_ids with their latest message
    const { data: sessionData, error: sessionError } = await supabase
      .from('n8n_chat')
      .select('session_id, message, timestamp')
      .order('timestamp', { ascending: false });

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
      throw new Error('Failed to fetch conversations');
    }

    if (!sessionData || sessionData.length === 0) {
      console.log('No conversations found');
      return [];
    }

    console.log(`Found ${sessionData.length} messages across all conversations`);

    // Group by session_id and get the latest message for each
    const sessionMap = new Map<string, any>();
    sessionData.forEach(item => {
      if (!sessionMap.has(item.session_id)) {
        sessionMap.set(item.session_id, {
          session_id: item.session_id,
          last_message: item.message.content,
          last_message_time: item.timestamp,
          is_assigned: false, // Will be updated below
        });
      }
    });

    console.log(`Grouped into ${sessionMap.size} unique conversations`);

    // Check which sessions are assigned to leads
    const sessionIds = Array.from(sessionMap.keys());
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select(`
        mobile_number,
        lead_owner,
        profile:lead_owner (
          first_name,
          last_name
        )
      `)
      .in('mobile_number', sessionIds);

    if (leadError) {
      console.error('Error checking lead assignments:', leadError);
      // Continue without lead data
    } else if (leadData) {
      // Mark sessions that are assigned to leads
      leadData.forEach(lead => {
        const session = sessionMap.get(lead.mobile_number);
        if (session) {
          session.is_assigned = true;
          session.lead_owner = lead.lead_owner;

          // Add lead owner name if available
          if (lead.profile) {
            const ownerName = `${lead.profile.first_name || ''} ${lead.profile.last_name || ''}`.trim();
            session.lead_owner_name = ownerName || 'Unnamed User';
          }
        }
      });
    }

    // Convert map to array and sort by last_message_time (newest first)
    const conversations = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

    console.log(`Returning ${conversations.length} conversations`);
    return conversations;
  } catch (error) {
    console.error('Exception during conversation fetch:', error);
    throw new Error(`Failed to fetch conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fetch lead information for a specific WhatsApp session ID
export async function fetchLeadInfo(sessionId: string): Promise<LeadInfo | null> {
  try {
    // Format the phone number for lead lookup (10 digits only)
    let leadPhoneNumber = sessionId;

    // If it starts with 91, remove it to get the 10-digit number
    if (leadPhoneNumber.startsWith('91') && leadPhoneNumber.length > 10) {
      leadPhoneNumber = leadPhoneNumber.substring(2);
    }

    console.log('Looking up lead for phone number:', leadPhoneNumber);

    // Query the leads table for this phone number
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        mobile_number,
        lead_owner,
        profile:lead_owner (
          first_name,
          last_name
        )
      `)
      .eq('mobile_number', leadPhoneNumber)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lead info:', error);
      throw new Error('Failed to fetch lead information');
    }

    if (!data) {
      console.log('No lead found for this phone number');
      return null;
    }

    // Format the lead information
    const leadInfo: LeadInfo = {
      id: data.id,
      mobile_number: data.mobile_number,
      lead_owner: data.lead_owner,
      is_assigned: !!data.lead_owner,
    };

    // Add lead owner name if available
    if (data.profile) {
      const ownerName = `${data.profile.first_name || ''} ${data.profile.last_name || ''}`.trim();
      leadInfo.lead_owner_name = ownerName || 'Unnamed User';
    }

    return leadInfo;
  } catch (error) {
    console.error('Exception during lead info fetch:', error);
    throw new Error(`Failed to fetch lead info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fetch messages for a specific conversation
export async function fetchMessages(sessionId: string) {
  try {
    // Format the phone number if needed (ensure it has 91 prefix)
    const formattedSessionId = sessionId.startsWith('+')
      ? sessionId.substring(1)
      : sessionId.startsWith('91')
        ? sessionId
        : `91${sessionId}`;

    console.log('Fetching messages for session ID:', formattedSessionId);

    const { data, error } = await supabase
      .from('n8n_chat')
      .select('*')
      .eq('session_id', formattedSessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }

    console.log(`Found ${data?.length || 0} messages for session ID:`, formattedSessionId);
    return data || [];
  } catch (error) {
    console.error('Exception during message fetch:', error);
    throw new Error(`Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Send a new message
export async function sendMessage({ sessionId, content }: { sessionId: string; content: string }) {
  try {
    console.log('Sending WhatsApp message via API endpoint');

    // Format the phone number if needed (ensure it has 91 prefix)
    const formattedSessionId = sessionId.startsWith('+')
      ? sessionId.substring(1)
      : sessionId.startsWith('91')
        ? sessionId
        : `91${sessionId}`;

    // Create the message object
    const message = {
      type: 'ai',
      content: content,
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    };

    // 1. Save the message to Supabase
    try {
      // Check if the user is authenticated
      const { data: { session: authSession } } = await supabase.auth.getSession();
      console.log('Auth session:', authSession ? 'Authenticated' : 'Not authenticated');

      // Log the message object for debugging
      console.log('Message object to save:', JSON.stringify(message, null, 2));

      console.log('Saving message to Supabase:', {
        session_id: formattedSessionId,
        message_type: message.type,
        content: message.content,
        timestamp: new Date().toISOString()
      });

      // Direct insert to Supabase
      const timestamp = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('n8n_chat')
        .insert({
          session_id: formattedSessionId,
          message: message,
          timestamp: timestamp
        });

      if (insertError) {
        console.error('Error saving message to Supabase:', insertError);

        // Try a simplified insert as a fallback
        try {
          console.log('Attempting simplified insert as fallback');
          const simplifiedMessage = {
            type: 'ai',
            content: content
          };

          const { error: fallbackError } = await supabase
            .from('n8n_chat')
            .insert({
              session_id: formattedSessionId,
              message: simplifiedMessage,
              timestamp: timestamp
            });

          if (fallbackError) {
            console.error('Fallback insert also failed:', fallbackError);
          } else {
            console.log('Fallback insert successful');
          }
        } catch (fallbackError) {
          console.error('Exception during fallback insert:', fallbackError);
        }
      } else {
        console.log('Message successfully saved to Supabase');
      }
    } catch (dbError) {
      console.error('Exception during Supabase insert:', dbError);
      // Continue with sending the message even if saving to Supabase fails
    }

    // 2. Send the message via the WhatsApp API endpoint
    const response = await fetch('/api/whatsapp/send-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: formattedSessionId,
        message: content
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const result = await response.json();
    console.log('WhatsApp API response:', result);

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Upload and attach a document
export async function uploadAttachment({ sessionId, file }: { sessionId: string; file: File }) {
  try {
    // 1. Upload the file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `whatsapp/${sessionId}/${fileName}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('lead-documents') // Updated bucket name
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file');
    }

    // 2. Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from('lead-documents') // Updated bucket name
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Format the phone number if needed (ensure it has 91 prefix)
    const formattedSessionId = sessionId.startsWith('+')
      ? sessionId.substring(1)
      : sessionId.startsWith('91')
        ? sessionId
        : `91${sessionId}`;

    // Create the message object
    const message = {
      type: 'ai',
      content: `File attached: ${file.name}`,
      attachment_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      tool_calls: [],
      additional_kwargs: {
        attachment: {
          url: fileUrl,
          name: file.name,
          type: file.type
        }
      },
      response_metadata: {},
      invalid_tool_calls: []
    };

    // 1. Save the message to Supabase
    try {
      console.log('Saving document message to Supabase:', {
        session_id: formattedSessionId,
        message_type: message.type,
        content: message.content
      });

      // Direct insert to Supabase
      const timestamp = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('n8n_chat')
        .insert({
          session_id: formattedSessionId,
          message: message,
          timestamp: timestamp
        });

      if (insertError) {
        console.error('Error saving document message to Supabase:', insertError);

        // Try a simplified insert as a fallback
        try {
          console.log('Attempting simplified document insert as fallback');
          const simplifiedMessage = {
            type: 'ai',
            content: `File attached: ${file.name}`
          };

          const { error: fallbackError } = await supabase
            .from('n8n_chat')
            .insert({
              session_id: formattedSessionId,
              message: simplifiedMessage,
              timestamp: timestamp
            });

          if (fallbackError) {
            console.error('Fallback document insert also failed:', fallbackError);
          } else {
            console.log('Fallback document insert successful');
          }
        } catch (fallbackError) {
          console.error('Exception during fallback document insert:', fallbackError);
        }
      } else {
        console.log('Document message successfully saved to Supabase');
      }
    } catch (dbError) {
      console.error('Exception during Supabase insert:', dbError);
      // Continue with sending the document even if saving to Supabase fails
    }

    // 2. Send the document via the WhatsApp API endpoint
    console.log('Sending WhatsApp document via API endpoint');

    const response = await fetch('/api/whatsapp/send-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: formattedSessionId,
        documentUrl: fileUrl,
        caption: `File: ${file.name}`,
        filename: file.name
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send document');
    }

    const result = await response.json();
    console.log('WhatsApp API document response:', result);

    return true;
  } catch (error) {
    console.error('Error uploading and sending document:', error);
    throw new Error(`Failed to send document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Assign a conversation to a user (create lead)
export async function assignConversationToUser({
  sessionId,
  userId
}: {
  sessionId: string;
  userId: string
}) {
  try {
    // Format the phone number for WhatsApp (with 91 prefix)
    const formattedSessionId = sessionId.startsWith('+')
      ? sessionId.substring(1)
      : sessionId.startsWith('91')
        ? sessionId
        : `91${sessionId}`;

    // Format the phone number for lead creation/update (10 digits only)
    let leadPhoneNumber = formattedSessionId;

    // If it starts with 91, remove it to get the 10-digit number
    if (leadPhoneNumber.startsWith('91') && leadPhoneNumber.length > 10) {
      leadPhoneNumber = leadPhoneNumber.substring(2);
    }

    console.log('WhatsApp number:', formattedSessionId);
    console.log('Lead phone number:', leadPhoneNumber);

    // 1. Check if a lead already exists for this phone number (using 10-digit format)
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('mobile_number', leadPhoneNumber)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing lead:', checkError);
      throw new Error('Failed to check if lead exists');
    }

    if (existingLead) {
      // Update the existing lead's owner
      const { error: updateError } = await supabase
        .from('leads')
        .update({ lead_owner: userId })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating lead owner:', updateError);
        throw new Error('Failed to update lead owner');
      }
    } else {
      // Create a new lead with this phone number (using 10-digit format)
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          mobile_number: leadPhoneNumber,
          lead_owner: userId,
          first_name: '.', // Use '.' as placeholder as required
          last_name: '.'   // Use '.' as placeholder as required
        });

      if (insertError) {
        console.error('Error creating lead:', insertError);
        throw new Error('Failed to create lead');
      }
    }

    // Get user data for the system message
    const { data: userData, error: userError } = await supabase
      .from('profile')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      // Continue without user data
    }

    // Create and save the system message to Supabase
    const userName = userData
      ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'a user'
      : 'a user';

    console.log(`Conversation ${formattedSessionId} assigned to ${userName}`);

    // Create the system message
    const message = {
      type: 'ai',
      content: `This conversation has been assigned to ${userName}`,
      tool_calls: [],
      additional_kwargs: {
        system_message: true
      },
      response_metadata: {},
      invalid_tool_calls: []
    };

    // Save the system message to Supabase
    try {
      console.log('Saving system message to Supabase:', {
        session_id: formattedSessionId,
        message_type: message.type,
        content: message.content
      });

      // Direct insert to Supabase
      const timestamp = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('n8n_chat')
        .insert({
          session_id: formattedSessionId,
          message: message,
          timestamp: timestamp
        });

      if (insertError) {
        console.error('Error saving system message to Supabase:', insertError);

        // Try a simplified insert as a fallback
        try {
          console.log('Attempting simplified system message insert as fallback');
          const simplifiedMessage = {
            type: 'ai',
            content: `This conversation has been assigned to ${userName}`
          };

          const { error: fallbackError } = await supabase
            .from('n8n_chat')
            .insert({
              session_id: formattedSessionId,
              message: simplifiedMessage,
              timestamp: timestamp
            });

          if (fallbackError) {
            console.error('Fallback system message insert also failed:', fallbackError);
          } else {
            console.log('Fallback system message insert successful');
          }
        } catch (fallbackError) {
          console.error('Exception during fallback system message insert:', fallbackError);
        }
      } else {
        console.log('System message successfully saved to Supabase');
      }
    } catch (messageError) {
      console.error('Exception saving system message to Supabase:', messageError);
      // Continue even if saving the system message fails
    }

    return true;
  } catch (error) {
    console.error('Error assigning conversation:', error);
    throw new Error(`Failed to assign conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
