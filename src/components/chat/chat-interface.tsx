
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, Send } from 'lucide-react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { AuthProviderDropdown } from '@/components/auth/auth-provider-dropdown';
import Link from 'next/link';
import { TypingAnimation } from './typing-animation';
import { ask, Message } from '@/app/actions';

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

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const storageKey = `documents_${user.uid}`;
    const documentsString = localStorage.getItem(storageKey);
    const documents = documentsString ? JSON.parse(documentsString) : [];
    
    // Use the pre-extracted textContent for analysis
    const context = documents.map((doc: any) => {
      return `Document: ${doc.name}\nContent: ${doc.textContent || 'No text content available.'}`;
    }).join('\n\n');
    
    try {
      const aiResponse = await ask(input, context);
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error("Error asking AI:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I ran into an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };
  
  const aboutLines = [
    "Ask. Analyze. Understand. Instantly.",
    "Where your documents evolve into intelligence.",
    "No more folders—just answers."
  ];

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full flex-1 justify-center">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold font-headline mb-4 text-primary">Ryzor AI</h1>
            <TypingAnimation lines={aboutLines} className="mb-12 h-8 text-foreground/80" />
        </div>
      
      {messages.length > 0 && (
        <Card className="mb-6 p-4 bg-card/80 backdrop-blur-sm max-h-[40vh] overflow-y-auto">
          <CardContent className="space-y-4 p-2">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                  <div className="p-3 rounded-lg bg-secondary">
                      <TypingAnimation lines={["..."]} typingSpeed={150} />
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Input Area */}
      <div className="mt-6 px-12">
        <Card className="rounded-full p-1 shadow-[0_0_25px_-5px_hsl(var(--primary)/0.3)] border-border/50 focus-within:border-primary transition-all bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0 flex items-center">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link href="/add">
                <Paperclip />
                <span className="sr-only">Upload Document</span>
              </Link>
            </Button>
            <Input
              placeholder="Ask me anything..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 text-base bg-transparent shadow-none px-2 py-1 h-auto"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
            />
            <Button size="icon" className="rounded-full" onClick={handleInteraction} disabled={loading}>
              <Send />
              <span className="sr-only">Send Message</span>
            </Button>
          </CardContent>
        </Card>
        {!user && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
             <AuthProviderDropdown /> to save and sync your documents.
          </div>
        )}
      </div>

      {messages.length === 0 && (
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
