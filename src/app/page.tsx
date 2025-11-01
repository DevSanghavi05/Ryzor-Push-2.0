
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
  Briefcase,
  Sparkles,
  FileText,
  Zap,
  Rocket,
  Globe,
  Lock
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
import Image from 'next/image';


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

  const suggestedQuestions = [
    { icon: FileText, text: "Summarize my recent documents", gradient: "from-blue-500 to-cyan-500" },
    { icon: Zap, text: "Find information about revenue", gradient: "from-violet-500 to-purple-500" },
    { icon: Brain, text: "Compare Q2 and Q3 reports", gradient: "from-pink-500 to-rose-500" },
  ];

  return (
      <div className="flex w-full h-dvh pt-16 relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        {/* Dynamic background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '4s' }} />
        </div>
        
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-transparent relative z-10">
          <header className="p-5 flex items-center gap-4 border-b border-white/10 backdrop-blur-xl bg-black/20">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 flex items-center justify-center p-2 shadow-lg shadow-violet-500/50">
                <Logo />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                    Workspace
                </h1>
                <p className="text-xs text-muted-foreground">AI-powered document intelligence</p>
              </div>
          </header>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-6 pb-40 overflow-y-auto"
          >
            {messages.length === 0 && !loading && (
              <div className="text-center mt-32 max-w-3xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded-3xl blur-2xl opacity-60 animate-pulse" />
                    <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500">
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h1 className="text-5xl font-bold mb-4 mt-6 tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">Welcome back</h1>
                  <p className="text-muted-foreground text-lg mb-10">
                    Ask anything about your documents. I'll search across everything to find what you need.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {suggestedQuestions.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * i }}
                        onClick={() => setInput(q.text)}
                        className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group relative overflow-hidden"
                      >
                        <div className={`absolute -inset-px bg-gradient-to-r ${q.gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md`} />
                        <div className="relative flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r ${q.gradient} text-white shadow-lg`}>
                            <q.icon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium">{q.text}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`flex gap-4 items-start ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'model' && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 flex items-center justify-center text-white p-2 shrink-0 shadow-lg shadow-violet-500/30">
                      <Logo />
                    </div>
                  )}
                  <div
                    className={`px-5 py-3.5 rounded-2xl max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-white/10 border border-white/10 backdrop-blur-sm'
                    }`}
                  >
                    <MarkdownContent content={msg.content} />
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-muted-foreground shrink-0 border border-white/10">
                      <User size={18} />
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start items-start"
                >
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 flex items-center justify-center text-white p-2 shrink-0 shadow-lg shadow-violet-500/30">
                    <Logo />
                  </div>
                  <div className="px-5 py-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                    <MarkdownContent content={'▋'} />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Chat Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none">
            <div className="mx-auto max-w-4xl pointer-events-auto">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded-2xl blur-lg opacity-40" />
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                  <div className="p-3 flex items-center gap-3">
                    <Button
                      asChild
                      size="icon"
                      className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-none transition-all duration-200 shrink-0 h-12 w-12"
                    >
                      <Link href="/add">
                        <PlusCircle className="w-6 h-6" />
                        <span className="sr-only">Upload</span>
                      </Link>
                    </Button>

                    <Input
                      placeholder="Ask anything..."
                      className="border-none focus-visible:ring-0 flex-1 text-base bg-transparent text-white placeholder:text-muted-foreground/60 px-4 h-12"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleInteraction()}
                      disabled={loading}
                    />

                    <Button
                      size="icon"
                      className="rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white shadow-lg shadow-blue-500/40 transition-all duration-200 shrink-0 h-12 w-12"
                      onClick={handleInteraction}
                      disabled={loading || !input.trim()}
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground/60 mt-3">
                Ryzor searches across all your documents to provide accurate answers
              </p>
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
    <>
      <div className="w-full overflow-x-hidden relative bg-slate-950 text-white">
        {/* Dynamic background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '8s' }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '10s', animationDelay: '2s' }}
          />
        </div>

        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_40%)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          {/* Hero Section */}
          <section className="hero text-center py-32 md:py-48">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-300 py-2 px-4 rounded-full text-sm mb-8 backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">
                  Introducing Ryzor – Your Unified Digital Brain
                </span>
              </Link>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-7 tracking-tighter bg-gradient-to-br from-white via-gray-300 to-gray-500 bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Unify Your Digital Life.
            </motion.h1>

            <motion.p
              className="max-w-3xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed mb-12 font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Ryzor instantly transforms your scattered digital world into an
              intelligent, conversational workspace. Sync documents from your
              work and personal accounts, and get immediate, synthesized
              answers to complex questions.
            </motion.p>

            <motion.div
              className="flex gap-4 justify-center flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 h-12 px-8 text-base font-semibold shadow-lg shadow-blue-500/40 border-0 rounded-full"
              >
                <Link href="/login">Get Started for Free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 h-12 px-8 text-base font-semibold backdrop-blur-md rounded-full text-white"
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </motion.div>
          </section>

          {/* Features Section */}
          <AnimatedSection className="visual-wrapper -mt-20 mb-32" id="features">
            <div className="relative bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl p-2">
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format"
                alt="Feature visual"
                width={2070}
                height={1380}
                data-ai-hint="document analytics"
                className="rounded-2xl"
              />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
          </AnimatedSection>
          
           <section className="section py-36" id="why">
            <AnimatedSection className="section-header max-w-3xl mx-auto mb-20 text-center">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 text-white">Built for how you actually work</h2>
                <p className="subhead text-lg md:text-xl text-muted-foreground font-light leading-relaxed">We handle the chaos of finding information so you can focus on understanding it.</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6">
                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-blue-400 mb-4 tracking-widest uppercase">Step 01</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-blue-300 transition-colors">Everything in one place</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Connect Google Drive, OneDrive, Dropbox, and local files. No more "where did I save that?" moments. Your documents from work and personal accounts, all searchable in seconds.</p>
                </AnimatedSection>

                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-pink-400 mb-4 tracking-widest uppercase">Step 02</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-pink-300 transition-colors">Ask anything, naturally</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Ask questions that span multiple documents and get synthesized answers instantly. Our AI understands context and connects information across your entire knowledge base—no technical queries needed.</p>
                </AnimatedSection>

                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-purple-400 mb-4 tracking-widest uppercase">Step 03</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-purple-300 transition-colors">Work & life, together</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Manage both professional and personal documents in one workspace. Keep them separate when you need to, or let AI discover connections you never knew existed between your projects.</p>
                </AnimatedSection>

                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-yellow-400 mb-4 tracking-widest uppercase">Step 04</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-yellow-300 transition-colors">Share in one click</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Found something worth sharing? Make it public instantly. No complicated permission settings, no email attachments. Just share the link and you're done.</p>
                </AnimatedSection>
            </div>

            <AnimatedSection className="future-box relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-blue-500/10 border border-blue-500/20 p-14 rounded-3xl text-center mt-20 backdrop-blur-sm" id="roadmap">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="relative z-10">
                  <div className="future-tag inline-block bg-violet-500/15 border border-violet-500/30 py-2 px-4 rounded-full text-xs text-violet-300 mb-6 font-semibold tracking-wider uppercase backdrop-blur-sm">Coming Soon</div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">Your complete AI workspace</h3>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-light">Soon you'll be able to ask AI about your calendar, emails, and more. Schedule meetings, find that message from last week, and manage everything through natural conversation. Ryzor will be your unified command center.</p>
                  <div className="integration-list flex gap-3 justify-center flex-wrap">
                      <div className="integration bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">📅 Google Calendar</div>
                      <div className="integration bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">📅 Microsoft Calendar</div>
                      <div className="integration bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">✉️ Gmail</div>
                      <div className="integration bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">✉️ Outlook</div>
                  </div>
                </div>
            </AnimatedSection>
        </section>

        <section className="final-cta text-center py-36">
            <AnimatedSection>
                <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tighter">Ready to end the search?</h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 font-light">Join teams already using Ryzor to work smarter.</p>
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 h-12 px-8 text-base font-semibold shadow-lg shadow-blue-500/30 border-0">
                    <Link href="/login">Get Started Free</Link>
                </Button>
            </AnimatedSection>
        </section>
        </div>
      </div>
    </>
  );
}


export default function Home() {
  const { user, loading } = useUser();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <div className="absolute inset-0 blur-xl bg-blue-500/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return user ? <LoggedInView /> : <LandingPage />;
}
