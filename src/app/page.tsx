
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot, PlusCircle, BrainCircuit, FileSearch, Lightbulb } from 'lucide-react';
import { useUser } from '@/firebase';
import { ask } from '@/app/actions';
import { TypingAnimation } from '@/components/chat/typing-animation';
import withAuth from '@/firebase/auth/with-auth';
import Link from 'next/link';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


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
    if (!user || !input.trim()) {
      return;
    }

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
        .filter((doc: any) => doc.textContent && doc.textContent.trim().length > 0)
        .map((doc: any) => `Document: ${doc.name}\n\nContent:\n${doc.textContent}`)
        .join('\n\n---\n\n');

      if (!context) {
        toast({
            variant: "destructive",
            title: "No Documents Found",
            description: "Please upload or import a document before starting a chat.",
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
        try {
            const { done, value } = await reader.read();
            if (done) {
              setLoading(false);
              return;
            }
            fullResponse += value;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[modelMessageIndex] = { role: 'model', content: fullResponse };
              return newMessages;
            });
            await readStream();
        } catch (error) {
            console.error("Error reading stream:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[modelMessageIndex] = { role: 'model', content: "Sorry, I encountered an error while streaming the response." };
                return newMessages;
            });
            setLoading(false);
        }
      };
      
      await readStream();

    } catch (error) {
      console.error("Error asking AI:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I ran into an error. Please try again." }]);
      setLoading(false);
    }
  };

  return (
     <div className="flex flex-col w-full h-full">
        <div className="relative flex-1 w-full max-w-4xl mx-auto flex flex-col p-4 animate-fade-in-up pt-16">
            <Image src="/ai-abstract.svg" alt="Abstract AI visual" width={500} height={500} className="absolute right-10 top-1/4 w-1/3 opacity-10" />
            <div ref={chatContainerRef} className="flex-1 mb-24 p-4 overflow-y-auto space-y-6">
                {messages.length === 0 && !loading && (
                <div className="text-center text-muted-foreground mt-16 pt-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent">
                    <h1 className="text-3xl font-bold font-headline text-primary">Workspace</h1>
                    <p className="mt-2">Ask a question to begin analyzing your documents.</p>
                </div>
                )}
                {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0"><Bot size={16}/></div>
                    )}
                    <div className={`p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-primary/20' : 'bg-card'}`}>
                    <MarkdownContent content={msg.content} />
                    </div>
                    {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs shrink-0"><User size={16}/></div>
                    )}
                </div>
                ))}
                {loading && (
                <div className="flex items-start gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0"><Bot size={16}/></div>
                    <div className="p-3 rounded-lg max-w-[85%] bg-card flex items-center">
                    <TypingAnimation text="..." />
                    </div>
                </div>
                )}
            </div>
        </div>
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl">
            <div className="bg-[#0b0b0b]/60 backdrop-blur-md rounded-full shadow-lg border border-gray-700">
                <div className="p-2 flex items-center">
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                    <Link href="/add">
                        <PlusCircle />
                        <span className="sr-only">Upload Document</span>
                    </Link>
                    </Button>
                    <Input
                    placeholder="Ask anything about your documents..."
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 text-base bg-transparent shadow-none px-4 py-1 h-auto"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
                    disabled={loading}
                    />
                    <Button size="icon" className="rounded-full" onClick={handleInteraction} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <Send />}
                    <span className="sr-only">Send Message</span>
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}


function LandingPage() {
    const { signInWithGoogle } = useUser();
    const { toast } = useToast();

    const handleDemo = () => {
        toast({
            title: "Demo Coming Soon!",
            description: "The interactive demo is not yet available, but you can sign in to get started!",
        });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full overflow-hidden p-4 w-full">
            <div className="absolute inset-0 bg-gears -z-10"></div>
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10 animate-fade-in-down text-center md:text-left">
                <div>
                    <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
                        No more folders. Just answers.
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0 mb-8">
                        Upload or connect your files. Ask anything. Get instant answers.
                    </p>
                    <div className="flex justify-center md:justify-start gap-4">
                        <Button 
                            size="lg" 
                            onClick={signInWithGoogle} 
                            className="bg-gradient-to-r from-primary to-accent text-primary-foreground transition-transform hover:scale-105"
                        >
                            Continue with Google
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            onClick={handleDemo}
                            className="transition-transform hover:scale-105"
                        >
                            Try Demo
                        </Button>
                    </div>
                </div>

                <div className="w-full max-w-xl mx-auto group">
                    <div className="relative bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20 shadow-2xl shadow-primary/10">
                        <div className="flex items-center gap-3 p-3">
                             <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs shrink-0"><User size={16}/></div>
                             <div className="p-3 rounded-lg bg-primary/20 max-w-[85%]">
                                <p>What were the key findings in the Q3 market analysis?</p>
                             </div>
                        </div>
                         <div className="flex items-start gap-3 p-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0"><Bot size={16}/></div>
                            <div className="p-3 rounded-lg bg-card max-w-[85%] text-left">
                                <TypingAnimation text={"Based on the Q3 report, the key findings were:\n\n*   **North American market** grew by 15% quarter-over-quarter.\n*   **New product line 'Alpha'** exceeded sales projections by 30%.\n*   **Emerging challenges** include supply chain disruptions in the APAC region."} speed={25}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="container mx-auto py-24 px-4 md:px-6">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <Card>
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <FileSearch className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Ask, Don't Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        Interact with your documents using natural language. Ask complex questions and get synthesized answers instantly, complete with sources.
                        </p>
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <BrainCircuit className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Uncover Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        Let our advanced AI analyze your content to find connections, summarize key points, and extract valuable information you might have missed.
                        </p>
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <Lightbulb className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Centralize Your Knowledge</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        Securely upload PDFs or connect your Google Drive to bring all your scattered information into one intelligent hub. No more hunting through folders.
                        </p>
                    </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


export default function Home() {
  const { user, loading } = useUser();
  
  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary"/></div>;
  }

  return user ? <LoggedInView /> : <LandingPage />;
}

    