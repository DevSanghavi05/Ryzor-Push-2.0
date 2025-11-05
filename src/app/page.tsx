
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
  Sparkles,
  FileText,
  Zap,
  Rocket,
  Globe,
  Lock,
  RotateCw,
  Target,
  Paperclip,
  ChevronDown
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
import { nanoid } from 'nanoid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DocumentPickerSidebar } from '@/components/chat/document-picker-sidebar';
import { Badge } from '@/components/ui/badge';


export interface Message {
  role: 'user' | 'model';
  content: string;
}

function LoggedInView() {
  const { user, workAccessToken, personalAccessToken } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [focusedDocIds, setFocusedDocIds] = useState<Set<string>>(new Set());

  // Load all documents from local storage on mount
  useEffect(() => {
    if (user) {
        const storedDocs = localStorage.getItem(`documents_${user.uid}`);
        if (storedDocs) {
            setAllDocs(JSON.parse(storedDocs).filter((d:any) => d.isImported));
        }
    }
  }, [user]);

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
    } else if (user && messages.length === 0) {
      // Also clear storage if messages are reset
      localStorage.removeItem(`messages_${user.uid}`);
    }
  }, [messages, user]);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);
  
  const handleSaveAndReset = () => {
    if (!user || messages.length === 0) return;

    const historyKey = `chat_history_${user.uid}`;
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'Chat';
    const newSession = {
      id: nanoid(),
      savedAt: new Date().toISOString(),
      messages: messages,
      title: firstUserMessage.substring(0, 40) + (firstUserMessage.length > 40 ? '...' : ''),
    };

    existingHistory.push(newSession);
    localStorage.setItem(historyKey, JSON.stringify(existingHistory));

    toast({
      title: 'Chat Saved',
      description: 'Your conversation has been saved to your history.',
    });
    
    setMessages([]);
    setIsResetDialogOpen(false);
  };

  const handleResetWithoutSaving = () => {
     if (!user) return;
      setMessages([]);
      toast({
        title: 'Chat Reset',
        description: 'Your conversation history has been cleared.',
      });
      setIsResetDialogOpen(false);
  }

  const handleInteraction = async () => {
    if (!user || !input.trim()) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput };
    
    setMessages(prevMessages => [...prevMessages, userMessage, { role: 'model', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      if (allDocs.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Documents Found',
          description: 'Upload or import a document before chatting.',
        });
        setMessages(prev => prev.slice(0, -2)); // Remove user message and placeholder
        setLoading(false);
        router.push('/add');
        return;
      }
      
      const docsToQuery = focusedDocIds.size > 0 
        ? allDocs.filter(doc => focusedDocIds.has(doc.id)) 
        : allDocs;

      // Prepare documents with content for the server action
      const documentsWithContent = docsToQuery.map(doc => {
        let content;
        // For local files, get content from localStorage.
        if (doc.source === 'local') {
          content = localStorage.getItem(`document_content_${doc.id}`) || '(Content not found in local storage)';
        }
        return { ...doc, content }; // For Drive files, content will be fetched on the server
      });

      const stream = await ask({
        question: currentInput, 
        documents: documentsWithContent,
        history: messages.slice(-10),
        workAccessToken,
        personalAccessToken
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: !done });
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.content += chunk;
          }
          return newMessages;
        });
      }
      
    } catch (error: any) {
      console.error(error);
       setMessages(prev => {
         const newMessages = [...prev];
         const lastMessage = newMessages[newMessages.length - 1];
         if (lastMessage.role === 'model') {
            lastMessage.content = `Sorry, something went wrong: ${error.message}`;
         }
         return newMessages;
        });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex w-full h-dvh pt-16 relative overflow-hidden">
        <div className="bg-aurora"></div>
        
        <DocumentPickerSidebar 
          isOpen={isDocPickerOpen}
          onOpenChange={setIsDocPickerOpen}
          allDocs={allDocs}
          focusedDocIds={focusedDocIds}
          onFocusedDocIdsChange={setFocusedDocIds}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-transparent relative z-10">
          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-6 overflow-y-auto"
          >
            {messages.length > 0 ? (
                <div className="space-y-6 max-w-4xl mx-auto pb-40">
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
                            : 'bg-card border border-border'
                        }`}
                      >
                         {msg.role === 'model' && msg.content === '' && loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Ryzor is thinking...</span>
                            </div>
                        ) : (
                            <MarkdownContent content={msg.content + (loading && i === messages.length -1 ? '▋' : '')} />
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                          <User size={18} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-3xl mx-auto -mt-16">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                     <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
                        Your Intelligent Workspace
                      </h1>
                      <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                          Ask questions, get summaries, and find insights across all your documents instantly.
                      </p>
                  </motion.div>
              </div>
            )}
          </div>

          {/* Chat Bar */}
           <div className="absolute bottom-12 left-0 right-0 p-4 bg-transparent">
            <div className="mx-auto max-w-4xl">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-lg opacity-25 group-hover:opacity-40 transition duration-1000" />
                    <div className="relative bg-background/80 backdrop-blur-xl rounded-full border border-border shadow-2xl shadow-black/20">
                      <div className="p-2 flex items-center gap-2">
                        <Input
                          placeholder='Ask anything about your documents...'
                          className="border-none focus-visible:ring-0 flex-1 text-base bg-transparent text-foreground placeholder:text-muted-foreground/60 px-4 h-12"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleInteraction()}
                          disabled={loading}
                        />

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsDocPickerOpen(true)}
                            className="relative rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-all duration-200 shrink-0 h-10 w-10"
                          >
                            <Target className="w-5 h-5" />
                            <span className="sr-only">Focus on specific documents</span>
                            {focusedDocIds.size > 0 && (
                              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {focusedDocIds.size}
                              </Badge>
                            )}
                          </Button>

                        <Button
                          size="icon"
                          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shrink-0 h-10 w-10 shadow-lg shadow-primary/30"
                          onClick={handleInteraction}
                          disabled={loading || !input.trim()}
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                </motion.div>
                {messages.length > 0 && (
                  <div className="flex justify-center mt-3">
                     <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                            <AlertDialogTrigger asChild>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="rounded-full text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                               >
                                 <RotateCw className="w-4 h-4 mr-2" />
                                 New Chat
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Start a New Chat</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Would you like to save this conversation to your chat history before starting a new one?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <Button variant="destructive" onClick={handleResetWithoutSaving}>Clear Without Saving</Button>
                                    <AlertDialogAction onClick={handleSaveAndReset}>Save and Start New Chat</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                  </div>
                )}
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
    const [typedText, setTypedText] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showResponse, setShowResponse] = useState(false);

    const fullQuestion = "What did the Q3 report say about revenue growth?";
    const fullAnswer = "Based on your Q3 financial report, revenue grew by 34% year-over-year, reaching $4.2M. The growth was primarily driven by enterprise subscriptions (up 58%) and strategic partnerships. Key highlights include a 23% increase in customer retention and expansion into 3 new markets.";

    useEffect(() => {
        const typeChar = (text: string, updater: (val: string) => void, onComplete: () => void, index = 0) => {
            if (index < text.length) {
                updater(text.slice(0, index + 1));
                setTimeout(() => typeChar(text, updater, onComplete, index + 1), 25);
            } else {
                onComplete();
            }
        };

        const startSimulation = () => {
            setTypedText('');
            setAiResponse('');
            setShowResponse(false);
            setIsTyping(true);

            typeChar(fullQuestion, setTypedText, () => {
                setIsTyping(false);
                setTimeout(() => {
                    setShowResponse(true);
                    typeChar(fullAnswer, setAiResponse, () => {
                        setTimeout(startSimulation, 4000);
                    });
                }, 800);
            });
        };

        const timeoutId = setTimeout(startSimulation, 500);

        return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full overflow-x-hidden relative">
            <div className="bg-aurora"></div>

            <div className="container mx-auto px-6 relative z-10">
                <section className="hero text-center pt-32 pb-24">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                        <div className="inline-flex items-center gap-3 bg-background/50 border border-border text-foreground py-2 px-5 rounded-full text-sm mb-10 backdrop-blur-xl shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse" />
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            <span className="font-semibold bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Stop searching. Start knowing.</span>
                        </div>
                    </motion.div>
                    
                    <motion.h1 
                        className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tighter leading-[0.9]"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                          No More Folders,
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                          Just Answers
                        </span>
                    </motion.h1>
                    
                    <motion.p 
                        className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-14 font-light"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        Ryzor instantly transforms your scattered digital life into a unified, intelligent brain you can talk to. Seamlessly sync documents from both your work and personal accounts—whether it's PDFs from your desktop or files from your Google Drive—and ask complex questions to get immediate, synthesized answers.
                    </motion.p>
                    
                    <motion.div 
                        className="flex gap-5 justify-center flex-wrap"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Button asChild size="lg" className="relative group bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:from-blue-600 hover:via-violet-600 hover:to-pink-600 h-14 px-10 text-lg font-bold text-primary-foreground border-0 shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/80 hover:scale-105 transition-all duration-300">
                            <Link href="/login">
                              <span className="relative z-10 flex items-center gap-2">
                                Start Free Trial
                                <Rocket className="w-5 h-5" />
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="bg-background/50 border-border hover:bg-accent/10 hover:border-accent h-14 px-10 text-lg font-bold backdrop-blur-xl shadow-lg hover:scale-105 transition-all duration-300">
                            <Link href="#why">See How It Works</Link>
                        </Button>
                    </motion.div>

                    <motion.div 
                        className="mt-24"
                        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <div className="relative group">
                          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                          <div className="relative browser-frame bg-background/60 border border-border rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-2xl">
                              <div className="browser-header bg-background/80 px-6 py-5 flex items-center gap-3 border-b border-border backdrop-blur-xl">
                                  <div className="flex gap-2.5">
                                    <div className="dot w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50"></div>
                                    <div className="dot w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50"></div>
                                    <div className="dot w-3.5 h-3.5 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50"></div>
                                  </div>
                                  <div className="flex-1 flex justify-center">
                                    <div className="bg-secondary border border-border rounded-xl px-6 py-2 text-xs text-muted-foreground font-mono backdrop-blur-sm">
                                      ryzor.pro/workspace
                                    </div>
                                  </div>
                              </div>
                              <div className="browser-content p-10 md:p-14">
                                  <div className="search-demo relative group/search mb-8">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover/search:opacity-100 transition-opacity duration-500" />
                                    <div className="relative bg-secondary/50 border border-border rounded-2xl px-7 py-6 text-lg text-foreground backdrop-blur-xl min-h-[60px] flex items-center">
                                      {typedText}
                                      {isTyping && (
                                        <span className="inline-block w-0.5 h-6 bg-gradient-to-b from-blue-400 via-violet-400 to-pink-400 ml-2 animate-blink shadow-lg"></span>
                                      )}
                                    </div>
                                  </div>

                                  {showResponse && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.4 }}
                                      className="mb-8"
                                    >
                                      <div className="flex gap-4 items-start">
                                        <div className="relative shrink-0">
                                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
                                          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 flex items-center justify-center text-white p-2.5 shadow-xl">
                                            <Sparkles className="w-6 h-6" />
                                          </div>
                                        </div>
                                        <div className="flex-1 bg-background/40 border border-border rounded-2xl px-6 py-5 backdrop-blur-xl shadow-xl">
                                          <p className="text-foreground leading-relaxed">
                                            {aiResponse}
                                            {aiResponse.length < fullAnswer.length && (
                                              <span className="inline-block w-0.5 h-5 bg-gradient-to-b from-blue-400 via-violet-400 to-pink-400 ml-1 animate-blink"></span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}

                                  <div className="feature-pills flex gap-4 flex-wrap">
                                      <div className="bg-background/50 border border-blue-500/30 py-4 px-6 rounded-2xl text-sm text-foreground flex items-center gap-3 backdrop-blur-xl hover:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300 shadow-lg group/pill">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover/pill:scale-110 transition-transform">
                                          <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-semibold">All your documents</span>
                                      </div>
                                      <div className="bg-background/50 border border-violet-500/30 py-4 px-6 rounded-2xl text-sm text-foreground flex items-center gap-3 backdrop-blur-xl hover:border-violet-400/50 hover:bg-violet-500/10 transition-all duration-300 shadow-lg group/pill">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/50 group-hover/pill:scale-110 transition-transform">
                                          <Brain className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-semibold">Smart search</span>
                                      </div>
                                      <div className="bg-background/50 border border-pink-500/30 py-4 px-6 rounded-2xl text-sm text-foreground flex items-center gap-3 backdrop-blur-xl hover:border-pink-400/50 hover:bg-pink-500/10 transition-all duration-300 shadow-lg group/pill">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/50 group-hover/pill:scale-110 transition-transform">
                                          <MessageSquare className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-semibold">Natural questions</span>
                                      </div>
                                      <div className="bg-background/50 border border-amber-500/30 py-4 px-6 rounded-2xl text-sm text-foreground flex items-center gap-3 backdrop-blur-xl hover:border-amber-400/50 hover:bg-amber-500/10 transition-all duration-300 shadow-lg group/pill">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/50 group-hover/pill:scale-110 transition-transform">
                                          <Zap className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-semibold">Instant sharing</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                        </div>
                    </motion.div>
                </section>

                <section className="py-32" id="why">
                    <AnimatedSection className="max-w-3xl mx-auto mb-20 text-center">
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                          Beyond Simple Search
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                          We built Ryzor to handle the chaos of your digital life, so you can stop looking for information and start using it.
                        </p>
                    </AnimatedSection>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Card 1 */}
                      <AnimatedSection className="group relative bg-card/50 border border-border p-10 rounded-3xl backdrop-blur-xl shadow-2xl hover:border-blue-500/50 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50 group-hover:scale-105 transition-transform">
                            <Globe className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-3xl font-bold mb-4 text-foreground">One Workspace, Every File</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Connect Google Drive, upload local PDFs, and more. Ryzor unifies your work and personal documents without mixing them up, giving you a single, secure place to find anything.
                          </p>
                        </div>
                      </AnimatedSection>

                      {/* Card 2 */}
                      <AnimatedSection className="group relative bg-card/50 border border-border p-10 rounded-3xl backdrop-blur-xl shadow-2xl hover:border-violet-500/50 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/50 group-hover:scale-105 transition-transform">
                            <Zap className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-3xl font-bold mb-4 text-foreground">Answers, Not Links</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Ask complex questions that span multiple documents. Instead of a list of files, you get direct, synthesized answers with the information you need, saving you hours of manual searching.
                          </p>
                        </div>
                      </AnimatedSection>
                      
                      {/* Card 3 */}
                      <AnimatedSection className="group relative bg-card/50 border border-border p-10 rounded-3xl backdrop-blur-xl shadow-2xl hover:border-pink-500/50 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/50 group-hover:scale-105 transition-transform">
                            <Brain className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-3xl font-bold mb-4 text-foreground">Uncover Hidden Insights</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Let our AI connect the dots across your entire knowledge base, revealing patterns and summaries you might have missed. Go from data to decision in a fraction of the time.
                          </p>
                        </div>
                      </AnimatedSection>
                      
                      {/* Card 4 */}
                      <AnimatedSection className="group relative bg-card/50 border border-border p-10 rounded-3xl backdrop-blur-xl shadow-2xl hover:border-amber-500/50 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/50 group-hover:scale-105 transition-transform">
                            <Lock className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-3xl font-bold mb-4 text-foreground">Private by Design</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Your documents are yours alone. They are used only to answer *your* questions. We never train our models on your data. Work and personal knowledge bases remain separate and secure.
                          </p>                        </div>
                      </AnimatedSection>
                    </div>
                </section>

                <section className="py-32">
                    <AnimatedSection className="relative overflow-hidden bg-background/50 border border-border p-14 rounded-3xl text-center backdrop-blur-sm" id="roadmap">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 animate-pulse" style={{ animationDuration: '4s' }} />
                        <div className="relative z-10">
                          <div className="inline-block bg-violet-500/15 border border-violet-500/30 py-2 px-4 rounded-full text-xs text-violet-300 mb-6 font-semibold tracking-wider uppercase backdrop-blur-sm">Coming Soon</div>
                          <h3 className="text-4xl md:text-5xl font-bold mb-5 text-foreground">Your Complete AI Workspace</h3>
                          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-light">
                            Soon, you'll be able to ask Ryzor about your calendar, emails, and more. Schedule meetings, find that message from last week, and manage everything through natural conversation.
                          </p>
                          <div className="flex gap-4 justify-center flex-wrap">
                              <div className="bg-secondary border border-border py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">📅 Google Calendar</div>
                              <div className="bg-secondary border border-border py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">✉️ Gmail</div>
                              <div className="bg-secondary border border-border py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">📅 Outlook Calendar</div>
                              <div className="bg-secondary border border-border py-3 px-5 rounded-xl text-sm text-muted-foreground backdrop-blur-sm">✉️ Outlook</div>
                          </div>
                        </div>
                    </AnimatedSection>
                </section>

                <section className="text-center py-32">
                    <AnimatedSection>
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Ready to end the search?</h2>
                        <p className="text-lg md:text-xl text-muted-foreground mb-12 font-light">
                          Get started for free. No credit card required.
                        </p>
                        <Button asChild size="lg" className="relative group bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:from-blue-600 hover:via-violet-600 hover:to-pink-600 h-14 px-10 text-lg font-bold text-primary-foreground border-0 shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/80 hover:scale-105 transition-all duration-300">
                            <Link href="/login">
                              <span className="relative z-10">
                                Sign Up Now
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return user ? <LoggedInView /> : <LandingPage />;
}
