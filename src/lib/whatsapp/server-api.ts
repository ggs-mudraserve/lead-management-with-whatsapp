/**
 * WhatsApp Cloud API utility functions for server-side operations
 *
 * This file contains utility functions for server-side WhatsApp API operations.
 */

// WhatsApp API configuration for server-side
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || process.env.NEXT_PUBLIC_WHATSAPP_API_VERSION || 'v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN;

// Base URL for WhatsApp API requests
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

/**
 * Verifies the webhook request from WhatsApp
 * 
 * @param mode - The hub.mode parameter from the request
 * @param token - The hub.verify_token parameter from the request
 * @param challenge - The hub.challenge parameter from the request
 * @returns The challenge string if verification is successful, null otherwise
 */
export function verifyWebhook(mode: string, token: string, challenge: string): string | null {
  // The verify token should match the one you set in the WhatsApp API dashboard
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return challenge;
  }
  
  return null;
}

/**
 * Processes a webhook event from WhatsApp
 * 
 * @param body - The webhook event body
 */
export async function processWebhookEvent(body: any): Promise<void> {
  // Log the webhook event for debugging
  console.log('Received WhatsApp webhook event:', JSON.stringify(body, null, 2));
  
  // Process the webhook event as needed
  // This is a placeholder for any additional processing you might want to do
}

/**
 * Sends a text message to a WhatsApp user (server-side)
 *
 * @param to - The recipient's phone number in international format (e.g., "911234567890")
 * @param text - The text message to send
 * @returns Promise with the API response
 */
export async function sendWhatsAppTextMessage(to: string, text: string) {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
