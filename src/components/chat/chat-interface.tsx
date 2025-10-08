
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


export function ChatInterface() {
  const { user, signInWithGoogle } = useUser();

  const handleInteraction = () => {
    if (!user) {
      // This could be improved to show the auth dropdown
      signInWithGoogle();
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
            <h1 className="text-5xl font-bold font-headline mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">Ryzor AI</h1>
            <TypingAnimation lines={aboutLines} className="mb-8 h-8 text-red-500" />
        </div>

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
              onFocus={handleInteraction}
            />
            <Button size="icon" className="rounded-full" onClick={handleInteraction}>
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
    </div>
  );
}
