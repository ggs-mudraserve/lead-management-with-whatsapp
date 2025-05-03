'use client';

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { formatDistanceToNow } from 'date-fns';

// Define the conversation type based on our query
export interface Conversation {
  session_id: string;
  last_message: string;
  last_message_time: string;
  is_assigned: boolean;
  lead_owner?: string;
  lead_owner_name?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (sessionId: string) => void;
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

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter conversations based on search query (only by phone number)
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.session_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search header */}
      <Box sx={{ p: 2, bgcolor: '#f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Search by phone number"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: 'white',
              }
            }}
          />
        </Box>
      </Box>

      {/* Conversations list */}
      <List sx={{
        flexGrow: 1,
        overflow: 'auto',
        p: 0,
        '& .MuiListItemButton-root:hover': {
          bgcolor: '#f5f5f5'
        }
      }}>
        {filteredConversations.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography color="textSecondary">No conversations found</Typography>
          </Box>
        ) : (
          filteredConversations.map((conversation) => (
            <React.Fragment key={conversation.session_id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedConversation === conversation.session_id}
                  onClick={() => onSelectConversation(conversation.session_id)}
                  sx={{
                    py: 1.5,
                    bgcolor: selectedConversation === conversation.session_id ? '#ebebeb' : 'transparent'
                  }}
                >
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {/* Show first digit of phone number without country code */}
                    {conversation.session_id.startsWith('91')
                      ? conversation.session_id.substring(2, 3)
                      : conversation.session_id.substring(0, 1)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          component="span"
                          variant="body1"
                          fontWeight={500}
                          sx={{
                            display: 'inline-block',
                            maxWidth: '70%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {/* Format phone number for display */}
                          {formatPhoneNumber(conversation.session_id)}
                          {conversation.is_assigned && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                ml: 1,
                                color: 'primary.main',
                                bgcolor: 'primary.light',
                                px: 0.5,
                                py: 0.2,
                                borderRadius: 1,
                                opacity: 0.8
                              }}
                            >
                              Assigned
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );
}
