
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Sheet, Presentation, UploadCloud, FolderUp } from 'lucide-react';
import withAuth from '@/firebase/auth/with-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

type Source = {
  name: string;
  icon: React.ReactNode;
  description: string;
  action: 'create' | 'upload' | 'upload-folder';
  url?: string;
};

const sources: Source[] = [
  { name: 'Google Docs', icon: <FileText className="w-8 h-8 text-blue-500" />, description: 'Create a new document in Google Docs.', action: 'create', url: 'https://docs.google.com/document/create' },
  { name: 'Google Sheets', icon: <Sheet className="w-8 h-8 text-green-500" />, description: 'Create a new spreadsheet for data analysis.', action: 'create', url: 'https://docs.google.com/spreadsheets/create' },
  { name: 'Google Slides', icon: <Presentation className="w-8 h-8 text-yellow-500" />, description: 'Create a new presentation or slide deck.', action: 'create', url: 'https://docs.google.com/presentation/create' },
  { name: 'Upload File', icon: <UploadCloud className="w-8 h-8 text-purple-500" />, description: 'Upload a single PDF file from your computer.', action: 'upload' },
  { name: 'Upload Folder', icon: <FolderUp className="w-8 h-8 text-orange-500" />, description: 'Upload all PDFs from a selected folder.', action: 'upload-folder' },
];

function AddDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSave = (fileToSave: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDocument = {
          id: new Date().toISOString() + Math.random(),
          name: fileToSave.name,
          uploaded: new Date().toISOString(),
          content: e.target?.result,
        };
        const existingDocuments = JSON.parse(localStorage.getItem('documents') || '[]');
        localStorage.setItem('documents', JSON.stringify([newDocument, ...existingDocuments]));
        resolve();
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error(`Could not read the file ${fileToSave.name}.`));
      };
      reader.readAsDataURL(fileToSave);
    });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        try {
            await handleFileSave(file);
            toast({
                title: "Upload Successful",
                description: `${file.name} has been added to your documents.`,
            })
            router.push('/documents');
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: "Upload Failed",
                description: error.message,
            })
        }
      } else {
        toast({
          variant: 'destructive',
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
        });
      }
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            toast({
                variant: 'destructive',
                title: "No PDF Files Found",
                description: "The selected folder does not contain any PDF files.",
            });
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        await Promise.all(pdfFiles.map(file => 
            handleFileSave(file)
                .then(() => successCount++)
                .catch((error) => {
                    console.error(`Failed to save ${file.name}:`, error);
                    errorCount++;
                })
        ));

        if (successCount > 0) {
            toast({
                title: "Folder Upload Complete",
                description: `${successCount} PDF(s) have been added to your documents. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
            });
            router.push('/documents');
        } else {
            toast({
                variant: 'destructive',
                title: "Upload Failed",
                description: `Could not upload any PDFs from the selected folder.`,
            });
        }
    }
  };
  
  const handleConnect = (source: Source) => {
    if (source.action === 'upload') {
      fileInputRef.current?.click();
    } else if (source.action === 'upload-folder') {
      folderInputRef.current?.click();
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
       <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        accept="application/pdf"
        className="hidden"
        webkitdirectory="true"
        multiple
      />
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Add a New Source</h1>
        <p className="text-muted-foreground mt-2">Create a new document or upload existing files to get started.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
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
