
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { AuthProviderDropdown } from '@/components/auth/auth-provider-dropdown';
import Link from 'next/link';
import { TypingAnimation } from './typing-animation';
import { Message } from '@/app/chat/page';
import { ask } from '@/app/actions';

export function ChatInterface() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInteraction = async () => {
    if (!user) {
      return;
    }
    if (!input.trim()) return;

    const currentInput = input;
    setInput('');
    setLoading(true);
    setMessages([]); // Clear previous messages

    try {
      const storageKey = `documents_${user.uid}`;
      const documentsString = localStorage.getItem(storageKey);
      const documents = documentsString ? JSON.parse(documentsString) : [];

      const context = documents
        .filter((doc: any) => doc.textContent && doc.textContent.trim().length > 0)
        .map((doc: any) => `Document: ${doc.name}\nContent: ${doc.textContent}`)
        .join('\n\n');

      if (!context) {
        setMessages([{ role: 'model', content: "I don't have any documents to analyze. Please upload a PDF or import a Google Doc first." }]);
        setLoading(false);
        return;
      }
      
      const stream = await ask(currentInput, context, []);
      let fullResponse = '';
      setMessages([{ role: 'model', content: '' }]);

      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += value;
        setMessages([{ role: 'model', content: fullResponse }]);
      }

    } catch (error) {
      console.error("Error asking AI:", error);
      setMessages([{ role: 'model', content: "Sorry, I ran into an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };
  
  const aboutLines = [
    "Ask. Analyze. Understand. Instantly.",
    "Where your documents evolve into intelligence.",
    "No more folders—just answers."
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  const userName = user?.displayName?.split(' ')[0] || '';


  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full flex-1 justify-center pt-16">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold font-headline mb-4 text-primary">
              {user ? `${getGreeting()}, ${userName}` : "Ryzor AI"}
            </h1>
            <TypingAnimation lines={aboutLines} className="mb-12 h-8 text-foreground/80" />
        </div>
      
      {messages.length > 0 && (
        <div className="mb-6 p-4 max-h-[50vh] overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 justify-center text-center`}>
                <div className={`p-3 rounded-lg max-w-[80%]`}>
                   {msg.role === 'model' && msg.content === '' && loading ? (
                     <Loader2 className="animate-spin" />
                   ) : (
                     <TypingAnimation text={msg.content} />
                   )}
                </div>
              </div>
            ))}
        </div>
      )}


      {/* Input Area */}
      <div className="mt-6 px-12">
        <div className="rounded-full p-1 shadow-[0_0_25px_-5px_hsl(var(--primary)/0.3)] border-border/50 focus-within:border-primary transition-all bg-card/80 backdrop-blur-sm">
          <div className="p-0 flex items-center">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link href="/add">
                <Paperclip />
                <span className="sr-only">Upload Document</span>
              </Link>
            </Button>
            <Input
              placeholder="Ask anything about your documents..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 text-base bg-transparent shadow-none px-2 py-1 h-auto"
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
        {!user && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
             <AuthProviderDropdown /> to save and sync your documents.
          </div>
        )}
      </div>

      {messages.length === 0 && !loading && (
        <div className="mt-16 w-full max-w-6xl mx-auto px-4" style={{ perspective: '1000px' }}>
            <div className="relative group transition-all duration-500" style={{ transform: 'rotateY(-20deg) rotateX(10deg)' }}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative bg-card rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 border border-primary/20 shadow-2xl shadow-primary/20">
                <Image
                src={placeholderImages[2].imageUrl}
                alt={placeholderImages[2].description}
                width={1200}
                height={800}
                className="object-cover w-full h-full"
                data-ai-hint={placeholderImages[2].imageHint}
                priority
                />
            </div>
            </div>
        </div>
      )}
    </div>
  );
}
