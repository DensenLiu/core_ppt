'use client';

import { Sparkles } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="py-6 border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PPT智能助手</h1>
              <p className="text-sm text-gray-500">上传PPT，告诉我您的需求，智能生成</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <ChatInterface />
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[var(--border)] mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Powered by MiniMax AI</p>
        </div>
      </footer>
    </div>
  );
}
