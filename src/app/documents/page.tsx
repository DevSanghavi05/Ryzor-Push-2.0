
'use client';

import { useEffect, useMemo, useRef, useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import withAuth from '@/firebase/auth/with-auth';
import * as pdfjs from 'pdfjs-dist';
import { generateDocumentName } from '@/ai/flows/generate-doc-name-flow';
import { RefreshCw, UploadCloud, FolderPlus, Filter, FileText, Wand, Sparkles, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountType } from '@/firebase/auth/use-user';
import { nanoid } from 'nanoid';
import { extractGoogleDocContent } from '@/ai/flows/extract-google-doc-content';
import { Progress } from '@/components/ui/progress';

// Lazy PDF worker setup
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
}

// ---------------------------------------------------------------------------
// Main Documents Page Component
// ---------------------------------------------------------------------------

function DocumentsPage() {
  const { user, fetchDriveFiles, signInWithGoogle, workProvider, personalProvider, workAccessToken, personalAccessToken } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'local' | 'google-work' | 'google-personal'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const [isPending, startTransition] = useTransition();

  const unimportedCount = useMemo(() => {
    return allDocs.filter(doc => doc.source === 'drive' && !doc.isImported).length;
  }, [allDocs]);

  const filteredDocs = useMemo(() => {
      return allDocs
        .filter((doc) => {
          const nameMatch = doc.name.toLowerCase().includes(query.toLowerCase());
          if (!nameMatch) return false;

          switch (filter) {
            case 'local':
              return doc.source === 'local';
            case 'google-work':
              return doc.source === 'drive' && doc.accountType === 'work';
            case 'google-personal':
                return doc.source === 'drive' && doc.accountType === 'personal';
            case 'all':
            default:
              return true;
          }
        })
        .sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
    }, [allDocs, query, filter]);


  const loadDocs = useCallback(() => {
    if (!user) return;
    const localKey = `documents_${user.uid}`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      setAllDocs(JSON.parse(stored));
    }
  }, [user]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const syncAndProcessDrive = async (accountType: AccountType) => {
      if (!user) return;
      setSyncing(true);
      toast({ title: `Syncing ${accountType} Google Drive…`, description: 'Fetching your files.' });

      try {
          const driveFiles = await fetchDriveFiles(accountType);
          if (!driveFiles || driveFiles.length === 0) {
              toast({ title: 'Sync complete', description: 'No new files found.' });
              setSyncing(false);
              return;
          }
          
          const localKey = `documents_${user.uid}`;
          const currentLocalDocs = JSON.parse(localStorage.getItem(localKey) || '[]');
          
          const existingIds = new Set(currentLocalDocs.map((d: any) => d.id));
          const newDriveFiles = driveFiles.filter((f:any) => !existingIds.has(f.id));

          if (newDriveFiles.length === 0) {
              toast({ title: 'Sync complete', description: 'All files are up to date.' });
              setSyncing(false);
              return;
          }

          toast({ title: 'Processing new files...', description: `${newDriveFiles.length} new file(s) found.`});

          for (const file of newDriveFiles) {
              currentLocalDocs.unshift({
                ...file,
                isImported: false,
                uploaded: file.modifiedTime,
              });
          }
          
          localStorage.setItem(localKey, JSON.stringify(currentLocalDocs));
          setAllDocs(currentLocalDocs);
          toast({ title: 'Drive Synced', description: `Added ${newDriveFiles.length} new file references.` });

      } catch (e: any) {
          console.error(e);
          toast({ variant: 'destructive', title: `Drive Sync Failed for ${accountType}`, description: e.message });
      } finally {
          setSyncing(false);
      }
  };
  
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Only PDF files supported.' });
      return;
    }

    if (!user) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be signed in.' });
      return;
    }
    
    toast({ title: 'Processing file...', description: 'Extracting text and generating name.' });
    
    try {
        const textContent = await pdfjs.getDocument(await file.arrayBuffer()).promise.then(async pdf => {
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map((item: any) => item.str).join(' ') + '\n';
            }
            return text;
        });

        let name = file.name;
        try {
            const ai = await generateDocumentName({ textContent });
            name = ai.name;
            toast({ title: 'AI Named Document', description: `"${name}"` });
        } catch {
            toast({ variant: 'destructive', title: 'AI Naming Failed', description: 'Using original filename.' });
        }

        const entry = {
            id: nanoid(),
            name,
            source: 'local',
            mimeType: file.type,
            textContent,
            uploaded: new Date().toISOString(),
            isImported: true,
            accountType: 'personal',
        };

        const existing = JSON.parse(localStorage.getItem(`documents_${user.uid}`) || '[]');
        const updated = [entry, ...existing];
        localStorage.setItem(`documents_${user.uid}`, JSON.stringify(updated));
        
        const reader = new FileReader();
        reader.onload = (event) => {
            if(event.target?.result) {
                localStorage.setItem(`document_content_${entry.id}`, event.target.result as string);
            }
        };
        reader.readAsDataURL(file);

        setAllDocs(updated);
        toast({ title: 'Upload Complete', description: `"${entry.name}" has been saved.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    }
  };


  const handleConnect = async (accountType: AccountType) => {
      toast({ title: 'Connecting to Google...', description: 'Please follow the prompts.'});
      try {
        await signInWithGoogle(accountType);
        await syncAndProcessDrive(accountType);
      } catch(e: any) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: e.message });
      }
  }

  const handleImport = async (docId: string) => {
    if (!user) return;
    const docs = [...allDocs];
    const docIndex = docs.findIndex(d => d.id === docId);
    if (docIndex === -1) return;

    const doc = docs[docIndex];
    const token = doc.accountType === 'work' ? workAccessToken : personalAccessToken;
    if (!token) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: `Please re-connect your ${doc.accountType} account.`});
        return null;
    }
    
    try {
        const { content } = await extractGoogleDocContent({ fileId: doc.id, mimeType: doc.mimeType, accessToken: token });
        docs[docIndex] = { ...doc, textContent: content, isImported: true };
        localStorage.setItem(`document_content_${doc.id}`, content);
        
        setAllDocs(docs);
        localStorage.setItem(`documents_${user.uid}`, JSON.stringify(docs));
        toast({ title: 'Imported!', description: `"${doc.name}" is ready.`});
    } catch (e: any) {
        toast({ variant: 'destructive', title: `Failed to import "${doc.name}"`, description: e.message });
    }
  }
  
  const handleImportAll = async () => {
    if (isImporting) return;
    
    startTransition(async () => {
        setIsImporting(true);
        const unimportedDocs = allDocs.filter(doc => doc.source === 'drive' && !doc.isImported);
        const totalToImport = unimportedDocs.length;
        
        for (let i = 0; i < totalToImport; i++) {
            const doc = unimportedDocs[i];
            await handleImport(doc.id);
            setImportProgress(((i + 1) / totalToImport) * 100);
        }

        setIsImporting(false);
        setImportProgress(0);
        toast({ title: 'Bulk Import Complete', description: 'All new documents have been processed.' });
    });
  };

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
        <div className="relative container mx-auto py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-headline">Your Documents</h1>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                        <UploadCloud className="h-4 w-4 mr-2" /> Upload PDF
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button disabled={syncing || isImporting}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Connect & Sync
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {!workProvider && <DropdownMenuItem onSelect={() => handleConnect('work')}>Connect Work Account</DropdownMenuItem>}
                        {workProvider && <DropdownMenuItem onSelect={() => syncAndProcessDrive('work')} disabled={syncing}>Sync Work Account</DropdownMenuItem>}
                        
                        {!personalProvider && <DropdownMenuItem onSelect={() => handleConnect('personal')}>Connect Personal Account</DropdownMenuItem>}
                        {personalProvider && <DropdownMenuItem onSelect={() => syncAndProcessDrive('personal')} disabled={syncing}>Sync Personal Account</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => router.push('/add')} disabled={isImporting}>
                        <FolderPlus className="h-4 w-4 mr-2" /> Manage Sources
                    </Button>
                </div>
                <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>

            <div className="flex items-center gap-3 mb-6">
                <Input
                placeholder="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-sm"
                />
                <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="google-work">Google (Work)</SelectItem>
                        <SelectItem value="google-personal">Google (Personal)</SelectItem>
                    </SelectContent>
                </Select>
                 {unimportedCount > 0 && (
                    <Button onClick={handleImportAll} disabled={isImporting} variant="secondary">
                        <Sparkles className={`h-4 w-4 mr-2 ${isImporting ? 'animate-spin' : ''}`} /> 
                        {isImporting ? 'Importing...' : `Import All (${unimportedCount})`}
                    </Button>
                )}
            </div>
             {isImporting && (
                <div className="mb-4">
                    <Progress value={importProgress} className="w-full h-2" />
                    <p className="text-sm text-center mt-1 text-muted-foreground">Importing documents... please wait.</p>
                </div>
            )}
            
            <Card>
                <CardContent className="divide-y divide-border p-0">
                {filteredDocs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {syncing ? 'Syncing...' : 'No documents found.'}
                    </div>
                ) : (
                    filteredDocs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition">
                        <div className="flex items-center gap-4">
                            <FileText className="h-5 w-5" />
                            <div>
                                <p className="font-medium flex items-center gap-2">
                                    {d.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {d.source === 'drive' ? `Google Drive (${d.accountType})` : 'Local Upload'} &middot; {new Date(d.uploaded).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                         <div className='flex items-center gap-2'>
                          {d.source === 'drive' && !d.isImported && (
                              <Button variant="ghost" onClick={() => handleImport(d.id)} disabled={isImporting}>
                                  <Wand className="h-4 w-4 mr-2" /> Import
                              </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            onClick={() => router.push(d.isImported ? `/documents/${d.id}` : d.webViewLink)} 
                            target={d.isImported || d.source === 'local' ? '' : '_blank'}
                            disabled={d.source === 'drive' && !d.isImported}
                           >
                            View
                          </Button>
                        </div>

                    </div>
                    ))
                )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default withAuth(DocumentsPage);

    