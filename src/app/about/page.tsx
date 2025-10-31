
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Zap, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">From Chaos to Clarity</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            We've all been there. That one crucial piece of information—is it in your work drive? A personal PDF? Buried in an old slide deck? We built Ryzor AI because we believe finding what you already have shouldn't be a full-time job.
          </p>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Our vision is simple: to turn your scattered digital world into a single, intelligent space where answers are just a question away. It’s not just about finding files; it’s about understanding the knowledge within them.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <Card>
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="mt-4">Your Unified Brain</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Securely connect your work and personal accounts, or upload files directly. Ryzor AI becomes your personal knowledge base, without mixing your contexts.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="mt-4">Conversations, Not Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ask questions in plain English. Instead of just getting a list of files, you get direct, synthesized answers pulled from the right documents.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="mt-4">Discover Hidden Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Let our AI connect the dots across your documents, revealing patterns and summaries you might have missed. Stop searching, start knowing.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold font-headline">Privacy at the Core</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            This isn't about feeding your data to a giant model. Your work and personal documents remain separate and are used only to answer *your* questions. Your privacy is fundamental to how Ryzor AI works.
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
