import { Header } from '@/components/layout/header';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Features } from '@/components/landing/features';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex flex-col pt-16">
        <div className="flex flex-col items-center p-4 pt-12">
          <ChatInterface />
        </div>
        <Features />
      </main>
    </div>
  );
}
