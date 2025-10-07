
'use client';

import { ChatInterface } from '@/components/chat/chat-interface';
import { UploadForm } from '@/components/upload/upload-form';
import { useState } from 'react';

export default function Home() {
  const [isUploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 bg-transparent">
      <div className="flex flex-col items-center justify-center h-full p-4 pt-12 md:pt-16">
        <ChatInterface onUploadClick={() => setUploadOpen(true)} />
      </div>
      <UploadForm open={isUploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
