'use client';

import { processPdf } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, LoaderCircle, X, File as FileIcon } from 'lucide-react';
import { useCallback, useRef, useState, useTransition, useActionState } from 'react';
import { useFormStatus } from 'react-dom';

const initialState = {
  error: null as string | null,
};

function SubmitButton({ hasFile }: { hasFile: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button size="lg" type="submit" disabled={!hasFile || pending} className="w-full md:w-auto">
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Process PDF'
      )}
    </Button>
  );
}

export function UploadForm() {
  const [formState, formAction] = useActionState(processPdf, initialState);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        if (formState.error) formState.error = null;
      } else {
        formState.error = "Invalid file type. Please upload a PDF.";
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
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  return (
    <Card className="w-full max-w-xl mx-auto bg-card/50 border-dashed border-2 border-border hover:border-primary transition-all duration-300">
      <CardContent className="p-4 md:p-6">
        <form action={formAction} className="space-y-6" onDragEnter={handleDrag}>
          <input
            ref={fileInputRef}
            type="file"
            name="pdf"
            accept="application/pdf"
            className="hidden"
            onChange={handleInputChange}
          />
          {!file ? (
            <label
              htmlFor="pdf"
              className={`flex flex-col items-center justify-center w-full h-48 rounded-lg cursor-pointer transition-colors ${
                dragActive ? 'bg-primary/10' : ''
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF only (max 10MB)</p>
              </div>
            </label>
          ) : (
             <div className="w-full h-48 rounded-lg bg-primary/5 flex flex-col items-center justify-center">
                <div className="flex items-center p-4 bg-background rounded-lg shadow-inner border max-w-md">
                    <FileIcon className="h-8 w-8 text-primary/80" />
                    <span className="ml-4 text-sm font-medium text-foreground truncate">{file.name}</span>
                    <Button variant="ghost" size="icon" className="ml-4" onClick={clearFile}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <SubmitButton hasFile={!!file} />
            {formState.error && (
              <p className="text-sm text-destructive">{formState.error}</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
