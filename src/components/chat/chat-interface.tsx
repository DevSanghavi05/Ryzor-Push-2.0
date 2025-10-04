
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, Send, BrainCircuit, Bot } from 'lucide-react';
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
      // TODO: Add bot response logic
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
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto pr-4 -mr-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className='p-4 bg-primary/10 rounded-full mb-4'>
                <BrainCircuit className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-headline">Ryzor AI</h2>
            <p className="text-muted-foreground mt-2">
              Start by asking a question or upload a document to begin.
            </p>
          </div>
        ) : (
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
                  className={`px-4 py-3 rounded-2xl max-w-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-muted-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-6">
        <Card className="rounded-full p-2 shadow-lg border-2 border-border/50 focus-within:border-primary transition-all">
          <CardContent className="p-0 flex items-center">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setUploadOpen(true)}>
              <Paperclip />
              <span className="sr-only">Upload Document</span>
            </Button>
            <Input
              placeholder="Ask me anything about your document..."
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
      </div>

      <UploadForm open={isUploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
