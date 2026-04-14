'use client';

import { useState } from 'react';
import { MessageSquare, Settings, Sparkles } from 'lucide-react';
import { usePPTStore } from '@/store/pptStore';

interface LogicInputProps {
  onSubmit: (logic: string, targetPageCount: number) => void;
  isAnalyzing: boolean;
}

export default function LogicInput({ onSubmit, isAnalyzing }: LogicInputProps) {
  const { userLogic, setUserLogic, targetPageCount, setTargetPageCount } = usePPTStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubmit = () => {
    onSubmit(userLogic, targetPageCount);
  };

  const suggestions = [
    '按风险等级从高到低排序',
    '先讲架构概述，再讲评估结果，最后给建议',
    '按评估维度分组，每维度一页',
    '重点突出高风险问题和建议',
    '按问题严重程度排序，先急后缓',
    '总分总结构：概述→详情→总结',
  ];

  return (
    <div className="space-y-6">
      {/* 提示信息 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-blue-700">请输入您的汇报逻辑</span>
        </div>
        <p className="text-sm text-blue-600">
          AI将根据您的逻辑重新组织PPT内容，80%内容来自原文，标题和过渡语将合理推断。
          每页内容将紧凑充实，信息量充足。
        </p>
      </div>

      {/* 用户汇报逻辑输入 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          <MessageSquare className="w-4 h-4 inline-block mr-1" />
          汇报逻辑 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={userLogic}
          onChange={(e) => setUserLogic(e.target.value)}
          placeholder="请输入您的汇报思路，例如：
• 按风险等级从高到低排序
• 先讲架构概述，再讲评估结果，最后给建议
• 按评估维度分组，每维度一页
• 重点突出高风险问题和建议"
          className="w-full h-40 p-3 border border-[var(--border)] rounded-lg resize-none focus:outline-none focus:border-[var(--primary)]"
        />

        {/* 快速建议 */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500">快速建议（点击使用）：</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setUserLogic(suggestion)}
                className="px-3 py-1.5 text-xs bg-[var(--secondary)] hover:bg-[var(--border)] rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 目标页数 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          <Settings className="w-4 h-4 inline-block mr-1" />
          目标页数
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="5"
            max="30"
            value={targetPageCount}
            onChange={(e) => setTargetPageCount(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-center font-medium">{targetPageCount} 页</span>
        </div>
        <p className="text-xs text-gray-400">建议范围: 10-15 页</p>
      </div>

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={isAnalyzing || !userLogic.trim()}
        className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? 'AI正在重新生成PPT内容...' : '根据逻辑重新生成PPT'}
      </button>
    </div>
  );
}
