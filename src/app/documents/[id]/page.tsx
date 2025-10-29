
'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

type LocalDocument = {
    id: string;
    name: string;
    content: string; // This is now retrieved from its separate storage
    uploaded: string;
}

export default function DocumentPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const id = params.id as string;
    const [doc, setDoc] = useState<LocalDocument | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id && user) {
            const storageKey = `documents_${user.uid}`;
            const contentKey = `document_content_${id}`;

            const existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const foundDocMeta = existingDocuments.find((d: any) => d.id === id);
            
            const content = localStorage.getItem(contentKey);

            if (foundDocMeta && content) {
                setDoc({ ...foundDocMeta, content });
            }
            setLoading(false);
        } else if (!user) {
            // Wait for user to be available
            setLoading(true);
        }
    }, [id, user]);

  return (
    <div className="flex flex-col min-h-dvh bg-background relative">
        <div className="bg-aurora"></div>
        <main className="flex-1 flex flex-col p-4 md:p-6 gap-6 relative pt-16">
            <div className="container mx-auto">
            <div>
                <Button asChild variant="ghost">
                <Link href="/documents">
                    <ArrowLeft className="mr-2" />
                    Back to Documents
                </Link>
                </Button>
                <h1 className="text-2xl font-bold font-headline mt-2 ml-4">
                    {loading ? "Loading..." : doc?.name || "Document not found"}
                </h1>
            </div>
            <div className="flex-1 flex items-center justify-center mt-8">
                {loading ? (
                    <Loader className="animate-spin" />
                ) : doc ? (
                    <iframe src={doc.content} className="w-full h-[70vh] border rounded-lg" title={doc.name}></iframe>
                ) : (
                    <p>Document content could not be loaded or found.</p>
                )}
            </div>
            </div>
        </main>
    </div>
  );
}
