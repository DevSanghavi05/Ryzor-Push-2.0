
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Sheet, Presentation, UploadCloud } from 'lucide-react';
import withAuth from '@/firebase/auth/with-auth';

function AddDocumentPage() {
  const sources = [
    { name: 'Google Docs', icon: <FileText className="w-8 h-8 text-blue-500" />, description: 'Sync documents from your Google Drive.' },
    { name: 'Google Sheets', icon: <Sheet className="w-8 h-8 text-green-500" />, description: 'Connect spreadsheets for data analysis.' },
    { name: 'Google Slides', icon: <Presentation className="w-8 h-8 text-yellow-500" />, description: 'Import presentations and slide decks.' },
    { name: 'Upload File', icon: <UploadCloud className="w-8 h-8 text-purple-500" />, description: 'Upload PDF files from your computer.' },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Add a New Source</h1>
        <p className="text-muted-foreground mt-2">Connect your accounts or upload files to get started.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {sources.map(source => (
          <Card key={source.name} className="flex flex-col">
            <CardHeader className="flex flex-col items-center text-center">
              {source.icon}
              <CardTitle className="mt-4">{source.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col text-center">
              <CardDescription className="flex-1">{source.description}</CardDescription>
              <Button className="mt-6 w-full">Connect</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AddDocumentPage);
