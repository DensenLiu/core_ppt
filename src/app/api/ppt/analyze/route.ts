import { NextRequest, NextResponse } from 'next/server';
import { parsePPTX, extractedTextToString, parsedPPTToMarkdown } from '@/lib/pptParser';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath } = body;

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

    // Parse PPT
    const parsedPPT = await parsePPTX(filePath);

    // Extract text content (markdown format for AI)
    const markdownContent = parsedPPTToMarkdown(parsedPPT);
    const textContent = extractedTextToString(parsedPPT);

    return NextResponse.json({
      success: true,
      data: {
        slideCount: parsedPPT.slides.length,
        title: parsedPPT.title,
        textContent,
        markdownContent,
        hasTables: parsedPPT.slides.some(s => s.tables && s.tables.length > 0),
        hasCharts: parsedPPT.slides.some(s => s.charts && s.charts.length > 0),
        hasImages: parsedPPT.slides.some(s => s.images && s.images.length > 0),
        imageCount: parsedPPT.slides.reduce((count, s) => count + (s.images?.length || 0), 0),
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}
