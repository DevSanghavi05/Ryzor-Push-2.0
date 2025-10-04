'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, X, File as FileIcon, CheckCircle2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleFileSave = (fileToSave: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newDocument = {
        id: new Date().toISOString(),
        name: fileToSave.name,
        uploaded: new Date().toISOString(),
        content: e.target?.result, // This will be the data URI
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
      const duration = 1000; // 1 second upload simulation
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
            router.push('/documents');
        }, 1500);
    }

    return () => clearTimeout(timer);
  }, [isUploading, isSuccess, router, file]);

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

  return (
    <Card className="w-full max-w-xl mx-auto bg-card/50 border-dashed border-2 border-border hover:border-primary transition-all duration-300">
      <CardContent className="p-4 md:p-6">
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
                <div className="flex items-center p-4 bg-background rounded-lg shadow-inner border max-w-md">
                    <FileIcon className="h-8 w-8 text-primary/80" />
                    <span className="ml-4 text-sm font-medium text-foreground truncate">{file.name}</span>
                    <Button variant="ghost" size="icon" className="ml-4" onClick={clearFile} type="button" disabled={isUploading || isSuccess}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
             { isUploading || (isSuccess && uploadProgress === 100) ? (
                <Progress value={uploadProgress} className="w-full h-6 transition-all" />
             ) : (
                <Button size="lg" type="submit" disabled={!file || isUploading || isSuccess} className="w-full md:w-auto">
                    Upload PDF
                </Button>
            )}

            {isSuccess && (
                <div className='flex items-center text-primary'>
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
  );
}
