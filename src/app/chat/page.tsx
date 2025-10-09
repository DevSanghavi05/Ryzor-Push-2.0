
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { useUser } from '@/firebase';
import { ask } from '@/app/actions';
import { MarkdownContent } from '@/components/chat/markdown-content';
import withAuth from '@/firebase/auth/with-auth';
import Link from 'next/link';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInteraction = async () => {
    if (!user || !input.trim()) {
      return;
    }

    const currentInput = input;
    setInput('');
    setLoading(true);
    setMessages([]); // Clear previous messages for a clean response

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

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full flex-1 justify-between p-4">
        <div className="flex items-center mb-4">
            <Button asChild variant="ghost" size="icon" className="mr-2">
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold font-headline text-primary">Chat with your Documents</h1>
        </div>

        <div ref={chatContainerRef} className="flex-1 mb-6 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 && !loading && (
                <div className="text-center text-muted-foreground">
                    Ask a question to get an answer from your documents.
                </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 justify-start`}>
                 <div className={`p-3 rounded-lg max-w-[80%]`}>
                   {msg.role === 'model' && msg.content === '' && loading ? (
                     <Loader2 className="animate-spin" />
                   ) : (
                     <MarkdownContent content={msg.content} />
                   )}
                </div>
              </div>
            ))}
        </div>

      <div className="mt-auto">
        <Card className="rounded-full p-1 shadow-[0_0_25px_-5px_hsl(var(--primary)/0.3)] border-border/50 focus-within:border-primary transition-all bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0 flex items-center">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(ChatPage);
