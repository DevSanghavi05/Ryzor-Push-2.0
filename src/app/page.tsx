
'use client';

import { ChatInterface } from '@/components/chat/chat-interface';

export default function Home({ onUploadClick }: { onUploadClick?: () => void }) {
  return (
    <div className="flex flex-col flex-1 bg-transparent">
      <div className="flex flex-col items-center justify-center h-full p-4 pt-12 md:pt-16">
        <ChatInterface onUploadClick={onUploadClick} />
      </div>
    </div>
  );
}
