
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, X, File as FileIcon, CheckCircle2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function UploadForm({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

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
      
      setIsUploading(false);
      setIsSuccess(true);
    };
    reader.readAsDataURL(fileToSave);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isUploading && file) {
      const startTime = Date.now();
      const duration = 1000;
      const updateProgress = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min((elapsedTime / duration) * 100, 100);
        setUploadProgress(progress);
        if (progress < 100) {
          requestAnimationFrame(updateProgress);
        } else {
            handleFileSave(file);
        }
      };
      requestAnimationFrame(updateProgress);
    }

    if(isSuccess) {
        timer = setTimeout(() => {
            onOpenChange(false);
            toast({
                title: "Upload Successful",
                description: `${file?.name} has been added to your documents.`,
            })
            router.push('/documents');
        }, 1500);
    }

    return () => clearTimeout(timer);
  }, [isUploading, isSuccess, router, file, onOpenChange, toast]);

  const handleFileChange = (selectedFile: File | null) => {
    setErrorMessage(null);
    setIsSuccess(false);
    setUploadProgress(0);
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        setErrorMessage("Invalid file type. Please upload a PDF.");
        setFile(null);
      }
    } else {
      setFile(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    setIsSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
  }

  const resetState = () => {
    setFile(null);
    setDragActive(false);
    setIsUploading(false);
    setUploadProgress(0);
    setIsSuccess(false);
    setErrorMessage(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF file to start asking questions about it.
          </DialogDescription>
        </DialogHeader>
        <Card className="w-full border-dashed border-2 border-border hover:border-primary transition-all duration-300 shadow-none">
            <CardContent className="p-0">
                <form onSubmit={handleSubmit} className="space-y-6" onDragEnter={handleDrag}>
                <input
                    ref={fileInputRef}
                    type="file"
                    name="pdf"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleInputChange}
                    disabled={isUploading || isSuccess}
                />
                {!file ? (
                    <div
                    className={`flex flex-col items-center justify-center w-full h-48 rounded-lg cursor-pointer transition-colors ${
                        dragActive ? 'bg-primary/10' : ''
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                    >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF only</p>
                    </div>
                    </div>
                ) : (
                    <div className="w-full h-48 rounded-lg bg-primary/5 flex flex-col items-center justify-center">
                        <div className="flex items-center p-4 bg-background rounded-lg shadow-inner border max-w-sm w-full">
                            <FileIcon className="h-8 w-8 text-primary/80" />
                            <span className="ml-4 text-sm font-medium text-foreground truncate flex-1">{file.name}</span>
                            <Button variant="ghost" size="icon" className="ml-4" onClick={clearFile} type="button" disabled={isUploading || isSuccess}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-4 px-6 pb-6">
                    { isUploading || (isSuccess && uploadProgress === 100) ? (
                        <Progress value={uploadProgress} className="w-full h-2 transition-all" />
                    ) : (
                        <Button size="lg" type="submit" disabled={!file || isUploading || isSuccess} className="w-full">
                            Upload PDF
                        </Button>
                    )}

                    {isSuccess && (
                        <div className='flex items-center text-primary text-sm'>
                            <CheckCircle2 className='mr-2' />
                            <p>Upload successful! Redirecting...</p>
                        </div>
                    )}

                    {errorMessage && (
                    <p className="text-sm text-destructive">{errorMessage}</p>
                    )}
                </div>
                </form>
            </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
