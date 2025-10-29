
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, FileSearch, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">About Ryzor AI</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Ryzor AI instantly transforms your scattered digital life into a unified, intelligent brain you can talk to. Seamlessly sync documents from both your work and personal accounts—whether it's PDFs from your desktop or files from your Google Drive—and ask complex questions to get immediate, synthesized answers. Need to share your findings? You can make documents public with a single click. We handle the chaos of finding information so you can focus on understanding it. Stop searching, start knowing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <Card>
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <FileSearch className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="mt-4">Centralize Your Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Securely upload PDFs or connect your Google Drive to bring all your scattered information into one intelligent hub. No more hunting through folders.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="mt-4">Ask, Don't Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Interact with your documents using natural language. Ask complex questions and get synthesized answers instantly, complete with sources.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="mt-4">Uncover Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Let our advanced AI analyze your content to find connections, summarize key points, and extract valuable information you might have missed.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold font-headline">The Future of Document Interaction</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Ryzor AI was built on the principle that your data should be accessible and intelligent. We leverage state-of-the-art AI to create a seamless bridge between your questions and the answers hidden within your documents.
          </p>
        </div>

        <div className="mt-16 border-t pt-8 text-center">
          <p className="text-muted-foreground">
            For more details, please review our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
