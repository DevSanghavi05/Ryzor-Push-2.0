import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// This is a placeholder page for a single document.
// We will add the chat functionality here.

export default function DocumentPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 pt-16">
        <div className="w-full max-w-4xl text-center">
            <h1 className="text-4xl font-bold font-headline mb-4">
              Document: {params.id}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              This is where the document viewer and chat interface will go.
            </p>
            <Button asChild>
                <Link href="/documents">Back to Documents</Link>
            </Button>
        </div>
      </main>
    </div>
  );
}
