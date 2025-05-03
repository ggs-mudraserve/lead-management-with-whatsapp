import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppDocument } from '@/lib/whatsapp/server-api';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Directory to store temporary files
const TEMP_DIR = join(process.cwd(), 'public', 'temp');

/**
 * POST handler for sending a WhatsApp document message directly
 * This endpoint accepts a file upload, saves it temporarily, and sends it to WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    console.log('==== DIRECT DOCUMENT SENDING API CALLED ====');

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const phoneNumber = formData.get('phoneNumber') as string;
    const caption = formData.get('caption') as string;
    const filename = formData.get('filename') as string;

    console.log('Received file:', filename);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');
    console.log('Phone number:', phoneNumber);

    // Validate required parameters
    if (!phoneNumber || !file) {
      console.error('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: phoneNumber and file are required' },
        { status: 400 }
      );
    }

    // Format the phone number if needed (ensure it has 91 prefix)
    const formattedPhoneNumber = phoneNumber.startsWith('+')
      ? phoneNumber.substring(1)
      : phoneNumber.startsWith('91')
        ? phoneNumber
        : `91${phoneNumber}`;

    console.log('Formatted phone number:', formattedPhoneNumber);

    // Create temp directory if it doesn't exist
    if (!existsSync(TEMP_DIR)) {
      console.log('Creating temp directory:', TEMP_DIR);
      await mkdir(TEMP_DIR, { recursive: true });
    } else {
      console.log('Temp directory already exists:', TEMP_DIR);
    }

    // Generate a unique filename
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2)}_${filename}`;
    const filePath = join(TEMP_DIR, uniqueFilename);

    console.log('Generated unique filename:', uniqueFilename);
    console.log('Full file path:', filePath);

    // Convert the file to an array buffer and save it
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    console.log('File saved successfully');

    // Create a public URL for the file
    // Make sure we have a proper URL with protocol
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log('NEXT_PUBLIC_APP_URL from env:', baseUrl);

    if (!baseUrl) {
      // If no environment variable is set, construct from request
      const protocol = request.nextUrl.protocol || 'http:';
      const host = request.nextUrl.host || 'localhost:3000';
      baseUrl = `${protocol}//${host}`;
      console.log('Constructed baseUrl from request:', baseUrl);
    }

    // Ensure baseUrl doesn't have a trailing slash
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // Force to use localhost:3000 for testing
    baseUrl = 'http://localhost:3000';

    const publicUrl = `${baseUrl}/temp/${uniqueFilename}`;

    console.log('Final public URL:', publicUrl);

    // Test if the file is accessible
    try {
      const testUrl = new URL(publicUrl);
      console.log('URL is valid:', testUrl.toString());
    } catch (error) {
      console.error('Invalid URL format:', error);
    }

    // Send the document via WhatsApp API
    console.log('Calling sendWhatsAppDocument function...');
    const result = await sendWhatsAppDocument(
      formattedPhoneNumber,
      publicUrl,
      caption,
      filename
    );

    // Return the result
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending WhatsApp document directly:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
