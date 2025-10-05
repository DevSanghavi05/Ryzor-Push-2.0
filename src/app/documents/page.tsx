'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle, Search, Loader } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { useRouter } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { useUser } from '@/firebase/auth/use-user';
import { gapi } from 'gapi-script';

type Document = {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
};

function DocumentsPage() {
  const { accessToken } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) return;

    const initClient = () => {
      gapi.client.init({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      }).then(() => {
        gapi.auth.setToken({ access_token: accessToken });
        fetchFiles();
      });
    };

    const fetchFiles = () => {
        gapi.client.drive.files.list({
          'pageSize': 20,
          'fields': "nextPageToken, files(id, name, mimeType, modifiedTime)"
        }).then((response: any) => {
          const files = response.result.files as any[];
          const formattedFiles = files.map(file => ({
            id: file.id,
            name: file.name,
            modifiedTime: file.modifiedTime,
            mimeType: file.mimeType,
          }));
          setDocuments(formattedFiles);
          setLoading(false);
        }).catch((error: any) => {
            console.error("Error fetching files: ", error);
            setLoading(false);
        });
    }

    gapi.load('client:auth2', initClient);

  }, [accessToken]);


  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileType = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('document')) return 'Google Doc';
    if (mimeType.includes('spreadsheet')) return 'Google Sheet';
    if (mimeType.includes('presentation')) return 'Google Slides';
    return 'File';
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 p-4 pt-20 md:p-6 md:pt-24">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              My Google Drive
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
          {loading ? (
             <div className="flex items-center justify-center text-center py-24 border-2 border-dashed border-border rounded-lg">
                <Loader className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">
                    Fetching Files...
                </h2>
                <p className="text-muted-foreground">Please wait while we connect to your Google Drive.</p>
             </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date Modified</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDocuments.map((doc) => (
                             <TableRow key={doc.id} className="hover:bg-accent/50 cursor-pointer" onClick={() => console.log(`Navigating to doc ${doc.id}`)}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3 group">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="truncate group-hover:underline">{doc.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{getFileType(doc.mimeType)}</TableCell>
                                <TableCell className="text-muted-foreground">{new Date(doc.modifiedTime).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 border-2 border-dashed border-border rounded-lg">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">
                  {searchQuery ? 'No Results Found' : 'No Documents Found'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchQuery 
                    ? `Your search for "${searchQuery}" did not return any documents.`
                    : 'We couldn’t find any documents in your Google Drive.'
                  }
                </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(DocumentsPage);
