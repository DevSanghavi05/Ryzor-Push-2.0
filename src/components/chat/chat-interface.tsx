
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, Send, Bot, Plus } from 'lucide-react';
import { UploadForm } from '@/components/upload/upload-form';

type Message = {
    sender: 'user' | 'bot';
    text: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isUploadOpen, setUploadOpen] = useState(false);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { sender: 'user', text: inputValue.trim() }]);
      setInputValue('');
      // Simulate bot response
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: 'This is a simulated response.'}]);
      }, 1000)
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full flex-1">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold font-headline mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">Ryzor AI</h1>
        </div>

      <div className="flex-1 flex flex-col justify-end min-h-[300px]">
        {messages.length > 0 ? (
          <div className="overflow-y-auto pr-4 -mr-4 h-full bg-background/30 backdrop-blur-sm rounded-lg border p-4 shadow-inner">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-md ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card text-card-foreground border rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>


      {/* Input Area */}
      <div className="mt-6">
        <Card className="rounded-full p-2 shadow-[0_0_25px_-5px_hsl(var(--primary)/0.3)] border-border/50 focus-within:border-primary transition-all bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0 flex items-center">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setUploadOpen(true)}>
              <Paperclip />
              <span className="sr-only">Upload Document</span>
            </Button>
            <Input
              placeholder="Ask me anything..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 text-base bg-transparent shadow-none"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <Button size="icon" className="rounded-full" onClick={handleSendMessage} disabled={!inputValue.trim()}>
              <Send />
              <span className="sr-only">Send Message</span>
            </Button>
          </CardContent>
        </Card>
        <p className="text-lg text-muted-foreground mt-4 text-center">Ask your PDFs anything in seconds</p>
        <div className="mt-2 text-center">
            <Button variant="ghost" onClick={() => setUploadOpen(true)}>
                <Plus className="mr-2" />
                Upload File
            </Button>
        </div>
      </div>

      <UploadForm open={isUploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
