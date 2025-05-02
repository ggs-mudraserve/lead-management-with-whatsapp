/**
 * WhatsApp Cloud API utility functions for sending messages
 *
 * This file contains utility functions for sending messages via the WhatsApp Cloud API.
 */

// WhatsApp API configuration
const WHATSAPP_API_VERSION = process.env.NEXT_PUBLIC_WHATSAPP_API_VERSION || 'v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN;

// Base URL for WhatsApp API requests
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

// Log the WhatsApp configuration for debugging
console.log('WhatsApp API Configuration:', {
  WHATSAPP_API_VERSION,
  WHATSAPP_PHONE_NUMBER_ID: WHATSAPP_PHONE_NUMBER_ID ? 'Set' : 'Not Set',
  WHATSAPP_ACCESS_TOKEN: WHATSAPP_ACCESS_TOKEN ? 'Set (Token Hidden)' : 'Not Set',
  WHATSAPP_API_URL
});

/**
 * Validates that all required environment variables are set
 */
export function validateWhatsAppConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'NEXT_PUBLIC_WHATSAPP_API_VERSION',
    'NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID',
    'NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Sends a text message to a WhatsApp user
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

/**
 * Sends a document/file to a WhatsApp user
 *
 * @param to - The recipient's phone number in international format
 * @param documentUrl - The URL of the document to send
 * @param caption - Optional caption for the document
 * @param filename - Optional filename for the document
 * @returns Promise with the API response
 */
export async function sendWhatsAppDocument(
  to: string,
  documentUrl: string,
  caption?: string,
  filename?: string
) {
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
          type: 'document',
          document: {
            link: documentUrl,
            caption: caption || '',
            filename: filename || 'document'
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp document:', error);
    throw error;
  }
}

/**
 * Sends a message directly via WhatsApp API without any database operations
 * Use this function for testing the WhatsApp API integration
 *
 * @param phoneNumber - The recipient's phone number
 * @param message - The message to send
 * @returns Promise with the API response
 */
export async function sendDirectWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    // Validate WhatsApp configuration
    const { isValid, missingVars } = validateWhatsAppConfig();

    if (!isValid) {
      console.error('WhatsApp API configuration is incomplete. Missing variables:', missingVars);
      throw new Error(`WhatsApp API configuration is incomplete. Missing: ${missingVars.join(', ')}`);
    }

    // Format the phone number if needed (ensure it has proper format)
    const formattedPhoneNumber = phoneNumber.startsWith('+')
      ? phoneNumber.substring(1)
      : phoneNumber.startsWith('91')
        ? phoneNumber
        : `91${phoneNumber}`;

    console.log('Sending direct WhatsApp message to:', formattedPhoneNumber);

    // Send the message via WhatsApp API
    const result = await sendWhatsAppTextMessage(formattedPhoneNumber, message);
    console.log('WhatsApp API response:', result);

    return result;
  } catch (error) {
    console.error('Error sending direct WhatsApp message:', error);
    throw error;
  }
}