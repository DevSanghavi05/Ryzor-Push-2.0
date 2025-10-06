
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, Send } from 'lucide-react';
import { UploadForm } from '@/components/upload/upload-form';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { AuthProviderDropdown } from '@/components/auth/auth-provider-dropdown';


export function ChatInterface() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const { user, signInWithGoogle, signInWithMicrosoft } = useUser();

  const handleInteraction = () => {
    if (!user) {
      // This can be changed to open a dialog or dropdown
      signInWithGoogle();
    }
  };


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
            <Button size="icon" className="rounded-full" onClick={handleInteraction}>
              <Send />
              <span className="sr-only">Send Message</span>
            </Button>
          </CardContent>
        </Card>
        {!user && (
          <div className="mt-4 text-center">
             <AuthProviderDropdown />
          </div>
        )}
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
