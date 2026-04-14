import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    const fileName = searchParams.get('name');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.pptx'
        ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        : 'application/octet-stream';

    // Handle filename - use original name with proper encoding or fallback
    const encodedFileName = fileName
      ? encodeURIComponent(fileName)
      : 'presentation.pptx';
    const fallbackFileName = 'simplified_ppt.pptx';

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}
