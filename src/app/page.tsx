
'use client';

import { ChatInterface } from '@/components/chat/chat-interface';

export default function Home() {
  return (
    <div className="flex-1">
      <div className="flex flex-col items-center justify-center h-full p-4">
        <ChatInterface />
      </div>
    </div>
  );
}
