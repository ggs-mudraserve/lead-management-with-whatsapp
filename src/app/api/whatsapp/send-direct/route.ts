import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp/server-api';

/**
 * POST handler for sending a direct WhatsApp message
 * This endpoint bypasses the database and only sends a message via the WhatsApp API
 * It's used for testing the WhatsApp API integration
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { phoneNumber, message } = body;

    // Validate required parameters
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: phoneNumber and message are required' },
        { status: 400 }
      );
    }

    // Format the phone number if needed (ensure it has 91 prefix)
    const formattedPhoneNumber = phoneNumber.startsWith('+')
      ? phoneNumber.substring(1)
      : phoneNumber.startsWith('91')
        ? phoneNumber
        : `91${phoneNumber}`;

    console.log('Sending direct WhatsApp message to:', formattedPhoneNumber);

    // Send the message via WhatsApp API
    const result = await sendWhatsAppTextMessage(formattedPhoneNumber, message);

    // Return the result
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending direct WhatsApp message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
