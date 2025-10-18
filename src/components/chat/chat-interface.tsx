
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { AuthProviderDropdown } from '@/components/auth/auth-provider-dropdown';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function ChatInterface() {
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();


  const handleInteraction = async () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to start a chat with your documents.",
      });
      return;
    }
    if (!input.trim()) return;

    setLoading(true);

    try {
      const storageKey = `documents_${user.uid}`;
      const documentsString = localStorage.getItem(storageKey);
      const documents = documentsString ? JSON.parse(documentsString) : [];

      const context = documents
        .filter((doc: any) => doc.textContent && doc.textContent.trim().length > 0)
        .map((doc: any) => `Document: ${doc.name}\nContent: ${doc.textContent}`)
        .join('\n\n');

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
      
      // Navigate to the chat page, passing the initial question
      router.push(`/chat?q=${encodeURIComponent(input)}`);


    } catch (error) {
      console.error("Error preparing for chat:", error);
      toast({
          variant: "destructive",
          title: "An Error Occurred",
          description: "Could not start the chat session. Please try again.",
      });
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
        {/* This component is now deprecated and its contents moved to page.tsx */}
    </div>
  );
}
