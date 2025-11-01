'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

type LocalDocument = {
    id: string;
    name: string;
    // The main document list doesn't need the full content, so it's optional here
    content?: string; 
    uploaded: string;
}

// This function is required for Next.js static export. It tells Next.js there are
// no paths to pre-render at build time. Pages will be rendered on the client-side.
export async function generateStaticParams() {
  return [];
}

export default function DocumentPage() {
    const params = useParams();
    const { user } = useUser();
    const id = params.id as string;
    const [doc, setDoc] = useState<LocalDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);

    useEffect(() => {
        if (id && user) {
            setLoading(true);
            const storageKey = `documents_${user.uid}`;
            const contentKey = `document_content_${id}`;

            const existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const foundDocMeta = existingDocuments.find((d: any) => d.id === id);
            
            if (foundDocMeta) {
                setDoc(foundDocMeta);
                // Now, fetch the separately stored content for viewing
                const storedContent = localStorage.getItem(contentKey);

                if (storedContent) {
                    if (storedContent.startsWith('data:application/pdf') || storedContent.startsWith('data:text/plain')) {
                        // It's a data URL, safe for iframe
                        setIframeSrc(storedContent);
                    } else {
                        // This case should be rare now, but handle legacy raw text
                        const blob = new Blob([storedContent], { type: 'text/plain' });
                        setIframeSrc(URL.createObjectURL(blob));
                    }
                }
            }
            setLoading(false);
        } else if (!user) {
            // Wait for user to be available
            setLoading(true);
        }
    }, [id, user]);

  return (
    <div className="flex flex-col min-h-dvh bg-background relative pt-16">
        <div className="bg-aurora"></div>
        <main className="flex-1 flex flex-col p-4 md:p-6 gap-6 relative">
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
                ) : iframeSrc ? (
                    <iframe src={iframeSrc} className="w-full h-[70vh] border rounded-lg bg-white" title={doc?.name}></iframe>
                ) : (
                    <p>Document content could not be loaded or found.</p>
                )}
            </div>
            </div>
        </main>
    </div>
  );
}
