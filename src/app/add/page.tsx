
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Sheet, Presentation, UploadCloud } from 'lucide-react';
import withAuth from '@/firebase/auth/with-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

type Source = {
  name: string;
  icon: React.ReactNode;
  description: string;
  action: 'create' | 'upload';
  url?: string;
};

const sources: Source[] = [
  { name: 'Google Docs', icon: <FileText className="w-8 h-8 text-blue-500" />, description: 'Create a new document in Google Docs.', action: 'create', url: 'https://docs.google.com/document/create' },
  { name: 'Google Sheets', icon: <Sheet className="w-8 h-8 text-green-500" />, description: 'Create a new spreadsheet for data analysis.', action: 'create', url: 'https://docs.google.com/spreadsheets/create' },
  { name: 'Google Slides', icon: <Presentation className="w-8 h-8 text-yellow-500" />, description: 'Create a new presentation or slide deck.', action: 'create', url: 'https://docs.google.com/presentation/create' },
  { name: 'Upload File', icon: <UploadCloud className="w-8 h-8 text-purple-500" />, description: 'Upload PDF files from your computer.', action: 'upload' },
];

function AddDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSave = (fileToSave: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newDocument = {
        id: new Date().toISOString(),
        name: fileToSave.name,
        uploaded: new Date().toISOString(),
        content: e.target?.result,
      };
      const existingDocuments = JSON.parse(localStorage.getItem('documents') || '[]');
      localStorage.setItem('documents', JSON.stringify([newDocument, ...existingDocuments]));
      
      toast({
          title: "Upload Successful",
          description: `${fileToSave.name} has been added to your documents.`,
      })
      router.push('/documents');
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: "Upload Failed",
            description: `Could not read the file ${fileToSave.name}.`,
        })
    }
    reader.readAsDataURL(fileToSave);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        handleFileSave(file);
      } else {
        toast({
          variant: 'destructive',
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
        });
      }
    }
  };
  
  const handleConnect = (source: Source) => {
    if (source.action === 'upload') {
      fileInputRef.current?.click();
    } else if (source.action === 'create' && source.url) {
      window.open(source.url, '_blank');
    }
  };

  return (
    <div className="container mx-auto py-12">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Add a New Source</h1>
        <p className="text-muted-foreground mt-2">Create a new document or upload an existing file to get started.</p>
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
              <Button className="mt-6 w-full" onClick={() => handleConnect(source)}>Connect</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AddDocumentPage);
