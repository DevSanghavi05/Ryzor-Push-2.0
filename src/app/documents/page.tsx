
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
import { RefreshCw, UploadCloud, FolderPlus, Filter, FileText, Wand, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountType } from '@/firebase/auth/use-user';
import { extractGoogleDocContent } from '@/ai/flows/extract-google-doc-content';
import { Progress } from '@/components/ui/progress';
import { HyperdriveAnimation } from '@/components/animations/hyperdrive-animation';

// ---------------------------------------------------------------------------
// Main Documents Page Component
// ---------------------------------------------------------------------------

function DocumentsPage() {
  const { user, fetchDriveFiles, signInWithGoogle, workProvider, personalProvider, workAccessToken, personalAccessToken } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'local' | 'google-work' | 'google-personal'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);

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

          const driveDocsToAdd = newDriveFiles.map(file => ({
            ...file,
            isImported: false,
            uploaded: file.modifiedTime,
          }));

          const updatedDocs = [...driveDocsToAdd, ...currentLocalDocs];
          
          localStorage.setItem(localKey, JSON.stringify(updatedDocs));
          setAllDocs(updatedDocs);
          toast({ title: 'Drive Synced', description: `Added ${newDriveFiles.length} new file references.` });

      } catch (e: any) {
          console.error(e);
          toast({ variant: 'destructive', title: `Drive Sync Failed for ${accountType}`, description: e.message });
      } finally {
          setSyncing(false);
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

  const handleImport = async (doc: any): Promise<any | null> => {
    if (!user) return null;

    const token = doc.accountType === 'work' ? workAccessToken : personalAccessToken;
    if (!token) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: `Please re-connect your ${doc.accountType} account.`});
        return null;
    }
    
    try {
        const { content } = await extractGoogleDocContent({ fileId: doc.id, mimeType: doc.mimeType, accessToken: token });
        const updatedDoc = { ...doc, isImported: true };
        // Don't store textContent in the main list, store it separately
        localStorage.setItem(`document_content_${doc.id}`, content);
        
        return updatedDoc;
    } catch (e: any) {
        toast({ variant: 'destructive', title: `Failed to import "${doc.name}"`, description: e.message });
        return null; // Return null on failure
    }
  }
  
  const handleImportAll = async () => {
    if (isImporting || unimportedCount === 0 || !user) return;
    
    setIsImporting(true);
    setImportProgress(0);
    setImportComplete(false);

    const unimportedDocs = allDocs.filter(doc => doc.source === 'drive' && !doc.isImported);
    const totalToImport = unimportedDocs.length;
    let importedSoFar = 0;

    const importPromises = unimportedDocs.map(doc => 
      handleImport(doc).then(updatedDoc => {
        if (updatedDoc) {
          importedSoFar++;
          setImportProgress((importedSoFar / totalToImport) * 100);
        }
        return updatedDoc;
      })
    );

    const results = await Promise.all(importPromises);
    const successfulImports = results.filter(res => !!res);

    startTransition(() => {
      const updatedDocs = allDocs.map(doc => {
        const updatedVersion = results.find(res => res && res.id === doc.id);
        return updatedVersion || doc;
      });

      setAllDocs(updatedDocs);
      localStorage.setItem(`documents_${user.uid}`, JSON.stringify(updatedDocs));
      
      setIsImporting(false);
      setImportComplete(true); 
      toast({ title: 'Bulk Import Complete', description: `${successfulImports.length} document(s) have been processed.` });
    });
  };

  return (
    <>
    <HyperdriveAnimation show={importComplete} onComplete={() => setImportComplete(false)} />
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
        <div className="relative container mx-auto py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-headline">Your Documents</h1>
                <div className="flex gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button disabled={syncing || isImporting}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Connect Account
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleConnect('work')} disabled={!!workProvider}>Connect Google Work</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleConnect('personal')} disabled={!!personalProvider}>Connect Google Personal</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => router.push('/add')} disabled={isImporting}>
                        <FolderPlus className="h-4 w-4 mr-2" /> Manage Sources
                    </Button>
                </div>
            </div>
             <div className="flex items-center gap-3 mb-6">
                <Input
                placeholder="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-sm"
                />
                <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                    <SelectTrigger className="w-[240px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="local">Local Uploads</SelectItem>
                        <SelectItem value="google-work">Google (Work)</SelectItem>
                        <SelectItem value="google-personal">Google (Personal)</SelectItem>
                    </SelectContent>
                </Select>
                 {unimportedCount > 0 && (
                    <Button onClick={handleImportAll} disabled={isImporting || isPending} variant="secondary">
                        <Sparkles className={`h-4 w-4 mr-2 ${isImporting ? 'animate-spin' : ''}`} /> 
                        {isImporting ? `Importing... (${Math.round(importProgress)}%)` : `Import All (${unimportedCount})`}
                    </Button>
                )}
            </div>
             {isImporting && (
                <div className="mb-4">
                    <Progress value={importProgress} className="w-full h-2" />
                    <p className="text-sm text-center mt-1 text-muted-foreground">Importing documents... this may take a moment.</p>
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
                            {d.isImported ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <FileText className="h-5 w-5" />}
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
                              <Button variant="ghost" size="sm" onClick={() => handleImport(d).then(res => res && loadDocs())} disabled={isImporting || isPending}>
                                  <Wand className="h-4 w-4 mr-2" /> Import
                              </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(d.source === 'drive' && !d.isImported ? d.webViewLink : `/documents/${d.id}`)}
                            target={d.source === 'drive' && !d.isImported ? '_blank' : ''}
                            disabled={isPending}
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
    </>
  );
}

export default withAuth(DocumentsPage);
