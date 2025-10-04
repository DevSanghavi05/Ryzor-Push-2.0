'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function DocumentPage() {
    const params = useParams();
    const id = params.id as string;

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex flex-col p-4 pt-20 md:p-6 md:pt-24 gap-6">
        <div className="container mx-auto">
          <div>
            <Button asChild variant="ghost">
              <Link href="/documents">
                <ArrowLeft className="mr-2" />
                Back to Documents
              </Link>
            </Button>
            <h1 className="text-2xl font-bold font-headline mt-2 ml-4">
                Document {id}
            </h1>
          </div>
          <div className="flex-1 flex items-center justify-center mt-8">
            <p>Document content will be displayed here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
