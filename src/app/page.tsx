
'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot, PlusCircle, Brain, MessageSquare, Wand, Upload, FileQuestion, ArrowRight } from 'lucide-react';
import { useUser } from '@/firebase';
import { ask } from '@/app/actions';
import withAuth from '@/firebase/auth/with-auth';
import Link from 'next/link';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

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

      const contextDocuments = documents
        .filter((doc: any) => doc.textContent?.trim()?.length > 0)
        .map((doc: any) => ({ name: doc.name, content: doc.textContent }));

      if (contextDocuments.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Documents Found',
          description: 'Upload or import a document before chatting.',
        });
        setLoading(false);
        router.push('/add');
        return;
      }

      const stream = await ask(currentInput, contextDocuments, messages.slice(-10));

      let fullResponse = '';
      const modelMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[modelMessageIndex] = { role: 'model', content: fullResponse + '▋' };
              return newMsgs;
          });
          await new Promise(resolve => setTimeout(resolve, 20)); // Typewriter delay
      }
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[modelMessageIndex] = { role: 'model', content: fullResponse };
        return newMsgs;
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: 'model', content: 'Something went wrong. Try again.' },
      ]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden pt-16">
      {/* Consistent Background */}
      <div className="bg-aurora"></div>

      {/* Chat Area */}
      <div ref={chatContainerRef} className="flex-1 p-6 pb-40 overflow-y-auto space-y-6">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-24">
            <h1 className="text-3xl font-bold text-foreground/80">Workspace</h1>
            <p className="mt-2 text-muted-foreground">Ask a question to start analyzing your documents.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot size={16} />
              </div>
            )}
            <div className={`p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-primary/20' : 'bg-card'}`}>
              <MarkdownContent content={msg.content} />
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && messages[messages.length-1]?.role === 'user' && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-lg max-w-[85%] bg-card flex items-center">
               <MarkdownContent content={'▋'} />
            </div>
          </div>
        )}
      </div>

      {/* Chat Bar */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl z-50">
        <div className="bg-background/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-full border border-border dark:border-neutral-700 shadow-lg dark:shadow-[0_0_40px_10px_rgba(129,140,248,0.6)]">
          <div className="p-3 flex items-center gap-3">
            <Button
              asChild
              size="icon"
              className="rounded-full bg-primary/20 hover:bg-primary/30 text-primary border-none transition-all duration-200"
            >
              <Link href="/add">
                <PlusCircle />
                <span className="sr-only">Upload</span>
              </Link>
            </Button>

            <Input
              placeholder="Ask anything about your documents..."
              className="border-none focus-visible:ring-0 flex-1 text-base bg-transparent text-foreground placeholder:text-muted-foreground px-4"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
              disabled={loading}
            />

            <Button
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg dark:shadow-[0_0_25px_rgba(129,140,248,1)] hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(129,140,248,1)] transition-all duration-200"
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

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="py-20"
    >
      {children}
    </motion.section>
  );
}

function LandingPage() {
  const { signInWithGoogle } = useUser();
  
  return (
    <div className="relative w-full overflow-x-hidden text-foreground">
      <div className="bg-aurora"></div>

      {/* Hero Section */}
       <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-20 md:py-40">
        <div className="relative z-10 mx-auto max-w-7xl">
            <div className="flex flex-col items-center gap-4 text-center">
                <motion.h1 
                    className="text-5xl md:text-7xl font-bold bg-gradient-to-b from-neutral-800 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    No more folders. Just answers.
                </motion.h1>
                <motion.p 
                    className="max-w-xl text-muted-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Upload your PDFs. Ask anything. Get instant, AI-powered insights from your documents.
                </motion.p>
                 <motion.div
                    className="mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Button 
                        onClick={signInWithGoogle}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg dark:shadow-[0_0_20px_rgba(var(--primary-hsl),0.4)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(var(--primary-hsl),0.6)] transition-all"
                    >
                        Get Started for Free
                    </Button>
                </motion.div>
            </div>
        </div>
      </div>


      {/* How It Works Section */}
      <AnimatedSection>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">Your documents, understood instantly.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card/50 dark:bg-neutral-900/50 p-8 rounded-2xl border border-border dark:border-neutral-800 shadow-sm dark:shadow-[0_0_20px_rgba(129,140,248,0.2)]">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Upload</h3>
              <p className="text-muted-foreground">Drop your PDFs into Ryzor.</p>
            </div>
            <div className="bg-card/50 dark:bg-neutral-900/50 p-8 rounded-2xl border border-border dark:border-neutral-800 shadow-sm dark:shadow-[0_0_20px_rgba(129,140,248,0.2)]">
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Ask</h3>
              <p className="text-muted-foreground">Type natural questions like “Summarize Chapter 3.”</p>
            </div>
            <div className="bg-card/50 dark:bg-neutral-900/50 p-8 rounded-2xl border border-border dark:border-neutral-800 shadow-sm dark:shadow-[0_0_20px_rgba(129,140,248,0.2)]">
              <Wand className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Get Answers</h3>
              <p className="text-muted-foreground">AI finds and explains instantly.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>
      
      {/* Redefining Knowledge Section */}
      <AnimatedSection>
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">We’re redefining how humans use knowledge.</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Ryzor AI turns messy documents into living intelligence. No folders. No chaos. Just clarity — instantly. Read our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link> to learn more.
          </p>
          <Button 
            onClick={signInWithGoogle}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg dark:shadow-[0_0_20px_rgba(var(--primary-hsl),0.4)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(var(--primary-hsl),0.6)] transition-all"
          >
            Try Ryzor AI Now
          </Button>
        </div>
      </AnimatedSection>
    </div>
  );
}


export default function Home() {
  const { user, loading } = useUser();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return user ? <LoggedInView /> : <LandingPage />;
}
