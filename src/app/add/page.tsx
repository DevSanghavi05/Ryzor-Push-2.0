'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText, Sheet, Presentation, UploadCloud,
  FolderUp, ChevronRight, Calendar, File as FileIcon, Cloud
} from 'lucide-react';
import withAuth from '@/firebase/auth/with-auth';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import * as pdfjs from 'pdfjs-dist';
import { generateDocumentName } from '@/ai/flows/generate-doc-name-flow';

type Source = {
  name: string;
  icon: React.ReactNode;
  description: string;
  action: 'create' | 'upload' | 'upload-folder' | 'sync-drive';
  url?: string;
  provider?: 'google';
};

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function AddDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, personalProvider, workProvider } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);

  // Configure pdf.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
    }
  }, []);

  /** Initialize Google API client dynamically */
  const initGapiClient = async () => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') return reject();
      if ((window as any).gapi?.client) return resolve();

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client', async () => {
          try {
            await (window as any).gapi.client.init({
              apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      };
      document.body.appendChild(script);
    });
  };

  /** Fetch user Drive files */
  const syncGoogleDrive = async () => {
    try {
      setLoadingDrive(true);
      toast({ title: 'Syncing Drive...', description: 'Fetching files from your Google Drive.' });
      await initGapiClient();

      // Attach auth token from Firebase Google user
      const token = (await user?.getIdTokenResult())?.claims?.oauthAccessToken;
      const gapi = (window as any).gapi;
      gapi.client.setToken({ access_token: token });

      const res = await gapi.client.drive.files.list({
        pageSize: 20,
        fields: 'files(id, name, mimeType, modifiedTime)',
        q: "mimeType='application/pdf' or mimeType contains 'document'"
      });

      const files = res.result.files as DriveFile[];
      setDriveFiles(files);
      toast({ title: 'Drive Synced', description: `${files.length} file(s) retrieved.` });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Drive Sync Failed',
        description: 'Unable to fetch Google Drive files.'
      });
    } finally {
      setLoadingDrive(false);
    }
  };

  const sources: Source[] = useMemo(() => {
    const available: Source[] = [];
    const connected = new Set([personalProvider, workProvider].filter(Boolean));

    if (connected.has('google')) {
      available.push(
        { name: 'Google Docs', icon: <FileText className="w-6 h-6 text-blue-500" />, description: 'Create a new Google Doc.', action: 'create', url: 'https://docs.google.com/document/create', provider: 'google' },
        { name: 'Google Sheets', icon: <Sheet className="w-6 h-6 text-green-500" />, description: 'Create a new Google Sheet.', action: 'create', url: 'https://docs.google.com/spreadsheets/create', provider: 'google' },
        { name: 'Google Slides', icon: <Presentation className="w-6 h-6 text-yellow-500" />, description: 'Create a new Google Slide deck.', action: 'create', url: 'https://docs.google.com/presentation/create', provider: 'google' },
        { name: 'Sync Google Drive', icon: <Cloud className="w-6 h-6 text-sky-500" />, description: 'Fetch and view your Drive files.', action: 'sync-drive', provider: 'google' }
      );
    }

    available.push(
      { name: 'Upload File', icon: <UploadCloud className="w-6 h-6 text-purple-500" />, description: 'Upload a single PDF file.', action: 'upload' },
      { name: 'Upload Folder', icon: <FolderUp className="w-6 h-6 text-orange-500" />, description: 'Upload all PDFs from a folder.', action: 'upload-folder' }
    );
    return available;
  }, [personalProvider, workProvider]);

  const handleConnect = (source: Source) => {
    if (source.action === 'upload') fileInputRef.current?.click();
    else if (source.action === 'upload-folder') folderInputRef.current?.click();
    else if (source.action === 'create' && source.url) window.open(source.url, '_blank');
    else if (source.action === 'sync-drive') syncGoogleDrive();
  };

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline">Add or Sync Documents</h1>
          <p className="text-muted-foreground mt-2">Create, upload, or sync files from your Google Drive.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {sources.map(src => (
                <li key={src.name} className="group hover:bg-accent/50 transition-colors">
                  <button
                    className="flex items-center w-full text-left p-4"
                    onClick={() => handleConnect(src)}
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

        {loadingDrive && <p className="text-center text-sm text-muted-foreground">Loading your Drive files...</p>}

        {driveFiles.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Synced from Google Drive</h2>
              <ul className="space-y-3">
                {driveFiles.map(f => (
                  <li key={f.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.mimeType}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(f.modifiedTime).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default withAuth(AddDocumentPage);
