
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Sheet, Presentation, UploadCloud, FolderUp, ChevronRight, Calendar, File as FileIcon } from 'lucide-react';
import withAuth from '@/firebase/auth/with-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRef, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase';
import * as pdfjs from 'pdfjs-dist';

type Source = {
  name: string;
  icon: React.ReactNode;
  description: string;
  action: 'create' | 'upload' | 'upload-folder';
  url?: string;
  provider?: 'google';
};

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

function AddDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { user, personalProvider, workProvider } = useUser();

  // Dynamically generate sources based on connected providers
  const sources: Source[] = useMemo(() => {
    const availableSources: Source[] = [];
    const connectedProviders = new Set([personalProvider, workProvider].filter(Boolean));

    if (connectedProviders.has('google')) {
        availableSources.push(
            { name: 'Google Docs', icon: <FileText className="w-6 h-6 text-blue-500" />, description: 'Create a new document in Google Docs.', action: 'create', url: 'https://docs.google.com/document/create', provider: 'google' },
            { name: 'Google Sheets', icon: <Sheet className="w-6 h-6 text-green-500" />, description: 'Create a new spreadsheet for data analysis.', action: 'create', url: 'https://docs.google.com/spreadsheets/create', provider: 'google' },
            { name: 'Google Slides', icon: <Presentation className="w-6 h-6 text-yellow-500" />, description: 'Create a new presentation or slide deck.', action: 'create', url: 'https://docs.google.com/presentation/create', provider: 'google' },
            { name: 'Google Calendar', icon: <Calendar className="w-6 h-6 text-cyan-500" />, description: 'Connect to your Google Calendar.', action: 'create', url: 'https://calendar.google.com', provider: 'google' },
        );
    }
    
    // Always include local upload options
    availableSources.push(
        { name: 'Upload File', icon: <UploadCloud className="w-6 h-6 text-purple-500" />, description: 'Upload a single PDF file from your computer.', action: 'upload' },
        { name: 'Upload Folder', icon: <FolderUp className="w-6 h-6 text-orange-500" />, description: 'Upload all PDFs from a selected folder.', action: 'upload-folder' }
    );
    
    return availableSources;

  }, [personalProvider, workProvider]);


  // We need to set the workerSrc for pdfjs-dist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
    }
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return textContent;
  };

  const handleFileSave = (fileToSave: File) => {
    return new Promise<void>((resolve, reject) => {
      if (!user) {
        reject(new Error("User not authenticated."));
        return;
      }
      
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const textContent = await extractTextFromPdf(fileToSave);
          const docId = new Date().toISOString() + Math.random();

          const docForList = {
            id: docId,
            name: fileToSave.name,
            uploaded: new Date().toISOString(),
            textContent: textContent,
            source: 'local',
            mimeType: 'application/pdf',
            accountType: 'personal',
          };
          
          const viewableContent = e.target?.result;

          if (!viewableContent) {
            reject(new Error('Could not read file content.'));
            return;
          }

          const storageKey = `documents_${user.uid}`;
          const existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          const contentKey = `document_content_${docId}`;
          
          // pdfjs needs an ArrayBuffer, but the iframe needs a Data URL.
          // Let's create the data URL from the ArrayBuffer we already read.
          const blob = new Blob([viewableContent], { type: 'application/pdf' });
          const dataUrl = URL.createObjectURL(blob);
          
          // It's better to store the data URL for the iframe, but we can't do that synchronously with createObjectURL.
          // A better approach is to store the array buffer itself and convert it to a data URL when needed.
          // For simplicity here, we'll re-read it. A cleaner implementation would pass around the ArrayBuffer.
           const dataUrlReader = new FileReader();
           dataUrlReader.onload = (event) => {
                localStorage.setItem(contentKey, event.target!.result as string);
                localStorage.setItem(storageKey, JSON.stringify([docForList, ...existingDocuments]));
                resolve();
           }
           dataUrlReader.onerror = (error) => reject(error);
           dataUrlReader.readAsDataURL(fileToSave);


        } catch (error) {
          console.error("Error processing file:", error);
          reject(new Error(`Could not process the file ${fileToSave.name}.`));
        }
      };
      fileReader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error(`Could not read the file ${fileToSave.name}.`));
      };
      fileReader.readAsArrayBuffer(fileToSave); 
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
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12">
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

        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {sources.map(source => (
                <li key={source.name} className="group hover:bg-accent/50 transition-colors">
                  <button
                    className="flex items-center w-full text-left p-4"
                    onClick={() => handleConnect(source)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {source.icon}
                      <div className="flex-1">
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">{source.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-4 transform transition-transform group-hover:translate-x-1" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(AddDocumentPage);


    
