import { Header } from '@/components/layout/header';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Features } from '@/components/landing/features';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex flex-col pt-16">
        <div className="flex flex-col items-center p-4 pt-8 md:pt-12">
          <ChatInterface />
        </div>
        <div className="w-full max-w-5xl mx-auto px-4">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <Features />
      </main>
    </div>
  );
}
