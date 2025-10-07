
'use client';

import { Header } from '@/components/layout/header';
import { ChatInterface } from '@/components/chat/chat-interface';
import { UploadForm } from '@/components/upload/upload-form';
import { useState } from 'react';

export default function Home() {
  const [isUploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-dvh bg-transparent">
      <Header />
      <main className="flex-1 flex flex-col pt-16">
        <div className="flex flex-col items-center h-full p-4 pt-12 md:pt-16">
          <ChatInterface onUploadClick={() => setUploadOpen(true)} />
        </div>
      </main>
      <UploadForm open={isUploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

    