'use client';

import { askQuestion } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowUp, Bot, LoaderCircle, User, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function ChatInterface({ fileId }: { fileId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  useEffect(() => {
    setMessages([{
        id: 'initial-message',
        role: 'assistant',
        content: "I've processed your document. What would you like to know?"
    }])
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: question }]);
    setIsLoading(true);

    const result = await askQuestion(fileId, question);

    if (result.success && result.answer) {
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: result.answer }]);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      })
      // Optionally remove the user's message if the call fails
      setMessages(prev => prev.slice(0, prev.length -1));
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex items-start gap-4 animate-fade-in-up', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && (
                <div className="p-2 bg-primary rounded-full">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <Card className={cn('max-w-[75%]', message.role === 'user' ? 'bg-primary/10' : 'bg-card')}>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </CardContent>
              </Card>
              {message.role === 'user' && (
                <div className="p-2 bg-muted rounded-full">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4 justify-start animate-fade-in-up">
              <div className="p-2 bg-primary rounded-full">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <Card className="max-w-[75%] bg-card">
                 <CardContent className="p-4 flex items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin"/>
                    <span>Ryzor is thinking...</span>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-center gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your document..."
            className="flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e.currentTarget.form as HTMLFormElement);
              }
            }}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <ArrowUp className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
