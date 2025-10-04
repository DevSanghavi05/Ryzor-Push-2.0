'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

type Document = {
  id: string;
  name: string;
  uploaded: string;
  content: string; // Add content to the type
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // This code now runs only on the client, preventing build errors.
    const storedDocuments = JSON.parse(localStorage.getItem('documents') || '[]');
    setDocuments(storedDocuments);
  }, []);

  useEffect(() => {
    const results = documents.filter(doc =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocuments(results);
  }, [searchQuery, documents]);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 p-4 pt-20 md:p-6 md:pt-24">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              My Documents
            </h1>
            <div className="flex w-full md:w-auto items-center gap-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        type="search"
                        placeholder="Search documents..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button asChild>
                    <Link href="/">
                        <PlusCircle className="mr-2" />
                        Upload New
                    </Link>
                </Button>
            </div>
          </div>

          {filteredDocuments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:border-primary/50 hover:shadow-lg transition-all">
                    <div className="block h-full">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <FileText className="w-8 h-8 text-primary" />
                        <CardTitle className="text-lg truncate">{doc.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Uploaded: {new Date(doc.uploaded).toLocaleDateString()}
                        </p>
                        </CardContent>
                    </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 border-2 border-dashed border-border rounded-lg">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">
                  {searchQuery ? 'No Results Found' : 'No Documents Yet'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchQuery 
                    ? `Your search for "${searchQuery}" did not return any documents.`
                    : 'Click the button below to upload your first document.'
                  }
                </p>
                {!searchQuery && (
                  <Button asChild>
                      <Link href="/">
                          <PlusCircle className="mr-2" />
                          Upload Document
                      </Link>
                  </Button>
                )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
