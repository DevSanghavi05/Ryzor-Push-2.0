
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
  Plus, 
  Trash2,
  Edit,
  PanelLeft
} from 'lucide-react';
import { useUser, AccountType } from '@/firebase';
import { ask } from '@/app/actions';
import withAuth from '@/firebase/auth/with-auth';
import Link from 'next/link';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Logo } from '@/components/layout/logo';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarMenuAction } from '@/components/ui/sidebar';
import { nanoid } from 'nanoid';


export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
}

function LoggedInView() {
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Load chats from local storage
  useEffect(() => {
    if (user) {
        const storedChats = localStorage.getItem(`chats_${user.uid}`);
        if (storedChats) {
            const parsedChats: Chat[] = JSON.parse(storedChats);
            const sortedChats = parsedChats.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setChats(sortedChats);
            // If there are chats, set the most recent one as active
            if (sortedChats.length > 0) {
              setActiveChatId(sortedChats[0].id);
            }
        }
    }
  }, [user]);

  // Save chats to local storage whenever they change
  useEffect(() => {
    if (user && chats.length > 0) {
      localStorage.setItem(`chats_${user.uid}`, JSON.stringify(chats));
    }
  }, [chats, user]);


  const activeChat = useMemo(() => {
    return chats.find(chat => chat.id === activeChatId);
  }, [chats, activeChatId]);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeChat?.messages, loading]);

  const createNewChat = () => {
    const newChat: Chat = {
        id: nanoid(),
        title: "New Chat",
        messages: [],
        createdAt: new Date().toISOString()
    };
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setActiveChatId(newChat.id);
  }

  const deleteChat = (chatId: string) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
        const updatedChats = chats.filter(c => c.id !== chatId);
        setChats(updatedChats);
        
        // If the active chat is deleted, set the new active chat to the first one
        if(activeChatId === chatId) {
            setActiveChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
        }
        localStorage.setItem(`chats_${user!.uid}`, JSON.stringify(updatedChats));
    }
  };

  const renameChat = (chatId: string, currentTitle: string) => {
    const newTitle = prompt("Enter new chat title:", currentTitle);
    if (newTitle && newTitle.trim() !== "") {
        const updatedChats = chats.map(c => c.id === chatId ? {...c, title: newTitle.trim()} : c);
        setChats(updatedChats);
    }
  }

  const handleInteraction = async () => {
    if (!user || !input.trim()) return;

    let currentChatId = activeChatId;
    let isNewChat = false;
    
    // If there is no active chat, create a new one.
    if (!currentChatId) {
        const newChat: Chat = {
            id: nanoid(),
            title: input.length > 30 ? input.substring(0, 27) + '...' : input,
            messages: [],
            createdAt: new Date().toISOString()
        };
        setChats([newChat, ...chats]);
        currentChatId = newChat.id;
        setActiveChatId(currentChatId);
        isNewChat = true;
    }


    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput };
    
    // Update the messages for the active chat
    setChats(prevChats => prevChats.map(chat => {
        if (chat.id === currentChatId) {
            const updatedMessages = [...chat.messages, userMessage];
            // If it's the first message of a new chat, also update the title
            if (isNewChat && updatedMessages.length === 1) {
                return { ...chat, messages: updatedMessages, title: currentInput.length > 30 ? currentInput.substring(0, 27) + '...' : currentInput }
            }
            return { ...chat, messages: updatedMessages }
        }
        return chat;
    }));

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
      
      const currentMessages = chats.find(c => c.id === currentChatId)?.messages || [];

      const stream = await ask(currentInput, contextDocuments, currentMessages.slice(-10));

      let fullResponse = '';
      
      const modelMessage: Message = { role: 'model', content: '' };
       setChats(prevChats => prevChats.map(chat => 
        chat.id === currentChatId 
            ? { ...chat, messages: [...chat.messages, modelMessage] } 
            : chat
        ));


      const reader = stream.getReader();
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = value || '';
        fullResponse += chunk;
        
        setChats(prev => {
            return prev.map(chat => {
                if (chat.id === currentChatId) {
                    const newMessages = [...chat.messages];
                    newMessages[newMessages.length - 1] = { role: 'model', content: fullResponse + '▋' };
                    return { ...chat, messages: newMessages };
                }
                return chat;
            });
        });
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      setChats(prev => {
         return prev.map(chat => {
            if (chat.id === currentChatId) {
                const newMessages = [...chat.messages];
                newMessages[newMessages.length - 1] = { role: 'model', content: fullResponse };
                return { ...chat, messages: newMessages };
            }
            return chat;
        });
      });

    } catch (error) {
      console.error(error);
       setChats(prev => {
         return prev.map(chat => {
            if (chat.id === currentChatId) {
                const newMessages = [...chat.messages];
                newMessages[newMessages.length - 1] = { role: 'model', content: 'Something went wrong. Try again.' };
                return { ...chat, messages: newMessages };
            }
            return chat;
        });
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex w-full h-dvh pt-16 relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar>
            <SidebarHeader>
              <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-headline px-2">My Chats</h2>
                  <Button variant="ghost" size="icon" onClick={createNewChat}>
                      <Plus className="h-5 w-5" />
                  </Button>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {chats.map(chat => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton 
                      isActive={chat.id === activeChatId} 
                      onClick={() => setActiveChatId(chat.id)}
                      className="truncate"
                    >
                      {chat.title}
                    </SidebarMenuButton>
                    <SidebarMenuAction 
                      onClick={() => renameChat(chat.id, chat.title)}
                      aria-label="Rename chat"
                      showOnHover={true}
                    >
                      <Edit />
                    </SidebarMenuAction>
                    <SidebarMenuAction 
                      onClick={() => deleteChat(chat.id)}
                      className="right-8 hover:text-destructive"
                      aria-label="Delete chat"
                      showOnHover={true}
                    >
                      <Trash2 />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
        </Sidebar>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-background/50 relative">
          <header className="p-4 flex items-center gap-2 border-b">
              <SidebarTrigger>
                <PanelLeft size={18} />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold font-headline truncate">
                  {activeChat?.title || "Workspace"}
              </h1>
          </header>
          {/* Background */}
          <div className="bg-aurora"></div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-6 pb-40 overflow-y-auto space-y-6"
          >
            {activeChat?.messages.length === 0 && !loading && (
              <div className="text-center mt-24">
                <h1 className="text-3xl font-bold text-foreground/80 font-headline">Ryzor Workspace</h1>
                <p className="mt-2 text-muted-foreground">
                  Ask a question to start analyzing your documents.
                </p>
              </div>
            )}

            {activeChat?.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-primary p-1.5 shrink-0">
                    <Logo />
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[85%] ${
                    msg.role === 'user' ? 'bg-primary/20' : 'bg-card shadow-sm'
                  }`}
                >
                  <MarkdownContent content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {loading && activeChat?.messages[activeChat.messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-primary p-1.5">
                  <Logo />
                </div>
                <div className="p-3 rounded-lg max-w-[85%] bg-card flex items-center shadow-sm">
                  <MarkdownContent content={'▋'} />
                </div>
              </div>
            )}
          </div>

          {/* Chat Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-transparent">
            <div className="mx-auto max-w-3xl">
              <div className="bg-background/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-full border border-border dark:border-neutral-700 shadow-lg dark:shadow-[0_0_40px_10px_rgba(129,140,248,0.6)]">
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
                    className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg dark:shadow-[0_0_25px_rgba(129,140,248,1)] hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(129,140,248,1)] transition-all duration-200 shrink-0"
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
    </SidebarProvider>
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

  return (
    <div className="relative w-full overflow-x-hidden text-foreground">
      <div className="bg-aurora"></div>

      {/* Hero Section */}
       <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-20 md:py-40">
        <div className="relative z-10 mx-auto max-w-7xl">
            <div className="flex flex-col items-center gap-4 text-center">
                <motion.h1 
                    className="text-5xl md:text-7xl font-bold bg-gradient-to-b from-neutral-800 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text text-transparent font-headline"
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
                    Connect your work and personal accounts. Get instant, AI-powered insights from all your documents, securely separated.
                </motion.p>
                 <motion.div
                    className="mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Button 
                        asChild
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg dark:shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all"
                    >
                        <Link href="/login">
                         <Briefcase className="mr-2" /> Get Started
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </div>
      </div>


      {/* How It Works Section */}
      <AnimatedSection>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 font-headline">Your documents, understood instantly.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card/50 dark:bg-neutral-900/50 p-8 rounded-2xl border border-border dark:border-neutral-800 shadow-sm dark:shadow-[0_0_20px_rgba(129,140,248,0.2)]">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2 font-headline">Connect</h3>
              <p className="text-muted-foreground">Securely link your work and personal Google accounts.</p>
            </div>
            <div className="bg-card/50 dark:bg-neutral-900/50 p-8 rounded-2xl border border-border dark:border-neutral-800 shadow-sm dark:shadow-[0_0_20px_rgba(129,140,248,0.2)]">
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2 font-headline">Ask</h3>
              <p className="text-muted-foreground">Type natural questions like “Summarize my Q3 reports from work.”</p>
            </div>
            <div className="bg-card/50 dark:bg-neutral-900/50 p-8 rounded-2xl border border-border dark:border-neutral-800 shadow-sm dark:shadow-[0_0_20px_rgba(129,140,248,0.2)]">
              <Wand className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2 font-headline">Get Answers</h3>
              <p className="text-muted-foreground">AI finds and explains instantly, keeping your data separate.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>
      
      {/* Redefining Knowledge Section */}
      <AnimatedSection>
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-headline">We’re redefining how humans use knowledge.</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Ryzor AI turns messy documents into living intelligence. No folders. No chaos. Just clarity — instantly. Read our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link> to learn more.
          </p>
           <Button 
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg dark:shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all"
            >
                <Link href="/login">
                    Try Ryzor AI Now
                </Link>
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

    