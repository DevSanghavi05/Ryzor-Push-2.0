'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot, PlusCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { ask } from '@/app/actions';
import { TypingAnimation } from '@/components/chat/typing-animation';
import withAuth from '@/firebase/auth/with-auth';
import Link from 'next/link';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

function LoggedInView() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleInteraction = async () => {
    if (!user || !input.trim()) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput };
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, userMessage]);

    try {
      const storageKey = `documents_${user.uid}`;
      const documentsString = localStorage.getItem(storageKey);
      const documents = documentsString ? JSON.parse(documentsString) : [];

      const context = documents
        .filter((doc: any) => doc.textContent?.trim()?.length > 0)
        .map((doc: any) => `Document: ${doc.name}\n\n${doc.textContent}`)
        .join('\n\n---\n\n');

      if (!context) {
        toast({
          variant: 'destructive',
          title: 'No Documents Found',
          description: 'Upload or import a document before chatting.',
        });
        setLoading(false);
        router.push('/add');
        return;
      }

      const stream = await ask(currentInput, context, messages.slice(-10));

      let fullResponse = '';
      const modelMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      const reader = stream.getReader();
      const readStream = async () => {
        const { done, value } = await reader.read();
        if (done) return setLoading(false);
        fullResponse += value;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[modelMessageIndex] = { role: 'model', content: fullResponse };
          return newMsgs;
        });
        await readStream();
      };
      await readStream();
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: 'model', content: 'Something went wrong. Try again.' },
      ]);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden">
      {/* Gradient Backgrounds */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.3),_transparent_70%)] blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.25),_transparent_70%)] blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.25),_transparent_70%)] blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_rgba(192,132,252,0.2),_transparent_70%)] blur-3xl animate-pulse"></div>
      </div>

      {/* Chat Area */}
      <div ref={chatContainerRef} className="flex-1 p-6 pb-32 overflow-y-auto space-y-6">
        {messages.length === 0 && !loading && (
          <div className="text-center text-muted-foreground mt-24">
            <h1 className="text-3xl font-bold text-white/80">Workspace</h1>
            <p className="mt-2">Ask a question to start analyzing your documents.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot size={16} />
              </div>
            )}
            <div className={`p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-primary/20' : 'bg-neutral-800/50'}`}>
              <MarkdownContent content={msg.content} />
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-lg max-w-[85%] bg-neutral-800/50 flex items-center">
              <TypingAnimation text="..." />
            </div>
          </div>
        )}
      </div>

      {/* Chat Bar — Brighter Glow */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl z-50">
        <div className="bg-neutral-900/80 backdrop-blur-xl rounded-full border border-neutral-700 shadow-[0_0_40px_10px_rgba(129,140,248,0.6)]">
          <div className="p-3 flex items-center gap-3">
            <Button
              asChild
              size="icon"
              className="rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border-none transition-all duration-200"
            >
              <Link href="/add">
                <PlusCircle />
                <span className="sr-only">Upload</span>
              </Link>
            </Button>

            <Input
              placeholder="Ask anything about your documents..."
              className="border-none focus-visible:ring-0 flex-1 text-base bg-transparent text-white placeholder:text-gray-400 px-4"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
              disabled={loading}
            />

            <Button
              size="icon"
              className="rounded-full bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_25px_rgba(129,140,248,1)] hover:shadow-[0_0_40px_rgba(129,140,248,1)] transition-all duration-200"
              onClick={handleInteraction}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Background gradient shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-3xl"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            }}
            transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, repeatType: "reverse" }}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Title Section */}
      <motion.h1
        className="text-6xl md:text-7xl font-bold text-center mb-8 z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        No more folders. Just answers.
      </motion.h1>

      <motion.p
        className="text-xl md:text-2xl text-center text-gray-300 mb-16 max-w-2xl z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        Upload your PDFs. Ask anything. Get instant answers.
      </motion.p>

      {/* Chat Input Box */}
      <motion.div
        className="relative w-full max-w-3xl z-20 mt-[-40px]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="w-full bg-black/70 border border-gray-700 rounded-full px-6 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-purple-500/60 shadow-[0_0_25px_10px_rgba(168,85,247,0.5)]"
        />
      </motion.div>
    </div>
  );
}


export default function Home() {
  const { user, loading } = useUser();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return user ? <LoggedInView /> : <LandingPage />;
}
