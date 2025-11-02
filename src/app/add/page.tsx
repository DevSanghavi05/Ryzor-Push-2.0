
'use client';

import { useState, useEffect, useRef, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText, Sheet, Presentation, UploadCloud,
  FolderUp, ChevronRight, Cloud, FileUp as FileUpIcon, Loader2, CheckCircle2, X, AlertTriangle
} from 'lucide-react';
import withAuth from '@/firebase/auth/with-auth';
import { useUser, AccountType } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateDocumentName } from '@/ai/flows/generate-doc-name-flow';
import { extractPdfText } from '@/ai/flows/extract-pdf-text-flow';
import { Progress } from '@/components/ui/progress';
import { nanoid } from 'nanoid';


function AddDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, personalProvider, workProvider } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const sources: Source[] = useMemo(() => {
    const available: Source[] = [];
    
    available.push(
      { name: 'Upload Files', icon: <UploadCloud className="w-6 h-6 text-purple-500" />, description: 'Upload one or more PDF files.', action: 'upload' },
      { name: 'Sync Google Drive', icon: <Cloud className="w-6 h-6 text-sky-500" />, description: 'Sync and import your Drive files.', action: 'sync-drive' }
    );
      
    // Add create links if any google account is connected
    if (personalProvider === 'google' || workProvider === 'google') {
       available.unshift(
        { name: 'Google Docs', icon: <FileText className="w-6 h-6 text-blue-500" />, description: 'Create a new Google Doc.', action: 'create', url: 'https://docs.google.com/document/create', provider: 'google' },
        { name: 'Google Sheets', icon: <Sheet className="w-6 h-6 text-green-500" />, description: 'Create a new Google Sheet.', action: 'create', url: 'https://docs.google.com/spreadsheets/create', provider: 'google' },
        { name: 'Google Slides', icon: <Presentation className="w-6 h-6 text-yellow-500" />, description: 'Create a new Google Slide deck.', action: 'create', url: 'https://docs.google.com/presentation/create', provider: 'google' },
      );
    }
    
    return available;
  }, [personalProvider, workProvider]);

  const handleSourceClick = (source: Source) => {
    if (source.action === 'upload') fileInputRef.current?.click();
    else if (source.action === 'upload-folder') folderInputRef.current?.click();
    else if (source.action === 'create' && source.url) window.open(source.url, '_blank');
    else if (source.action === 'sync-drive') router.push('/documents');
  };

  const handleDragEvent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleFilesSelected = (selectedFiles: FileList) => {
      const pdfs = Array.from(selectedFiles).filter(file => file.type === 'application/pdf');
      if (pdfs.length !== selectedFiles.length) {
          toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Only PDF files are currently supported for direct upload.' });
      }
      setFilesToUpload(current => [...current, ...pdfs]);
  };
  
  const removeFile = (index: number) => {
    setFilesToUpload(current => current.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (!user || filesToUpload.length === 0) return;
    setIsUploading(true);
    setIsComplete(false);
    
    const totalFiles = filesToUpload.length;
    let filesProcessed = 0;
    
    const docsKey = `documents_${user.uid}`;
    const existingDocuments = JSON.parse(localStorage.getItem(docsKey) || '[]');

    for (const file of filesToUpload) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const dataURI = `data:${file.type};base64,${base64}`;

            // Use the AI flow for text extraction
            const { text: textContent } = await extractPdfText({ pdfDataUri: dataURI });

            const { name: aiName } = await generateDocumentName({ textContent });
            
            const newDoc = {
                id: nanoid(),
                name: aiName || file.name,
                uploaded: new Date().toISOString(),
                source: 'local',
                mimeType: file.type,
                accountType: 'personal' as AccountType, // Assume local uploads are personal
                isImported: true, // Local files are always "imported"
            };
            
            // Store metadata in the main list
            existingDocuments.unshift(newDoc);

            // Store extracted text content separately
            localStorage.setItem(`document_content_${newDoc.id}`, textContent);

        } catch (error: any) {
            toast({ variant: 'destructive', title: `Failed to process ${file.name}`, description: error.message });
        } finally {
            filesProcessed++;
            setUploadProgress((filesProcessed / totalFiles) * 100);
        }
    }

    localStorage.setItem(docsKey, JSON.stringify(existingDocuments));
    
    setIsUploading(false);
    setIsComplete(true);
    toast({ title: 'Upload Complete', description: `${filesProcessed} file(s) have been added.` });
    
    setTimeout(() => {
        router.push('/documents');
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline">Add or Sync Documents</h1>
          <p className="text-muted-foreground mt-2">Create new documents, sync from the cloud, or upload from your device.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
                <CardContent className="p-4">
                    <h2 className="text-lg font-semibold p-2">Sources</h2>
                    <ul className="divide-y divide-border">
                    {sources.map(src => (
                        <li key={src.name} className="group hover:bg-accent/50 transition-colors rounded-md">
                        <button
                            className="flex items-center w-full text-left p-4"
                            onClick={() => handleSourceClick(src)}
                        >
                            <div className="flex items-center gap-4 flex-1">
                            {src.icon}
                            <div className="flex-1">
                                <p className="font-medium">{src.name}</p>
                                <p className="text-sm text-muted-foreground">{src.description}</p>
                            </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground ml-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        </li>
                    ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="flex flex-col" onDragEnter={handleDragEvent}>
                <CardContent className="p-4 flex-1 flex flex-col">
                    <h2 className="text-lg font-semibold p-2">Local Upload</h2>
                     <div 
                        className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
                        onDragLeave={handleDragEvent} onDragOver={handleDragEvent} onDrop={handleDrop}
                     >
                       <input ref={fileInputRef} type="file" multiple accept="application/pdf" className="hidden" onChange={handleFileInputChange} />
                        {filesToUpload.length === 0 ? (
                           <>
                             <FileUpIcon className="w-12 h-12 text-muted-foreground mb-4" />
                             <p className="text-muted-foreground text-center">Drag & drop PDFs here, or</p>
                             <Button variant="link" onClick={() => fileInputRef.current?.click()}>Browse files</Button>
                           </>
                        ) : (
                           <div className="w-full space-y-2">
                               <h3 className="font-medium">Ready to upload:</h3>
                               <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                   {filesToUpload.map((file, i) => (
                                       <li key={i} className="flex items-center text-sm bg-background p-2 rounded-md">
                                           <FileText className="h-4 w-4 mr-2 shrink-0" />
                                           <span className="truncate flex-1">{file.name}</span>
                                           <button onClick={() => removeFile(i)} className="ml-2 p-1 hover:bg-destructive/20 rounded-full"><X className="h-3 w-3"/></button>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                        )}
                    </div>
                     <div className="pt-4">
                        {isUploading || isComplete ? (
                            <div className='flex flex-col items-center gap-2'>
                                <Progress value={uploadProgress} className="h-2 w-full" />
                                <p className="text-sm text-muted-foreground">
                                    {isUploading ? `Uploading ${filesToUpload.length} file(s)...` : 'Upload complete! Redirecting...'}
                                </p>
                            </div>
                        ) : (
                            <Button onClick={handleUpload} disabled={filesToUpload.length === 0} className="w-full">
                                {`Upload ${filesToUpload.length} File(s)`}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        
      </div>
    </div>
  );
}

export default withAuth(AddDocumentPage);
    
