import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { extractStyleFromPPTX } from '@/lib/styleExtractor';
import type { UploadedFile, StyleConfig } from '@/types/ppt';

// Configure multer for file upload
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Ensure upload directory exists
    await ensureUploadDir();

    // Parse multipart form data
    const formData = await req.formData();

    const originalFile = formData.get('original') as File | null;
    const referenceFile = formData.get('reference') as File | null;

    if (!originalFile) {
      return NextResponse.json(
        { success: false, error: 'No original file provided' },
        { status: 400 }
      );
    }

    const results: {
      original?: UploadedFile;
      reference?: UploadedFile;
      referenceStyle?: StyleConfig;
    } = {};

    // Process original file
    const originalId = randomUUID();
    const originalExt = path.extname(originalFile.name);
    const originalBuffer = Buffer.from(await originalFile.arrayBuffer());
    const originalPath = path.join(UPLOAD_DIR, `original_${originalId}${originalExt}`);
    await fs.writeFile(originalPath, originalBuffer);

    results.original = {
      id: originalId,
      fileName: `original_${originalId}${originalExt}`,
      originalName: originalFile.name,
      filePath: originalPath,
      uploadedAt: new Date(),
      type: 'original',
    };

    // Process reference file if provided
    if (referenceFile) {
      const referenceId = randomUUID();
      const referenceExt = path.extname(referenceFile.name);
      const referenceBuffer = Buffer.from(await referenceFile.arrayBuffer());
      const referencePath = path.join(
        UPLOAD_DIR,
        `reference_${referenceId}${referenceExt}`
      );
      await fs.writeFile(referencePath, referenceBuffer);

      // Extract style from reference PPT
      let referenceStyle: StyleConfig | undefined;
      try {
        referenceStyle = await extractStyleFromPPTX(referencePath);
        console.log('[Upload] Extracted reference style:', referenceStyle);
      } catch (styleError) {
        console.warn('[Upload] Failed to extract reference style:', styleError);
      }

      results.reference = {
        id: referenceId,
        fileName: `reference_${referenceId}${referenceExt}`,
        originalName: referenceFile.name,
        filePath: referencePath,
        uploadedAt: new Date(),
        type: 'reference',
      };

      results.referenceStyle = referenceStyle;
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
