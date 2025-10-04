import { Header } from '@/components/layout/header';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Features } from '@/components/landing/features';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <ChatInterface />
        </div>
        <Features />
      </main>
    </div>
  );
}
