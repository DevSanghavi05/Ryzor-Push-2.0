'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, FileSearch, Lock } from 'lucide-react';

const features = [
  {
    icon: <FileSearch className="w-8 h-8 text-primary" />,
    title: 'Intelligent Search',
    description: 'Ask questions in plain English and get instant answers from your documents. No more keyword guessing.',
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-primary" />,
    title: 'AI-Powered Analysis',
    description: 'Let the AI summarize, analyze, and extract key information from your files in seconds.',
  },
  {
    icon: <Lock className="w-8 h-8 text-primary" />,
    title: 'Secure & Private',
    description: 'Your documents are stored securely and are never used for training. Your data is your own.',
  },
];

export function Features() {
  return (
    <section className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-headline">
          The World's First AI-Powered File Holder
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Stop searching, start understanding. Ryzor AI transforms your static files into a dynamic knowledge base.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.2}s`}}>
            <Card className="h-full text-center hover:border-primary/50 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="font-headline">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}
