
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Sheet, Presentation, UploadCloud, FolderUp, ChevronRight, Calendar } from 'lucide-react';
import withAuth from '@/firebase/auth/with-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRef, useEffect } from 'react';
import { useUser } from '@/firebase';
import * as pdfjs from 'pdfjs-dist';

type Source = {
  name: string;
  icon: React.ReactNode;
  description: string;
  action: 'create' | 'upload' | 'upload-folder';
  url?: string;
};

const sources: Source[] = [
  { name: 'Google Docs', icon: <FileText className="w-6 h-6 text-blue-500" />, description: 'Create a new document in Google Docs.', action: 'create', url: 'https://docs.google.com/document/create' },
  { name: 'Google Sheets', icon: <Sheet className="w-6 h-6 text-green-500" />, description: 'Create a new spreadsheet for data analysis.', action: 'create', url: 'https://docs.google.com/spreadsheets/create' },
  { name: 'Google Slides', icon: <Presentation className="w-6 h-6 text-yellow-500" />, description: 'Create a new presentation or slide deck.', action: 'create', url: 'https://docs.google.com/presentation/create' },
  { name: 'Google Calendar', icon: <Calendar className="w-6 h-6 text-cyan-500" />, description: 'Connect to your Google Calendar.', action: 'create', url: 'https://calendar.google.com' },
  { name: 'Upload File', icon: <UploadCloud className="w-6 h-6 text-purple-500" />, description: 'Upload a single PDF file from your computer.', action: 'upload' },
  { name: 'Upload Folder', icon: <FolderUp className="w-6 h-6 text-orange-500" />, description: 'Upload all PDFs from a selected folder.', action: 'upload-folder' },
];

function AddDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

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
            textContent: textContent, // Standardize on textContent
          };
          
          const viewableContent = e.target?.result;

          if (!viewableContent) {
            reject(new Error('Could not read file content.'));
            return;
          }

          const storageKey = `documents_${user.uid}`;
          const existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          const contentKey = `document_content_${docId}`;
          localStorage.setItem(contentKey, viewableContent as string);

          localStorage.setItem(storageKey, JSON.stringify([docForList, ...existingDocuments]));
          resolve();
        } catch (error) {
          console.error("Error processing file:", error);
          reject(new Error(`Could not process the file ${fileToSave.name}.`));
        }
      };
      fileReader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error(`Could not read the file ${fileToSave.name}.`));
      };
      // For PDFs, we need to read the raw data for pdf.js, not a data URL
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
    <div className="relative min-h-screen w-full">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 pt-16">
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
