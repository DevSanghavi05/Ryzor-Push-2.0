import { Header } from '@/components/layout/header';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Features } from '@/components/landing/features';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex flex-col p-4 pt-16 md:p-6 md:pt-20 gap-12">
        <ChatInterface />
        <Features />
      </main>
    </div>
  );
}
