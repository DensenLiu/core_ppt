'use client';

import { Palette, CheckCircle, Sparkles } from 'lucide-react';
import { usePPTStore } from '@/store/pptStore';

// 预定义的样式选项
const STYLE_OPTIONS = [
  {
    id: 'business-blue',
    name: '商务蓝',
    description: '专业稳重的深蓝色商务风格',
    category: 'business',
    color: '#1F4E78',
  },
  {
    id: 'business-gold',
    name: '尊享金',
    description: '高端大气的金色商务风格',
    category: 'business',
    color: '#B8860B',
  },
  {
    id: 'tech-green',
    name: '科技绿',
    description: '现代科技的绿色极简风格',
    category: 'tech',
    color: '#00A86B',
  },
  {
    id: 'tech-dark',
    name: '暗夜科技',
    description: '深色背景的科技感风格',
    category: 'tech',
    color: '#00BCD4',
  },
  {
    id: 'personal-warm',
    name: '温暖个人',
    description: '温馨友好的个人汇报风格',
    category: 'personal',
    color: '#FF7043',
  },
  {
    id: 'personal-minimal',
    name: '简约个人',
    description: '干净简洁的个人风格',
    category: 'personal',
    color: '#5C6BC0',
  },
  {
    id: 'creative-purple',
    name: '梦幻紫',
    description: '富有创意的紫色渐变风格',
    category: 'creative',
    color: '#7C4DFF',
  },
  {
    id: 'creative-orange',
    name: '活力橙',
    description: '充满活力的橙色创意风格',
    category: 'creative',
    color: '#FF5722',
  },
];

interface StyleSelectorProps {
  hasReferenceFile: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function StyleSelector({
  hasReferenceFile,
  onGenerate,
  isGenerating,
}: StyleSelectorProps) {
  const { selectedStyle, setSelectedStyle, reorganizedContent, builtinStyle, setBuiltinStyle } = usePPTStore();

  // 更新样式选择逻辑
  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle('builtin');
    setBuiltinStyle(styleId);
  };

  return (
    <div className="space-y-6">
      {/* Content Preview */}
      {reorganizedContent && (
        <div className="p-4 bg-[var(--secondary)] rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            预览内容
          </h3>
          <p className="text-sm text-gray-600">
            共 {reorganizedContent.slides.length} 页
          </p>
          <ul className="mt-2 space-y-1">
            {reorganizedContent.slides.slice(0, 5).map((slide, index) => (
              <li key={index} className="text-sm text-gray-500 truncate">
                {index + 1}. {slide.title}
              </li>
            ))}
            {reorganizedContent.slides.length > 5 && (
              <li className="text-sm text-gray-400">
                ... 等共 {reorganizedContent.slides.length} 页
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Style Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          <Palette className="w-4 h-4 inline-block mr-1" />
          选择样式模板
        </label>

        {/* 样式网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              className={`p-3 border rounded-lg text-left transition-all hover:shadow-md ${
                builtinStyle === style.id
                  ? 'border-[var(--primary)] bg-blue-50 shadow-md'
                  : 'border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              {/* 颜色预览 */}
              <div
                className="w-full h-8 rounded mb-2 flex items-center justify-center"
                style={{
                  backgroundColor: style.color,
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
                }}
              >
                {builtinStyle === style.id && (
                  <CheckCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <p className="font-medium text-sm">{style.name}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{style.description}</p>
            </button>
          ))}
        </div>

        {/* 参考PPT样式选项 */}
        {hasReferenceFile && (
          <label
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedStyle === 'reference'
                ? 'border-[var(--primary)] bg-blue-50'
                : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
          >
            <input
              type="radio"
              name="style"
              value="reference"
              checked={selectedStyle === 'reference'}
              onChange={() => setSelectedStyle('reference')}
              className="sr-only"
            />
            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
              {selectedStyle === 'reference' && (
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
              )}
            </div>
            <div>
              <p className="font-medium">使用参考PPT的样式</p>
              <p className="text-sm text-gray-500">提取上传参考PPT的配色和布局</p>
            </div>
          </label>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !reorganizedContent}
        className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? '生成中...' : '生成PPT'}
      </button>
    </div>
  );
}
