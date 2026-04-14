'use client';

import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  hasReferenceStyle?: boolean;
}

const steps = [
  { number: 1, label: '上传文件' },
  { number: 2, label: '汇报逻辑' },
  { number: 3, label: '选择样式' },
  { number: 4, label: '生成完成' },
];

export default function StepIndicator({ currentStep, hasReferenceStyle }: StepIndicatorProps) {
  // 如果有参考样式，步骤3显示"生成中"
  const getStepLabel = (step: number) => {
    if (hasReferenceStyle && step === 3) {
      return '生成中';
    }
    return steps[step - 1]?.label || '';
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                currentStep > step.number
                  ? 'bg-green-500 text-white'
                  : currentStep === step.number
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--secondary)] text-gray-400 border border-[var(--border)]'
              }`}
            >
              {currentStep > step.number ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                currentStep >= step.number
                  ? 'text-[var(--foreground)] font-medium'
                  : 'text-gray-400'
              }`}
            >
              {getStepLabel(step.number)}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-0.5 mx-2 ${
                currentStep > step.number
                  ? 'bg-green-500'
                  : 'bg-[var(--border)]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
