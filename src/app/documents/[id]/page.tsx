'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';

type Document = {
  id: string;
  name: string;
  uploaded: string;
  content: string;
};

export default function DocumentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedDocuments: Document[] = JSON.parse(
        localStorage.getItem('documents') || '[]'
      );
      const foundDocument = storedDocuments.find((doc) => doc.id === id);
      if (foundDocument) {
        setDocument(foundDocument);
      } else {
        setError('Document not found.');
      }
    } catch (e) {
      setError('Could not retrieve document from storage.');
    }
  }, [id]);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex flex-col p-4 pt-20 md:p-6 md:pt-24 gap-6">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <Button asChild variant="ghost">
              <Link href="/documents">
                <ArrowLeft className="mr-2" />
                Back to Documents
              </Link>
            </Button>
            {document && (
                <h1 className="text-2xl font-bold font-headline mt-2 ml-4">
                    {document.name}
                </h1>
            )}
          </div>
          {document && (
            <Button asChild variant="outline">
              <a href={document.content} target="_blank" rel="noopener noreferrer">
                Open in New Tab
                <ExternalLink className="ml-2" />
              </a>
            </Button>
          )}
        </div>

        <Card className="flex-1 container mx-auto p-0 border-border overflow-hidden">
          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive text-lg">{error}</p>
            </div>
          )}
          {document ? (
            <embed
              src={document.content}
              type="application/pdf"
              width="100%"
              height="100%"
            />
          ) : (
            !error && <div className="flex items-center justify-center h-full"><p>Loading document...</p></div>
          )}
        </Card>
      </main>
    </div>
  );
}
