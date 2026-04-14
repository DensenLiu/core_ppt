'use client';

import { Download, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { usePPTStore } from '@/store/pptStore';

interface ResultDisplayProps {
  onDownload: () => void;
  onReset: () => void;
}

export default function ResultDisplay({ onDownload, onReset }: ResultDisplayProps) {
  const { generatedFileName, generatedFileId, reorganizedContent } = usePPTStore();

  if (!generatedFileName) return null;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
        <h3 className="text-lg font-medium text-green-700">PPT生成成功!</h3>
        <p className="text-sm text-gray-600 mt-1">
          已生成 {reorganizedContent?.slides.length || 0} 页精简内容
        </p>
      </div>

      {/* File Info */}
      <div className="p-4 bg-[var(--secondary)] rounded-lg">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-[var(--primary)]" />
          <div className="flex-1">
            <p className="font-medium truncate">{generatedFileName}</p>
            <p className="text-sm text-gray-500">
              {reorganizedContent?.slides.length} 页
            </p>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      {reorganizedContent && (
        <div className="space-y-2">
          <h4 className="font-medium">内容预览</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {reorganizedContent.slides.map((slide, index) => (
              <div
                key={index}
                className="p-3 bg-[var(--secondary)] rounded-lg text-sm"
              >
                <p className="font-medium">{slide.title}</p>
                <p className="text-gray-500 mt-1 line-clamp-2">
                  {slide.content.slice(0, 2).join(' • ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <Download className="w-4 h-4" />
          下载PPT
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重新开始
        </button>
      </div>
    </div>
  );
}
