
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Loader2, 
  User, 
  PlusCircle, 
  Brain, 
  MessageSquare, 
  Wand, 
  Briefcase
} from 'lucide-react';
import { useUser } from '@/firebase';
import { ask } from '@/app/actions';
import withAuth from '@/firebase/auth/with-auth';
import Link from 'next/link';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Logo } from '@/components/layout/logo';


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

  // Load chat from local storage
  useEffect(() => {
    if (user) {
        const storedMessages = localStorage.getItem(`messages_${user.uid}`);
        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        }
    }
  }, [user]);

  // Save chat to local storage whenever messages change
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`messages_${user.uid}`, JSON.stringify(messages));
    }
  }, [messages, user]);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleInteraction = async () => {
    if (!user || !input.trim()) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);

    setInput('');
    setLoading(true);

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
      
      const modelMessage: Message = { role: 'model', content: '' };
       setMessages(prevMessages => [...prevMessages, modelMessage]);


      const reader = stream.getReader();
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = value || '';
        fullResponse += chunk;
        
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'model', content: fullResponse + '▋' };
            return newMessages;
        });
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      setMessages(prev => {
         const newMessages = [...prev];
         newMessages[newMessages.length - 1] = { role: 'model', content: fullResponse };
         return newMessages;
      });

    } catch (error) {
      console.error(error);
       setMessages(prev => {
         const newMessages = [...prev];
         newMessages[newMessages.length - 1] = { role: 'model', content: 'Something went wrong. Try again.' };
         return newMessages;
        });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex w-full h-dvh pt-16 relative overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-transparent relative">
          <header className="p-4 flex items-center gap-2 border-b border-white/10">
              <h1 className="text-xl font-semibold font-headline truncate flex-1">
                  Workspace
              </h1>
          </header>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-6 pb-40 overflow-y-auto space-y-6"
          >
            {messages.length === 0 && !loading && (
              <div className="text-center mt-24">
                <h1 className="text-3xl font-bold font-headline">Ryzor Workspace</h1>
                <p className="mt-2 text-muted-foreground">
                  Ask a question to start analyzing your documents.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center text-primary p-1.5 shrink-0 border border-white/10">
                    <Logo />
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[85%] ${
                    msg.role === 'user' ? 'bg-primary/20' : 'bg-card/80 border border-white/10 shadow-sm'
                  }`}
                >
                  <MarkdownContent content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-white/10">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center text-primary p-1.5 border border-white/10">
                  <Logo />
                </div>
                <div className="p-3 rounded-lg max-w-[85%] bg-card/80 flex items-center shadow-sm border border-white/10">
                  <MarkdownContent content={'▋'} />
                </div>
              </div>
            )}
          </div>

          {/* Chat Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-transparent">
            <div className="mx-auto max-w-3xl">
              <div className="bg-background/80 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                <div className="p-3 flex items-center gap-3">
                  <Button
                    asChild
                    size="icon"
                    className="rounded-full bg-primary/20 hover:bg-primary/30 text-primary border-none transition-all duration-200 shrink-0"
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
                    className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 shrink-0"
                    onClick={handleInteraction}
                    disabled={loading || !input.trim()}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Send />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function AnimatedSection({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15, rootMargin: "0px 0px -100px 0px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function LandingPage() {

  return (
    <div className="w-full overflow-x-hidden">

      <div className="container mx-auto px-6">
        <section className="hero text-center pt-32 pb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-[#a5a3ff] py-1.5 px-4 rounded-full text-sm mb-8">
                    <span>✨</span>
                    <span>Stop searching. Start knowing.</span>
                </div>
            </motion.div>
            
            <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-7 tracking-tighter text-white"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            >
                No More Folders,<br />Just Answers
            </motion.h1>
            
            <motion.p 
                className="max-w-3xl mx-auto text-lg md:text-xl text-[#a0a0ab] mb-12"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            >
                Ryzor AI instantly transforms your scattered digital life into a unified, intelligent brain you can talk to. Seamlessly sync documents from both your work and personal accounts—whether it's PDFs from your desktop or files from your Google Drive—and ask complex questions to get immediate, synthesized answers.
            </motion.p>
            
            <motion.div 
                className="flex gap-4 justify-center"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            >
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8 text-base font-semibold">
                    <Link href="/login">Start Free Trial</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 h-12 px-8 text-base font-semibold">
                    <Link href="#why">See How It Works</Link>
                </Button>
            </motion.div>

            <motion.div 
                className="visual-wrapper mt-20"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
            >
                <div className="browser-frame bg-[#18181f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                    <div className="browser-header bg-[#1e1e26] px-5 py-3.5 flex items-center gap-2 border-b border-white/5">
                        <div className="dot w-3 h-3 rounded-full bg-[#3a3a44]"></div>
                        <div className="dot w-3 h-3 rounded-full bg-[#3a3a44]"></div>
                        <div className="dot w-3 h-3 rounded-full bg-[#3a3a44]"></div>
                    </div>
                    <div className="browser-content p-8 md:p-12">
                        <div className="search-demo bg-white/5 border border-white/10 rounded-xl px-6 py-5 text-lg text-[#6b6b76] mb-8 relative">
                            What did the Q3 report say about revenue growth?<span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse"></span>
                        </div>
                        <div className="feature-pills flex gap-3 flex-wrap">
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-lg text-sm text-[#a0a0ab] flex items-center gap-2">📄 All your documents</div>
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-lg text-sm text-[#a0a0ab] flex items-center gap-2">🔍 Smart search</div>
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-lg text-sm text-[#a0a0ab] flex items-center gap-2">💬 Natural questions</div>
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-lg text-sm text-[#a0a0ab] flex items-center gap-2">🔗 Instant sharing</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>

        <section className="section py-36" id="why">
            <AnimatedSection className="section-header max-w-3xl mx-auto mb-20 text-center">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-5 text-white">Built for how you actually work</h2>
                <p className="subhead text-lg md:text-xl text-[#6b6b76]">We handle the chaos of finding information so you can focus on understanding it.</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-8">
                <AnimatedSection className="card bg-white/5 border border-white/10 p-10 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="card-number text-sm font-semibold text-primary mb-4 tracking-widest">01</div>
                    <h3 className="text-2xl font-semibold mb-3 text-white">Everything in one place</h3>
                    <p className="text-base text-[#8a8a94] leading-relaxed">Connect Google Drive, OneDrive, Dropbox, and local files. No more "where did I save that?" moments. Your documents from work and personal accounts, all searchable in seconds.</p>
                </AnimatedSection>

                <AnimatedSection className="card bg-white/5 border border-white/10 p-10 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="card-number text-sm font-semibold text-primary mb-4 tracking-widest">02</div>
                    <h3 className="text-2xl font-semibold mb-3 text-white">Ask anything, naturally</h3>
                    <p className="text-base text-[#8a8a94] leading-relaxed">Ask questions that span multiple documents and get synthesized answers instantly. Our AI understands context and connects information across your entire knowledge base—no technical queries needed.</p>
                </AnimatedSection>

                <AnimatedSection className="card bg-white/5 border border-white/10 p-10 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="card-number text-sm font-semibold text-primary mb-4 tracking-widest">03</div>
                    <h3 className="text-2xl font-semibold mb-3 text-white">Work & life, together</h3>
                    <p className="text-base text-[#8a8a94] leading-relaxed">Manage both professional and personal documents in one workspace. Keep them separate when you need to, or let AI discover connections you never knew existed between your projects.</p>
                </AnimatedSection>

                <AnimatedSection className="card bg-white/5 border border-white/10 p-10 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="card-number text-sm font-semibold text-primary mb-4 tracking-widest">04</div>
                    <h3 className="text-2xl font-semibold mb-3 text-white">Share in one click</h3>
                    <p className="text-base text-[#8a8a94] leading-relaxed">Found something worth sharing? Make it public instantly. No complicated permission settings, no email attachments. Just share the link and you're done.</p>
                </AnimatedSection>
            </div>

            <AnimatedSection className="future-box bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-14 rounded-2xl text-center mt-20" id="roadmap">
                <div className="future-tag inline-block bg-accent/15 border border-accent/30 py-1.5 px-4 rounded-full text-xs text-[#ff9ed6] mb-6 font-medium tracking-wider">COMING SOON</div>
                <h3 className="text-3xl font-semibold mb-4 text-white">Your complete AI workspace</h3>
                <p className="text-lg text-[#8a8a94] max-w-2xl mx-auto mb-8">Soon you'll be able to ask AI about your calendar, emails, and more. Schedule meetings, find that message from last week, and manage everything through natural conversation. Ryzor will be your unified command center.</p>
                <div className="integration-list flex gap-4 justify-center flex-wrap">
                    <div className="integration bg-white/5 border border-white/10 py-2.5 px-5 rounded-lg text-sm text-[#a0a0ab]">📅 Google Calendar</div>
                    <div className="integration bg-white/5 border border-white/10 py-2.5 px-5 rounded-lg text-sm text-[#a0a0ab]">📅 Microsoft Calendar</div>
                    <div className="integration bg-white/5 border border-white/10 py-2.5 px-5 rounded-lg text-sm text-[#a0a0ab]">✉️ Gmail</div>
                    <div className="integration bg-white/5 border border-white/10 py-2.5 px-5 rounded-lg text-sm text-[#a0a0ab]">✉️ Outlook</div>
                </div>
            </AnimatedSection>
        </section>

        <section className="final-cta text-center py-36">
            <AnimatedSection>
                <h2 className="text-5xl font-bold mb-6 tracking-tighter">Ready to end the search?</h2>
                <p className="text-lg text-[#6b6b76] mb-10">Join teams already using Ryzor to work smarter.</p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8 text-base font-semibold">
                    <Link href="/login">Get Started Free</Link>
                </Button>
            </AnimatedSection>
        </section>
      </div>

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
