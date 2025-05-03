import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for downloading a file
 * This endpoint proxies file downloads to handle CORS issues and force downloads
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL and filename from query parameters
    const url = request.nextUrl.searchParams.get('url');
    const fileName = request.nextUrl.searchParams.get('fileName') || 'download';

    // Validate required parameters
    if (!url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url is required' },
        { status: 400 }
      );
    }

    // Fetch the file
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer();

    // Create a response with the file content
    const fileResponse = new NextResponse(fileBuffer);

    // Set appropriate headers to force download
    fileResponse.headers.set('Content-Type', 'application/octet-stream');
    fileResponse.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    fileResponse.headers.set('Cache-Control', 'no-cache');

    return fileResponse;
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for downloading a file (alternative method)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { fileUrl, fileName } = body;

    // Validate required parameters
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileUrl is required' },
        { status: 400 }
      );
    }

    // Fetch the file
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer();

    // Create a response with the file content
    const fileResponse = new NextResponse(fileBuffer);

    // Set appropriate headers to force download
    fileResponse.headers.set('Content-Type', 'application/octet-stream');
    fileResponse.headers.set('Content-Disposition', `attachment; filename="${fileName || 'download'}"`);
    fileResponse.headers.set('Cache-Control', 'no-cache');

    return fileResponse;
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
