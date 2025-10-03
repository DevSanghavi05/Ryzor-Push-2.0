import { ChatInterface } from '@/components/chat/chat-interface';
import { Header } from '@/components/layout/header';

export default function ChatPage({ params }: { params: { fileId: string } }) {
  return (
    <div className="flex flex-col h-dvh bg-background">
      <Header />
      <main className="flex-1 overflow-hidden pt-16">
        <ChatInterface fileId={params.fileId} />
      </main>
    </div>
  );
}
