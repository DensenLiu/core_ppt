'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, Download, RefreshCw, X, Bot, User, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: {
    name: string;
    type: 'original' | 'reference';
    path: string;
  }[];
  result?: {
    fileName: string;
    filePath: string;
  };
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-welcome',
      role: 'assistant',
      content: '您好！我是PPT智能助手。请上传您的原始PPT（必填）和参考样式PPT（可选），然后告诉我您想要如何重构内容，比如"按总分总逻辑精简为10页"、"突出重点数据"等。',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<{ original?: File; reference?: File }>({});
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (type: 'original' | 'reference', file: File) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    addMessage({
      role: 'system',
      content: `已上传 ${type === 'original' ? '原始PPT' : '参考样式PPT'}：${file.name}`,
    });
  };

  const removeFile = (type: 'original' | 'reference') => {
    setFiles(prev => ({ ...prev, [type]: undefined }));
  };

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setMessages(prev => [...prev, {
      ...msg,
      id: uniqueId,
      timestamp: new Date(),
    }]);
  };

  const updateLastMessage = (content: string) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const newMessages = prev.map((msg, idx) => {
        if (idx === prev.length - 1 && msg.role === 'assistant') {
          return { ...msg, content };
        }
        return msg;
      });
      return newMessages;
    });
  };

  const updateProcessingSteps = (steps: ProcessingStep[]) => {
    setProcessingSteps(steps);
  };

  const handleSubmit = async () => {
    if (!input.trim() && !files.original) return;
    if (!files.original) {
      addMessage({
        role: 'user',
        content: input || '请帮我生成PPT',
      });
      addMessage({
        role: 'assistant',
        content: '请先上传原始PPT文件',
      });
      return;
    }

    const userMessage = input || '请帮我生成PPT';
    addMessage({
      role: 'user',
      content: userMessage,
      files: [
        ...(files.original ? [{ name: files.original.name, type: 'original' as const, path: '' }] : []),
        ...(files.reference ? [{ name: files.reference.name, type: 'reference' as const, path: '' }] : []),
      ],
    });

    setInput('');
    setIsProcessing(true);

    // Initialize processing steps
    const steps: ProcessingStep[] = [
      { name: '解析PPT内容', status: 'pending' },
      { name: '提取样式', status: 'pending' },
      { name: 'AI重构', status: 'pending' },
      { name: '生成PPT', status: 'pending' },
    ];
    updateProcessingSteps(steps);

    // Add assistant message for streaming
    addMessage({
      role: 'assistant',
      content: '',
    });

    try {
      // Step 1: Upload files
      updateProcessingSteps(steps.map(s => s.name === '解析PPT内容' ? { ...s, status: 'processing' as const } : s));

      const formData = new FormData();
      formData.append('original', files.original);
      if (files.reference) {
        formData.append('reference', files.reference);
      }

      const uploadResponse = await fetch('/api/ppt/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '上传失败');
      }

      const { original: originalFile, reference: referenceFile } = uploadResult.data;

      updateProcessingSteps(steps.map(s =>
        s.name === '解析PPT内容' ? { ...s, status: 'completed' as const, message: '✓' } : s
      ));

      // Step 2: Style extraction (if reference provided)
      if (referenceFile) {
        updateProcessingSteps(steps.map(s =>
          s.name === '提取样式' ? { ...s, status: 'processing' as const } : s
        ));
        // Style is already extracted in upload
        updateProcessingSteps(steps.map(s =>
          s.name === '提取样式' ? { ...s, status: 'completed' as const, message: '✓' } : s
        ));
      }

      // Step 3: AI Reorganization
      updateProcessingSteps(steps.map(s =>
        s.name === 'AI重构' ? { ...s, status: 'processing' as const } : s
      ));

      const reorganizeResponse = await fetch('/api/ppt/reorganize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: originalFile.filePath,
          userLogic: userMessage,
          targetPageCount: 10,
          referenceFilePath: referenceFile?.filePath,
        }),
      });

      const reorganizeResult = await reorganizeResponse.json();

      if (!reorganizeResult.success) {
        throw new Error(reorganizeResult.error || 'AI重构失败');
      }

      updateProcessingSteps(steps.map(s =>
        s.name === 'AI重构' ? { ...s, status: 'completed' as const, message: '✓' } : s
      ));

      // Step 4: Generate PPT
      updateProcessingSteps(steps.map(s =>
        s.name === '生成PPT' ? { ...s, status: 'processing' as const } : s
      ));

      const generateResponse = await fetch('/api/ppt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: reorganizeResult.data,
          styleId: referenceFile ? 'reference-style' : 'business-blue',
          referenceFilePath: referenceFile?.filePath,
          originalFileName: files.original.name,
        }),
      });

      const generateResult = await generateResponse.json();

      if (!generateResult.success) {
        throw new Error(generateResult.error || '生成失败');
      }

      updateProcessingSteps(steps.map(s =>
        s.name === '生成PPT' ? { ...s, status: 'completed' as const, message: '✓' } : s
      ));

      // Success message with style info
      const styleInfo = generateResult.data.styleInfo;
      let styleDesc = '';
      if (styleInfo?.type === 'reference') {
        styleDesc = `\n🎨 应用样式：参考模板\n   - 主色：${styleInfo.themeColor}\n   - 背景：${styleInfo.backgroundColor}\n   - 字体：${styleInfo.fontFamily}\n   - 标题字号：${styleInfo.titleFontSize}pt`;
      } else if (styleInfo?.type === 'builtin') {
        styleDesc = `\n🎨 应用样式：${styleInfo.styleId} (内置)`;
      }

      const successMsg = `生成完成！${styleDesc}\n\n📄 文件：${generateResult.data.fileName}\n📊 页数：${generateResult.data.pageCount}页\n\n您可以下载查看，如果需要修改，请告诉我具体修改意见。`;

      updateLastMessage(successMsg);

      // Update the last message with result
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.result = {
            fileName: generateResult.data.fileName,
            filePath: generateResult.data.filePath,
          };
        }
        return newMessages;
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '处理失败，请重试';
      updateLastMessage(`抱歉，处理过程中出现错误：${errorMsg}`);
      updateProcessingSteps(steps.map(s => ({ ...s, status: 'error' as const })));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (fileName: string, filePath: string) => {
    try {
      const response = await fetch(`/api/ppt/download?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`);

      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* File Upload Area */}
      <div className="flex gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm font-medium">原始PPT <span className="text-red-500">*</span></span>
          </div>
          {files.original ? (
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
              <span className="text-sm truncate flex-1 text-gray-800 font-medium">{files.original.name}</span>
              <button onClick={() => removeFile('original')} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[var(--primary)] hover:bg-blue-50 transition-colors text-center"
            >
              <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
              <span className="text-sm text-gray-500">点击上传原始PPT</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect('original', e.target.files[0])}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">参考样式PPT（可选）</span>
          </div>
          {files.reference ? (
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
              <span className="text-sm truncate flex-1 text-gray-800 font-medium">{files.reference.name}</span>
              <button onClick={() => removeFile('reference')} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => referenceInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[var(--primary)] hover:bg-blue-50 transition-colors text-center"
            >
              <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
              <span className="text-sm text-gray-500">点击上传参考样式</span>
            </button>
          )}
          <input
            ref={referenceInputRef}
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect('reference', e.target.files[0])}
          />
        </div>
      </div>

      {/* Processing Steps */}
      {processingSteps.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {processingSteps.map((step, index) => (
              <div
                key={step.name}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  step.status === 'completed' ? 'bg-green-100 text-green-700' :
                  step.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  step.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}
              >
                {step.status === 'processing' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : step.status === 'completed' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-3 h-3" />
                ) : null}
                <span>{step.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-[var(--primary)]' : msg.role === 'system' ? 'bg-gray-200' : 'bg-blue-100'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : msg.role === 'system' ? (
                <FileText className="w-4 h-4 text-gray-500" />
              ) : (
                <Bot className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-[var(--primary)] text-white' :
                msg.role === 'system' ? 'bg-gray-100 text-gray-600 text-sm' :
                'bg-white border shadow-sm'
              }`}>
                <pre className={`whitespace-pre-wrap font-sans ${msg.role === 'user' ? 'text-white' : ''}`}>
                  {msg.content}
                </pre>
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {msg.files.map((file, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
                {msg.result && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleDownload(msg.result!.fileName, msg.result!.filePath)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-4 h-4" />
                      下载PPT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={files.original ? "描述您的需求，如：按总分总逻辑精简为10页" : "请先上传原始PPT"}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSubmit}
          disabled={isProcessing || (!files.original && !input)}
          className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{isProcessing ? '处理中' : '发送'}</span>
        </button>
      </div>
    </div>
  );
}
