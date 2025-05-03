import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET handler for testing file access
 * This endpoint checks if a file exists in the temp directory and returns its content
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Missing required parameter: filename' },
        { status: 400 }
      );
    }
    
    const tempDir = join(process.cwd(), 'public', 'temp');
    const filePath = join(tempDir, filename);
    
    console.log('Checking file access for:', filePath);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found', path: filePath },
        { status: 404 }
      );
    }
    
    // Read the file content
    const fileContent = await readFile(filePath);
    const fileSize = fileContent.length;
    
    return NextResponse.json({
      success: true,
      filename,
      path: filePath,
      size: fileSize,
      exists: true,
      publicUrl: `/temp/${filename}`
    });
  } catch (error) {
    console.error('Error testing file access:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
