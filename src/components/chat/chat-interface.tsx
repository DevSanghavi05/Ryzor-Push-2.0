
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, Send } from 'lucide-react';
import { UploadForm } from '@/components/upload/upload-form';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2">
        <title>Google</title>
        <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);


export function ChatInterface() {
  const [isUploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full flex-1">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold font-headline mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">Ryzor AI</h1>
        </div>

      {/* Input Area */}
      <div className="mt-6 px-12">
        <Card className="rounded-full p-1 shadow-[0_0_25px_-5px_hsl(var(--primary)/0.3)] border-border/50 focus-within:border-primary transition-all bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0 flex items-center">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setUploadOpen(true)}>
              <Paperclip />
              <span className="sr-only">Upload Document</span>
            </Button>
            <Input
              placeholder="Ask me anything..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 text-base bg-transparent shadow-none px-2 py-1 h-auto"
            />
            <Button size="icon" className="rounded-full">
              <Send />
              <span className="sr-only">Send Message</span>
            </Button>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
            <Button variant="outline" className="rounded-full text-foreground/80 hover:text-foreground hover:bg-card/90">
                <GoogleIcon />
                Sign in with Google
            </Button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative bg-card rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 h-64">
            <Image
              src={placeholderImages[0].imageUrl}
              alt={placeholderImages[0].description}
              width={600}
              height={400}
              className="object-cover w-full h-full"
              data-ai-hint={placeholderImages[0].imageHint}
            />
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt-delay"></div>
           <div className="relative bg-card rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 h-64">
            <Image
              src={placeholderImages[2].imageUrl}
              alt={placeholderImages[2].description}
              width={600}
              height={400}
              className="object-cover w-full h-full"
              data-ai-hint={placeholderImages[2].imageHint}
            />
          </div>
        </div>
      </div>


      <UploadForm open={isUploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
