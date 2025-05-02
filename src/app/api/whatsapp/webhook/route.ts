import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook, processWebhookEvent } from '@/lib/whatsapp/server-api';
import { supabase } from '@/lib/supabase/client';

/**
 * GET handler for WhatsApp webhook verification
 *
 * This endpoint is used by WhatsApp to verify your webhook.
 * When you set up a webhook in the Meta Developer Portal, WhatsApp will send a GET request
 * to this endpoint with a challenge that you need to echo back.
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request URL
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Validate required parameters
    if (!mode || !token || !challenge) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the webhook
    const verificationResponse = verifyWebhook(mode, token, challenge);

    if (verificationResponse) {
      // If verification is successful, return the challenge
      return new NextResponse(verificationResponse);
    } else {
      // If verification fails, return an error
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error in WhatsApp webhook verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for WhatsApp webhook events
 *
 * This endpoint receives webhook events from WhatsApp when messages are sent to your
 * WhatsApp Business Account. It processes these events and stores them in your database.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Process the webhook event
    await processWebhookEvent(body);

    // Store the incoming message in the database
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          if (!value || !value.messages || !value.messages.length) continue;

          for (const message of value.messages) {
            const from = message.from; // The sender's phone number

            // Process different message types
            if (message.type === 'text' && message.text) {
              const messageContent = message.text.body;

              // Format the phone number if needed (ensure it has 91 prefix)
              const formattedFrom = from.startsWith('+')
                ? from.substring(1)
                : from.startsWith('91')
                  ? from
                  : `91${from}`;

              // Store the message in the database
              const { error } = await supabase
                .from('n8n_chat')
                .insert({
                  session_id: formattedFrom,
                  message: {
                    type: 'human',
                    content: messageContent,
                    tool_calls: [],
                    additional_kwargs: {},
                    response_metadata: {},
                    invalid_tool_calls: []
                  },
                  timestamp: new Date().toISOString()
                });

              if (error) {
                console.error('Error storing message in database:', error);
              }
            } else if (message.type === 'document' && message.document) {
              const documentUrl = message.document.url;
              const caption = message.document.caption || 'Document received';

              // Format the phone number if needed (ensure it has 91 prefix)
              const formattedFrom = from.startsWith('+')
                ? from.substring(1)
                : from.startsWith('91')
                  ? from
                  : `91${from}`;

              // Store the document message in the database
              const { error } = await supabase
                .from('n8n_chat')
                .insert({
                  session_id: formattedFrom,
                  message: {
                    type: 'human',
                    content: caption,
                    tool_calls: [],
                    additional_kwargs: {
                      attachment: {
                        url: documentUrl,
                        type: 'document'
                      }
                    },
                    response_metadata: {},
                    invalid_tool_calls: []
                  },
                  timestamp: new Date().toISOString()
                });

              if (error) {
                console.error('Error storing document message in database:', error);
              }
            }
            // Add handling for other message types as needed
          }
        }
      }
    }

    // Return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in WhatsApp webhook handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
