import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp/server-api';

/**
 * POST handler for sending a WhatsApp document message
 * This endpoint sends a document message via the WhatsApp API
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { phoneNumber, documentUrl, caption, filename } = body;
    
    // Validate required parameters
    if (!phoneNumber || !documentUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: phoneNumber and documentUrl are required' },
        { status: 400 }
      );
    }
    
    // Format the phone number if needed (ensure it has 91 prefix)
    const formattedPhoneNumber = phoneNumber.startsWith('+') 
      ? phoneNumber.substring(1) 
      : phoneNumber.startsWith('91') 
        ? phoneNumber 
        : `91${phoneNumber}`;
        
    console.log('Sending WhatsApp document to:', formattedPhoneNumber);
    
    // For now, just send a text message with the document URL
    // In a production environment, you would use the WhatsApp API to send a document
    const message = `Document: ${documentUrl}${caption ? `\n\n${caption}` : ''}`;
    const result = await sendWhatsAppTextMessage(formattedPhoneNumber, message);
    
    // Return the result
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending WhatsApp document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
