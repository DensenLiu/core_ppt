'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { usePPTStore } from '@/store/pptStore';

interface FileUploadProps {
  onUploadSuccess: (
    originalPath: string,
    referencePath?: string,
    originalName?: string,
    extractedStyle?: any
  ) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleOriginalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pptx')) {
        setError('请上传 .pptx 格式的文件');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('文件大小不能超过 50MB');
        return;
      }
      setOriginalFile(file);
      setError(null);
    }
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pptx')) {
        setError('请上传 .pptx 格式的文件');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('文件大小不能超过 50MB');
        return;
      }
      setReferenceFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!originalFile) {
      setError('请选择原始PPT文件');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('original', originalFile);
      if (referenceFile) {
        formData.append('reference', referenceFile);
      }

      const response = await fetch('/api/ppt/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '上传失败');
      }

      // 返回文件路径和提取的样式（如果有）
      onUploadSuccess(
        result.data.original.filePath,
        result.data.reference?.filePath,
        result.data.original.originalName,
        result.data.referenceStyle  // 提取的参考样式
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const removeOriginal = () => {
    setOriginalFile(null);
    if (originalInputRef.current) {
      originalInputRef.current.value = '';
    }
  };

  const removeReference = () => {
    setReferenceFile(null);
    if (referenceInputRef.current) {
      referenceInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Original File Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          原始PPT文件 <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--primary)] transition-colors">
          {originalFile ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-[var(--primary)]" />
              <span className="font-medium">{originalFile.name}</span>
              <button
                onClick={removeOriginal}
                className="p-1 hover:bg-[var(--secondary)] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                ref={originalInputRef}
                type="file"
                accept=".pptx"
                onChange={handleOriginalChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                点击或拖拽上传原始PPT文件
              </p>
              <p className="text-xs text-gray-400 mt-1">支持 .pptx 格式，最大 50MB</p>
            </label>
          )}
        </div>
      </div>

      {/* Reference File Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          参考样式PPT <span className="text-gray-400">(可选)</span>
        </label>
        <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--primary)] transition-colors">
          {referenceFile ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="font-medium">{referenceFile.name}</span>
              <button
                onClick={removeReference}
                className="p-1 hover:bg-[var(--secondary)] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                ref={referenceInputRef}
                type="file"
                accept=".pptx"
                onChange={handleReferenceChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                点击或拖拽上传参考PPT文件
              </p>
              <p className="text-xs text-gray-400 mt-1">将自动提取样式，不再需要选择</p>
            </label>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 提示：上传参考样式PPT后，将自动使用其样式，无需额外选择。
          如果不上传参考样式，可以从8种内置样式中选择。
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!originalFile || isUploading}
        className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? '上传中...' : '上传文件'}
      </button>
    </div>
  );
}
