
'use client';

import { ChatInterface } from '@/components/chat/chat-interface';

export default function Home({ onUploadClick }: { onUploadClick?: () => void }) {
  return (
    <div className="flex-1">
      <div className="flex flex-col items-center justify-center h-full p-4 pt-12 md:pt-16">
        <ChatInterface onUploadClick={onUploadClick} />
      </div>
    </div>
  );
}
