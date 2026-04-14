import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

// Ensure directories exist
export function ensureDirectories() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

export function getUploadPath(file: Express.Multer.File, type: 'original' | 'reference'): string {
  ensureDirectories();
  const uniqueId = randomUUID();
  const ext = path.extname(file.originalname);
  const fileName = `${type}_${uniqueId}${ext}`;
  return path.join(UPLOAD_DIR, fileName);
}

export function getOutputPath(fileName: string): string {
  ensureDirectories();
  return path.join(OUTPUT_DIR, fileName);
}

export function saveUploadedFile(file: Express.Multer.File, type: 'original' | 'reference'): string {
  const filePath = getUploadPath(file, type);
  fs.writeFileSync(filePath, file.buffer);
  return filePath;
}

export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export function generateOutputFileName(originalName: string): string {
  const timestamp = Date.now();
  // Use simple English name to avoid encoding issues
  return `simplified_ppt_${timestamp}.pptx`;
}

export function generateFileId(): string {
  return randomUUID();
}

export function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
