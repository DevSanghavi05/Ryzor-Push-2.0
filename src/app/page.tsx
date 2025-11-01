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
  Zap
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

  const suggestedQuestions = [
    { icon: FileText, text: "Summarize my recent documents", color: "text-blue-400" },
    { icon: Zap, text: "Find information about revenue", color: "text-purple-400" },
    { icon: Brain, text: "Compare Q2 and Q3 reports", color: "text-pink-400" },
  ];

  return (
      <div className="flex w-full h-dvh pt-16 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-transparent relative z-10">
          <header className="p-4 flex items-center gap-3 border-b border-white/5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-1.5">
                <Logo />
              </div>
              <h1 className="text-lg font-semibold tracking-tight flex-1">
                  Workspace
              </h1>
          </header>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-6 pb-40 overflow-y-auto"
          >
            {messages.length === 0 && !loading && (
              <div className="text-center mt-32 max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold mb-3 tracking-tight">Welcome back</h1>
                  <p className="text-muted-foreground text-lg mb-8">
                    Ask anything about your documents. I'll search across everything to find what you need.
                  </p>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-medium mb-4">Try asking:</p>
                    {suggestedQuestions.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * i }}
                        onClick={() => setInput(q.text)}
                        className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <q.icon className={`w-5 h-5 ${q.color} group-hover:scale-110 transition-transform`} />
                          <span className="text-sm">{q.text}</span>
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
                  className={`flex gap-4 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white p-1.5 shrink-0 shadow-lg shadow-purple-500/20">
                      <Logo />
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'bg-white/5 border border-white/10 backdrop-blur-sm'
                    }`}
                  >
                    <MarkdownContent content={msg.content} />
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-muted-foreground shrink-0 border border-white/10">
                      <User size={16} />
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white p-1.5 shadow-lg shadow-purple-500/20">
                    <Logo />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <MarkdownContent content={'▋'} />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Chat Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
            <div className="mx-auto max-w-3xl pointer-events-auto">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                <div className="p-3 flex items-center gap-3">
                  <Button
                    asChild
                    size="icon"
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-none transition-all duration-200 shrink-0 h-11 w-11"
                  >
                    <Link href="/add">
                      <PlusCircle className="w-5 h-5" />
                      <span className="sr-only">Upload</span>
                    </Link>
                  </Button>

                  <Input
                    placeholder="Ask anything..."
                    className="border-none focus-visible:ring-0 flex-1 text-base bg-transparent text-foreground placeholder:text-muted-foreground/60 px-4 h-11"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleInteraction()}
                    disabled={loading}
                  />

                  <Button
                    size="icon"
                    className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-200 shrink-0 h-11 w-11"
                    onClick={handleInteraction}
                    disabled={loading || !input.trim()}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
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
    <div className="w-full overflow-x-hidden relative">
      {/* Subtle animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <section className="hero text-center pt-32 pb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 py-2 px-4 rounded-full text-sm mb-8 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">Stop searching. Start knowing.</span>
                </div>
            </motion.div>
            
            <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-bold mb-7 tracking-tighter text-white leading-[1.1]"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
                No More Folders,<br />Just Answers
            </motion.h1>
            
            <motion.p 
                className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 font-light"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            >
                Ryzor AI instantly transforms your scattered digital life into a unified, intelligent brain you can talk to. Seamlessly sync documents from both your work and personal accounts—whether it's PDFs from your desktop or files from your Google Drive—and ask complex questions to get immediate, synthesized answers.
            </motion.p>
            
            <motion.div 
                className="flex gap-4 justify-center flex-wrap"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            >
                <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-8 text-base font-semibold shadow-lg shadow-purple-500/30 border-0">
                    <Link href="/login">Start Free Trial</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 h-12 px-8 text-base font-semibold backdrop-blur-sm">
                    <Link href="#why">See How It Works</Link>
                </Button>
            </motion.div>

            <motion.div 
                className="visual-wrapper mt-20"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            >
                <div className="browser-frame bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                    <div className="browser-header bg-white/5 px-5 py-4 flex items-center gap-2 border-b border-white/10">
                        <div className="flex gap-2">
                          <div className="dot w-3 h-3 rounded-full bg-red-500/60"></div>
                          <div className="dot w-3 h-3 rounded-full bg-yellow-500/60"></div>
                          <div className="dot w-3 h-3 rounded-full bg-green-500/60"></div>
                        </div>
                        <div className="flex-1 flex justify-center">
                          <div className="bg-white/5 rounded-lg px-4 py-1 text-xs text-muted-foreground">
                            ryzor.ai/workspace
                          </div>
                        </div>
                    </div>
                    <div className="browser-content p-8 md:p-12">
                        <div className="search-demo bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-muted-foreground mb-8 relative backdrop-blur-sm">
                            What did the Q3 report say about revenue growth?<span className="inline-block w-0.5 h-5 bg-gradient-to-b from-purple-500 to-pink-500 ml-1 animate-pulse"></span>
                        </div>
                        <div className="feature-pills flex gap-3 flex-wrap">
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground flex items-center gap-2 backdrop-blur-sm hover:bg-white/10 transition-colors">
                              <FileText className="w-4 h-4 text-purple-400" />
                              <span>All your documents</span>
                            </div>
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground flex items-center gap-2 backdrop-blur-sm hover:bg-white/10 transition-colors">
                              <Brain className="w-4 h-4 text-pink-400" />
                              <span>Smart search</span>
                            </div>
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground flex items-center gap-2 backdrop-blur-sm hover:bg-white/10 transition-colors">
                              <MessageSquare className="w-4 h-4 text-blue-400" />
                              <span>Natural questions</span>
                            </div>
                            <div className="pill bg-white/5 border border-white/10 py-3 px-5 rounded-xl text-sm text-muted-foreground flex items-center gap-2 backdrop-blur-sm hover:bg-white/10 transition-colors">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              <span>Instant sharing</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>

        <section className="section py-36" id="why">
            <AnimatedSection className="section-header max-w-3xl mx-auto mb-20 text-center">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 text-white">Built for how you actually work</h2>
                <p className="subhead text-lg md:text-xl text-muted-foreground font-light leading-relaxed">We handle the chaos of finding information so you can focus on understanding it.</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6">
                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-purple-400 mb-4 tracking-widest uppercase">Step 01</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-purple-300 transition-colors">Everything in one place</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Connect Google Drive, OneDrive, Dropbox, and local files. No more "where did I save that?" moments. Your documents from work and personal accounts, all searchable in seconds.</p>
                </AnimatedSection>

                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-pink-400 mb-4 tracking-widest uppercase">Step 02</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-pink-300 transition-colors">Ask anything, naturally</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Ask questions that span multiple documents and get synthesized answers instantly. Our AI understands context and connects information across your entire knowledge base—no technical queries needed.</p>
                </AnimatedSection>

                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-blue-400 mb-4 tracking-widest uppercase">Step 03</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-blue-300 transition-colors">Work & life, together</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Manage both professional and personal documents in one workspace. Keep them separate when you need to, or let AI discover connections you never knew existed between your projects.</p>
                </AnimatedSection>

                <AnimatedSection className="group card bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="card-number text-xs font-bold text-yellow-400 mb-4 tracking-widest uppercase">Step 04</div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white group-hover:text-yellow-300 transition-colors">Share in one click</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">Found something worth sharing? Make it public instantly. No complicated permission settings, no email attachments. Just share the link and you're done.</p>
                </AnimatedSection>
            </div>

            <AnimatedSection className="future-box relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/10 border border-purple-500/20 p-14 rounded-3xl text-center mt-20 backdrop-blur-sm" id="roadmap">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="relative z-10">
                  <div className="future-tag inline-block bg-pink-500/15 border border-pink-500/30 py-2 px-4 rounded-full text-xs text-pink-300 mb-6 font-semibold tracking-wider uppercase backdrop-blur-sm">Coming Soon</div>
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
                <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-8 text-base font-semibold shadow-lg shadow-purple-500/30 border-0">
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
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <div className="absolute inset-0 blur-xl bg-purple-500/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return user ? <LoggedInView /> : <LandingPage />;
}
