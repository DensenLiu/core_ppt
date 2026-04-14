'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePPTStore } from '@/store/pptStore';
import FileUpload from '@/components/FileUpload';
import LogicInput from '@/components/LogicInput';
import StyleSelector from '@/components/StyleSelector';
import ResultDisplay from '@/components/ResultDisplay';
import StepIndicator from '@/components/StepIndicator';

export default function Home() {
  const {
    currentStep,
    setCurrentStep,
    setOriginalFile,
    setReferenceFile,
    setReferenceStyle,
    setReorganizedContent,
    setIsReorganizing,
    setGeneratedFile,
    setIsGenerating,
    setError,
    originalFile,
    referenceFile,
    referenceStyle,
    userLogic,
    targetPageCount,
    reorganizedContent,
    selectedStyle,
    builtinStyle,
    generatedFileId,
    generatedFileName,
    reset,
    error,
    isReorganizing,
    isGenerating,
  } = usePPTStore();

  // Local state for file paths
  const [originalFilePath, setOriginalFilePath] = useState<string>('');
  const [referenceFilePath, setReferenceFilePath] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('');

  // Handle file upload success
  const handleUploadSuccess = (
    originalPath: string,
    referencePath?: string,
    originalName?: string,
    extractedStyle?: any
  ) => {
    setOriginalFilePath(originalPath);
    setOriginalFileName(originalName || '');

    if (referencePath) {
      setReferenceFilePath(referencePath);
      setReferenceFile({
        id: 'temp',
        fileName: referencePath,
        originalName: 'reference',
        filePath: referencePath,
        uploadedAt: new Date(),
        type: 'reference',
      });

      // 如果有提取的样式，也保存
      if (extractedStyle) {
        setReferenceStyle(extractedStyle);
      }

      // 有参考样式，跳过样式选择，直接进入重组步骤
      setCurrentStep(2);
      return;
    }

    setOriginalFile({
      id: 'temp',
      fileName: originalPath,
      originalName: originalName || 'original',
      filePath: originalPath,
      uploadedAt: new Date(),
      type: 'original',
    });

    // 没有参考样式，进入步骤2（输入汇报逻辑）
    setCurrentStep(2);
  };

  // Handle content reorganization
  const handleReorganize = async (logic: string, pageCount: number) => {
    if (!originalFilePath) return;

    setIsReorganizing(true);
    setError(null);

    try {
      const response = await fetch('/api/ppt/reorganize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: originalFilePath,
          userLogic: logic,
          targetPageCount: pageCount,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '重组失败');
      }

      setReorganizedContent(result.data);

      // 根据是否有参考样式决定下一步
      // 如果有参考样式，直接生成；否则进入样式选择
      if (referenceFile && referenceFilePath) {
        // 有参考样式，直接生成
        await handleGenerateWithReference();
      } else {
        // 没有参考样式，进入步骤3选择样式
        setCurrentStep(3);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '重组失败，请重试');
    } finally {
      setIsReorganizing(false);
    }
  };

  // 直接使用参考样式生成PPT
  const handleGenerateWithReference = async () => {
    if (!reorganizedContent) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 使用参考样式（传入参考文件路径，在服务端提取样式）
      const response = await fetch('/api/ppt/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reorganizedContent,
          styleId: 'reference-style',
          referenceFilePath: referenceFilePath,  // 传递参考文件路径
          originalFileName,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失败');
      }

      setGeneratedFile(result.data.fileId, result.data.fileName);
      setCurrentStep(4);
    } catch (error) {
      setError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle PPT generation (内置样式)
  const handleGenerate = async () => {
    if (!reorganizedContent) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 确定样式ID
      const styleId = builtinStyle || 'business-blue';

      const response = await fetch('/api/ppt/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reorganizedContent,
          styleId,
          originalFileName,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失败');
      }

      setGeneratedFile(result.data.fileId, result.data.fileName);
      setCurrentStep(4);
    } catch (error) {
      setError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!generatedFileName) return;

    try {
      const response = await fetch(`/api/ppt/download?path=${encodeURIComponent(`D:\\code\\ppt\\output\\${generatedFileName}`)}&name=${encodeURIComponent(generatedFileName)}`);

      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(error instanceof Error ? error.message : '下载失败');
    }
  };

  // Handle reset
  const handleReset = () => {
    reset();
    setOriginalFilePath('');
    setReferenceFilePath('');
    setOriginalFileName('');
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="py-6 border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PPT智能生成工具</h1>
                <p className="text-sm text-gray-500">根据您的汇报逻辑，重新生成精简的PPT</p>
              </div>
            </div>
            <Link
              href="/agent"
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">智能助手</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          hasReferenceStyle={!!referenceFile}
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6">
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">上传文件</h2>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">
                {referenceFile ? '设置重组逻辑（将使用参考样式）' : '设置汇报逻辑'}
              </h2>
              <LogicInput
                onSubmit={handleReorganize}
                isAnalyzing={isReorganizing}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">选择样式并生成</h2>
              <StyleSelector
                hasReferenceFile={!!referenceFile}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">生成完成</h2>
              <ResultDisplay
                onDownload={handleDownload}
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[var(--border)] mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Powered by MiniMax AI</p>
        </div>
      </footer>
    </div>
  );
}
