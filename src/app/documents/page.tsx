
'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { 
    FileText, 
    PlusCircle, 
    Search, 
    Loader, 
    Sheet, 
    Presentation, 
    File, 
    MoreVertical, 
    ExternalLink,
    Share2,
    Link2,
    Trash2,
    Filter,
    HardDriveUpload,
    Wand,
    RefreshCw,
    CheckCircle2,
    DownloadCloud,
    FilePenLine,
    User,
    Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { useUser, AccountType } from '@/firebase/auth/use-user';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { extractGoogleDocContent } from '@/ai/flows/extract-google-doc-content';
import { HyperdriveAnimation } from '@/components/ui/hyperdrive-animation';

type Document = {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
  webViewLink: string;
  icon: React.ReactNode;
  source: 'drive' | 'local';
  accountType: AccountType;
  isImported?: boolean;
};

const getFileIcon = (mimeType: string, source: 'drive' | 'local') => {
    if (source === 'local') return <HardDriveUpload className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('spreadsheet')) return <Sheet className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('presentation')) return <Presentation className="w-5 h-5 text-yellow-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
}

function DocumentsPageContent() {
  const { user, loading: userLoading, fetchDriveFiles, workAccessToken, personalAccessToken, signInWithGoogle } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [importingDocId, setImportingDocId] = useState<string | null>(null);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const [isImportSuccess, setIsImportSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFilter = searchParams.get('filter') || 'all';
  const [filterType, setFilterType] = useState(initialFilter);

  const [showTrashConfirm, setShowTrashConfirm] = useState<Document | null>(null);
  const { toast } = useToast();

  const [renamingDoc, setRenamingDoc] = useState<Document | null>(null);
  const [newName, setNewName] = useState("");
  
  const loadLocalDocuments = useCallback(() => {
    if (!user) return { localDocs: [], importedIds: new Set() };
    const storageKey = `documents_${user.uid}`;
    const localDocsString = localStorage.getItem(storageKey);
    const localDocs = localDocsString ? JSON.parse(localDocsString) : [];
    const importedIds = new Set(localDocs.map((doc: any) => doc.id));
    return { localDocs, importedIds };
  }, [user]);

  const syncGoogleDrive = useCallback(async () => {
    if (!user) return;
    setLoadingDrive(true);
    
    const { localDocs, importedIds } = loadLocalDocuments();
    let allDriveFiles: Document[] = [];

    const fetchPromises: Promise<void>[] = [];

    if (workAccessToken) {
        fetchPromises.push(
            fetchDriveFiles('work').then(files => {
                if (files) {
                    const formatted: Document[] = files.map((file: any) => ({
                        id: file.id, name: file.name, modifiedTime: file.modifiedTime, mimeType: file.mimeType, webViewLink: file.webViewLink,
                        icon: getFileIcon(file.mimeType, 'drive'),
                        source: 'drive', accountType: 'work', isImported: importedIds.has(file.id),
                    }));
                    allDriveFiles.push(...formatted);
                }
            }).catch(error => {
                toast({ variant: 'destructive', title: 'Could not sync Work account', description: error.message });
            })
        );
    }
    if (personalAccessToken) {
         fetchPromises.push(
            fetchDriveFiles('personal').then(files => {
                if (files) {
                    const formatted: Document[] = files.map((file: any) => ({
                        id: file.id, name: file.name, modifiedTime: file.modifiedTime, mimeType: file.mimeType, webViewLink: file.webViewLink,
                        icon: getFileIcon(file.mimeType, 'drive'),
                        source: 'drive', accountType: 'personal', isImported: importedIds.has(file.id),
                    }));
                    allDriveFiles.push(...formatted);
                }
            }).catch(error => {
                toast({ variant: 'destructive', title: 'Could not sync Personal account', description: error.message });
            })
        );
    }

    await Promise.all(fetchPromises);

    const formattedLocalDocs: Document[] = localDocs.map((doc: any) => ({
        ...doc,
        icon: getFileIcon(doc.mimeType || 'application/pdf', doc.source),
        isImported: true,
        accountType: doc.accountType || 'work', // default legacy local uploads to 'work'
    }));

    // Combine all sources, ensuring Drive files don't duplicate imported local records
    const localIds = new Set(formattedLocalDocs.map(d => d.id));
    const uniqueDriveFiles = allDriveFiles.filter(d => !localIds.has(d.id));

    setDocuments([...formattedLocalDocs, ...uniqueDriveFiles]);
    setLoadingDrive(false);
    setLoading(false);

  }, [user, workAccessToken, personalAccessToken, fetchDriveFiles, toast, loadLocalDocuments]);


  useEffect(() => {
    if (user) {
      syncGoogleDrive();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading, syncGoogleDrive]);


  const importDocument = async (doc: Document): Promise<boolean> => {
    if (!user) {
       toast({ variant: 'destructive', title: "Authentication Error", description: "Cannot import document without a valid session." });
       return false;
    }
    
    const accessToken = doc.accountType === 'work' ? workAccessToken : personalAccessToken;
    if (!accessToken) {
        toast({ variant: 'destructive', title: `Not connected`, description: `Please connect your ${doc.accountType} account to import.` });
        return false;
    }

    setImportingDocId(doc.id);

    try {
        const result = await extractGoogleDocContent({
            fileId: doc.id,
            mimeType: doc.mimeType,
            accessToken: accessToken,
        });

        if (!result.content) {
            throw new Error("No content was extracted from the document.");
        }

        const storageKey = `documents_${user.uid}`;
        const existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const newDocRecord = {
            id: doc.id,
            name: doc.name,
            uploaded: new Date().toISOString(),
            textContent: result.content,
            source: 'drive',
            mimeType: doc.mimeType,
            webViewLink: doc.webViewLink,
            accountType: doc.accountType,
        };

        const contentKey = `document_content_${doc.id}`;
        localStorage.setItem(contentKey, `data:text/plain;base64,${btoa(unescape(encodeURIComponent(result.content)))}`);

        const docIndex = existingDocuments.findIndex((d: any) => d.id === doc.id);
        if (docIndex > -1) {
            existingDocuments[docIndex] = newDocRecord;
        } else {
            existingDocuments.unshift(newDocRecord);
        }
        localStorage.setItem(storageKey, JSON.stringify(existingDocuments));

        setDocuments(prevDocs => prevDocs.map(d => d.id === doc.id ? {...d, isImported: true } : d));
        return true;

    } catch (error: any) {
        console.error(`Error importing ${doc.name}:`, error);
        toast({
            variant: 'destructive',
            title: `Import Failed for ${doc.name}`,
            description: error.message || "Could not import the document.",
        });
        return false;
    } finally {
        setImportingDocId(null);
    }
  };

  const handleImportAndAnalyze = async (doc: Document) => {
    toast({
       title: 'Importing Document...',
       description: `Extracting content from ${doc.name}. This may take a moment.`,
     });
    const success = await importDocument(doc);
    if (success) {
      toast({
        title: "Import Successful",
        description: `${doc.name} is now available for analysis.`,
      });
    }
  };

  const handleImportAll = async () => {
    const docsToImport = documents.filter(doc => doc.source === 'drive' && !doc.isImported);
    if (docsToImport.length === 0) {
        toast({ title: 'Nothing to Import', description: 'All Google Drive files have already been imported.' });
        return;
    }

    setIsImportingAll(true);
    setIsImportSuccess(false);
    let successCount = 0;
    
    toast({ title: 'Starting Bulk Import...', description: `Importing ${docsToImport.length} documents.`});
    
    // Using a for...of loop to ensure sequential execution
    for (const doc of docsToImport) {
        const success = await importDocument(doc);
        if (success) {
            successCount++;
        }
    }

    setIsImportSuccess(true);
    toast({
        title: 'Bulk Import Complete',
        description: `Successfully imported ${successCount} out of ${docsToImport.length} documents.`,
    });

    // Hide the animation overlay after a short delay
    setTimeout(() => {
      setIsImportingAll(false);
      setIsImportSuccess(false);
    }, 2000);
  };

  const docsToImportCount = documents.filter(doc => doc.source === 'drive' && !doc.isImported).length;


  const filteredDocuments = documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(doc => {
        if (filterType === 'all') return true;
        if (filterType === 'local') return doc.source === 'local';
        if (filterType === 'drive') return doc.source === 'drive';
        if (filterType === 'imported') return doc.isImported;
        if (filterType === 'work') return doc.accountType === 'work';
        if (filterType === 'personal') return doc.accountType === 'personal';
        return doc.mimeType.includes(filterType);
    }).sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast({ title: 'Link copied to clipboard!' });
    }).catch(err => {
      toast({ variant: 'destructive', title: 'Failed to copy link.' });
    });
  };

  const handleTrash = (doc: Document) => {
    setShowTrashConfirm(doc);
  }

  const confirmTrash = () => {
    if (!showTrashConfirm || !user) return;
  
    const docsKey = `documents_${user.uid}`;
    const trashKey = `trash_${user.uid}`;
  
    // Get stored docs and trash
    let existingDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
    const existingTrash = JSON.parse(localStorage.getItem(trashKey) || '[]');
  
    const docToTrash = documents.find(d => d.id === showTrashConfirm.id);
  
    if (!docToTrash) return;
  
    // Add to trash
    const trashedDoc = {
      ...docToTrash,
      trashedAt: new Date().toISOString(),
    };
    localStorage.setItem(trashKey, JSON.stringify([trashedDoc, ...existingTrash]));
  
    // If it's an imported file, remove it from the main documents list in storage.
    // This is now the standard behavior for all trashed items.
    existingDocs = existingDocs.filter((d: any) => d.id !== showTrashConfirm.id);
    localStorage.setItem(docsKey, JSON.stringify(existingDocs));
    // Also remove the content file if it exists
    localStorage.removeItem(`document_content_${showTrashConfirm.id}`);
    
    // Update UI state by removing the trashed item from all sources.
    setDocuments(prevDocs => prevDocs.filter(d => d.id !== showTrashConfirm.id));
  
    toast({
      title: "Moved to Trash",
      description: `${showTrashConfirm.name} has been moved to trash.`,
    });
  
    setShowTrashConfirm(null);
  };


  const handleOpenRenameDialog = (doc: Document) => {
    setRenamingDoc(doc);
    setNewName(doc.name);
  };

  const handleConfirmRename = () => {
    if (!renamingDoc || !newName.trim() || !user) return;

    const docsKey = `documents_${user.uid}`;
    const existingDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
    
    const updatedStoredDocs = existingDocs.map((d: any) => {
        if (d.id === renamingDoc.id) {
            return { ...d, name: newName.trim() };
        }
        return d;
    });

    localStorage.setItem(docsKey, JSON.stringify(updatedStoredDocs));

    setDocuments(prevDocs => 
        prevDocs.map(d => 
            d.id === renamingDoc.id ? { ...d, name: newName.trim() } : d
        )
    );

    toast({
        title: "Rename Successful",
        description: `Renamed to "${newName.trim()}".`,
    });

    setRenamingDoc(null);
    setNewName("");
  };

  const handleDocumentClick = (e: React.MouseEvent, doc: Document) => {
    if (doc.source === 'drive' && !doc.isImported) {
        window.open(doc.webViewLink, '_blank');
    } else {
        router.push(`/documents/${doc.id}`);
    }
  };
  
  const handleSyncAccount = async (accountType: AccountType) => {
      toast({ title: `Connecting to your ${accountType} account...`});
      await signInWithGoogle(accountType);
      // The useEffect watching the tokens will trigger the sync
  }

  return (
    <div className="relative min-h-dvh w-full pt-16">
      <div className="bg-aurora"></div>
      <main className="flex-1 p-4 md:p-6 relative">
      <HyperdriveAnimation isImporting={isImportingAll} isSuccess={isImportSuccess} />
      <TooltipProvider>
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              My Documents
            </h1>
            <div className="flex w-full md:w-auto items-center gap-2">
                <div className="relative w-full md:w-auto flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        type="search"
                        placeholder="Search documents..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                 <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="imported">Imported</SelectItem>
                        <SelectItem value="work">Work Account</SelectItem>
                        <SelectItem value="personal">Personal Account</SelectItem>
                        <SelectItem value="local">Local Uploads</SelectItem>
                    </SelectContent>
                </Select>
                <Button 
                  variant="outline"
                  onClick={syncGoogleDrive}
                  disabled={loadingDrive}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loadingDrive ? 'animate-spin' : ''}`} />
                    Sync
                </Button>
                {!workAccessToken && (
                    <Button onClick={() => handleSyncAccount('work')}>
                        <Briefcase className="mr-2 h-4 w-4" /> Sync Work Account
                    </Button>
                )}
                {workAccessToken && !personalAccessToken && (
                     <Button onClick={() => handleSyncAccount('personal')}>
                        <User className="mr-2 h-4 w-4" /> Sync Personal Account
                    </Button>
                )}
            </div>
          </div>
          {(loading || userLoading) ? (
             <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-border rounded-lg">
                <Loader className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">
                    Loading Documents...
                </h2>
                <p className="text-muted-foreground">Please wait a moment.</p>
             </div>
          ) : filteredDocuments.length > 0 || loadingDrive ? (
            <div className="border rounded-lg overflow-hidden">
              <ul className="divide-y divide-border">
                {loadingDrive && (
                    <li className="flex items-center justify-center p-4 text-muted-foreground">
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                        Fetching Google Drive files...
                    </li>
                )}
                {filteredDocuments.map(doc => (
                  <li key={`${doc.id}-${doc.source}-${doc.accountType}`} className="flex items-center justify-between p-4 group hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4 truncate">
                        {doc.icon}
                        <div className="truncate">
                            <a href={doc.webViewLink} onClick={(e) => { e.preventDefault(); handleDocumentClick(e, doc); }} className="font-medium truncate hover:underline cursor-pointer">{doc.name}</a>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  {doc.accountType === 'work' ? <Briefcase size={12} /> : <User size={12} />}
                                  {doc.accountType.charAt(0).toUpperCase() + doc.accountType.slice(1)}
                                </span>
                                &middot; 
                                {doc.isImported ? 'Imported' : 'Drive'}
                                &middot; 
                                Modified: {new Date(doc.modifiedTime).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {doc.source === 'drive' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="secondary" size="sm" onClick={() => handleImportAndAnalyze(doc)} disabled={importingDocId === doc.id || doc.isImported || isImportingAll}>
                                        {importingDocId === doc.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : doc.isImported ? <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> : <Wand className="mr-2 h-4 w-4" />}
                                        {doc.isImported ? 'Imported' : 'Import'}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{doc.isImported ? 'This file has already been imported.' : 'Import this file to make its content available to the AI.'}</p>
                                </TooltipContent>
                           </Tooltip>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleDocumentClick(new MouseEvent('click') as any, doc)}>
                                    <ExternalLink className="mr-2 h-4 w-4" /> Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleOpenRenameDialog(doc)} disabled={!doc.isImported}>
                                    <FilePenLine className="mr-2 h-4 w-4" /> Rename
                                </DropdownMenuItem>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={doc.source === 'local'}>
                                        <Share2 className="mr-2 h-4 w-4" /> Share
                                    </DropdownMenuItem>
                                 </TooltipTrigger>
                                 {doc.source === 'local' && <TooltipContent><p>You can't share a local file.</p></TooltipContent>}
                               </Tooltip>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                    <DropdownMenuItem onSelect={() => handleCopyLink(doc.webViewLink)} disabled={doc.source === 'local'}>
                                        <Link2 className="mr-2 h-4 w-4" /> Copy Link
                                    </DropdownMenuItem>
                                 </TooltipTrigger>
                                 {doc.source === 'local' && <TooltipContent><p>Local files do not have a shareable link.</p></TooltipContent>}
                               </Tooltip>
                                <DropdownMenuItem onSelect={() => handleTrash(doc)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Trash
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border rounded-lg">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">
                  {searchQuery || filterType !== 'all' ? 'No Results Found' : 'No Documents Found'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchQuery || filterType !== 'all'
                    ? `Your search and filter criteria did not return any documents.`
                    : 'Upload a document or sync Google Drive to get started.'
                  }
                </p>
                <Button asChild>
                    <Link href="/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Document
                    </Link>
                </Button>
            </div>
          )}
        </div>
        <AlertDialog open={!!showTrashConfirm} onOpenChange={(open) => !open && setShowTrashConfirm(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will move the document "{showTrashConfirm?.name}" to the trash. This action can be undone later.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmTrash} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Move to Trash
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Dialog open={!!renamingDoc} onOpenChange={(open) => !open && setRenamingDoc(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Document</DialogTitle>
                    <DialogDescription>
                        Enter a new name for the document "{renamingDoc?.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setRenamingDoc(null)}>Cancel</Button>
                    <Button onClick={handleConfirmRename}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </TooltipProvider>
      </main>
    </div>
  );
}

function DocumentsPage() {
    return (
      <DocumentsPageContent />
    )
}

export default withAuth(DocumentsPage);

    