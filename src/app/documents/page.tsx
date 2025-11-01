
'use client';

import { 
    PlusCircle, 
    Search, 
    Loader, 
    MoreVertical, 
    ExternalLink,
    Trash2,
    Filter,
    HardDriveUpload,
    Wand,
    RefreshCw,
    CheckCircle2,
    DownloadCloud,
    FilePenLine,
    User,
    Briefcase,
    Folder as FolderIcon,
    FolderPlus,
    File as FileIcon,
    ChevronDown,
    ChevronRight,
    Move,
    FolderOutput
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { useUser, AccountType } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSeparator
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
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';


const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

type Document = {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
  webViewLink?: string;
  source: 'drive' | 'local';
  sourceProvider?: 'google';
  accountType: AccountType;
  isImported?: boolean;
  folderId?: string;
};

type Folder = {
    id: string;
    name: string;
    createdAt: string;
}

// --- Data Fetching and Management Hooks ---
function useDocuments(user: any) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { 
      fetchDriveFiles, workAccessToken, personalAccessToken, 
      workProvider, personalProvider 
    } = useUser();

    const loadLocalData = useCallback(() => {
        if (!user) return { localDocs: [], importedIds: new Set(), localFolders: [] };
        
        const docsKey = `documents_${user.uid}`;
        const localDocsString = localStorage.getItem(docsKey);
        const localDocs = localDocsString ? JSON.parse(localDocsString) : [];
        const importedIds = new Set(localDocs.map((doc: any) => doc.id));

        const foldersKey = `folders_${user.uid}`;
        const localFoldersString = localStorage.getItem(foldersKey);
        const localFolders = localFoldersString ? JSON.parse(localFoldersString) : [];

        return { localDocs, importedIds, localFolders };
    }, [user]);

    const syncCloudAccounts = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const { localDocs, importedIds, localFolders } = loadLocalData();
        let allCloudFiles: Document[] = [];

        const fetchPromises: Promise<void>[] = [];

        const processFiles = (files: any[] | void, accountType: AccountType, provider: 'google') => {
            if (files) {
                const formatted: Document[] = files.map((file: any) => ({
                    id: file.id, name: file.name, modifiedTime: file.modifiedTime, mimeType: file.mimeType, webViewLink: file.webViewLink,
                    source: 'drive', sourceProvider: provider, accountType: accountType, isImported: importedIds.has(file.id),
                    folderId: localDocs.find((d: any) => d.id === file.id)?.folderId,
                }));
                allCloudFiles.push(...formatted);
            }
        };

        if (workAccessToken) {
            fetchPromises.push(
                fetchDriveFiles('work').then(files => processFiles(files, 'work', workProvider!))
                .catch(error => { toast({ variant: 'destructive', title: `Could not sync ${workProvider} Work account`, description: error.message }); })
            );
        }
        if (personalAccessToken) {
            fetchPromises.push(
                fetchDriveFiles('personal').then(files => processFiles(files, 'personal', personalProvider!))
                .catch(error => { toast({ variant: 'destructive', title: `Could not sync ${personalProvider} Personal account`, description: error.message }); })
            );
        }

        await Promise.all(fetchPromises);

        const cloudDocsMap = new Map(allCloudFiles.map(d => [d.id, d]));
        const mergedDocs = localDocs.map((localDoc: Document) => {
             const cloudVersion = cloudDocsMap.get(localDoc.id);
             if (cloudVersion) {
                 cloudDocsMap.delete(localDoc.id); // Remove from map to avoid duplication
                 return { ...cloudVersion, ...localDoc, isImported: true }; // Local data (like folderId) overrides cloud
             }
             return { ...localDoc, isImported: true };
        });
        
        const uniqueCloudFiles = Array.from(cloudDocsMap.values());

        setDocuments([...mergedDocs, ...uniqueCloudFiles]);
        setFolders(localFolders);
        setLoading(false);

    }, [user, workAccessToken, personalAccessToken, fetchDriveFiles, toast, loadLocalData, workProvider, personalProvider]);
    
    useEffect(() => {
        if (user) {
            syncCloudAccounts();
        } else {
            setLoading(false);
        }
    }, [user, syncCloudAccounts]);

    return { documents, folders, loading, setDocuments, setFolders, syncCloudAccounts, loadLocalData };
}

// --- UI Components ---
function DocumentItem({ doc, onRename, onTrash, onCopyLink, onMove, onImportAndAnalyze, importingDocId, isImportingAll }: {
    doc: Document;
    onRename: (doc: Document) => void;
    onTrash: (doc: Document) => void;
    onCopyLink: (link: string) => void;
    onMove: (doc: Document, folderId?: string) => void;
    onImportAndAnalyze: (doc: Document) => void;
    importingDocId: string | null;
    isImportingAll: boolean;
}) {
    const router = useRouter();

    const getFileIcon = (mimeType: string, source: 'drive' | 'local', provider?: 'google') => {
        if (source === 'local') return <HardDriveUpload className="w-5 h-5 text-purple-500" />;
        if (mimeType.includes('document')) return <FileIcon className="w-5 h-5 text-blue-500" />;
        if (mimeType.includes('spreadsheet')) return <FileIcon className="w-5 h-5 text-green-500" />;
        if (mimeType.includes('presentation')) return <FileIcon className="w-5 h-5 text-yellow-500" />;
        if (mimeType.includes('pdf')) return <FileIcon className="w-5 h-5 text-red-500" />;
        return <FileIcon className="w-5 h-5 text-gray-500" />;
    };

    const handleDocumentClick = (e: React.MouseEvent) => {
        if (doc.source === 'drive' && !doc.isImported) {
            window.open(doc.webViewLink, '_blank');
        } else {
            router.push(`/documents/${doc.id}`);
        }
    };
    
    const { folders: allFolders } = useDocuments(useUser().user);

    return (
        <li className="flex items-center justify-between p-2 group hover:bg-accent/50 transition-colors rounded-md">
            <div className="flex items-center gap-3 truncate">
                {getFileIcon(doc.mimeType, doc.source, doc.sourceProvider)}
                <div className="truncate">
                    <a href={doc.webViewLink} onClick={(e) => { e.preventDefault(); handleDocumentClick(e); }} className="font-medium truncate hover:underline cursor-pointer text-sm">{doc.name}</a>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="flex items-center gap-1">
                          {doc.accountType === 'work' ? <Briefcase size={12} /> : <User size={12} />}
                          {doc.accountType?.charAt(0).toUpperCase() + doc.accountType?.slice(1)}
                        </span>
                        &middot; {doc.isImported ? 'Imported' : 'Cloud'}
                        &middot; {new Date(doc.modifiedTime).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
                {doc.source === 'drive' && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onImportAndAnalyze(doc)} disabled={importingDocId === doc.id || !!doc.isImported || isImportingAll} className="h-7 px-2">
                                {importingDocId === doc.id ? <Loader className="h-4 w-4 animate-spin" /> : doc.isImported ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Wand className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{doc.isImported ? 'Already imported' : 'Import to analyze'}</p></TooltipContent>
                   </Tooltip>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleDocumentClick}><ExternalLink className="mr-2 h-4 w-4" /> Open</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onRename(doc)} disabled={!doc.isImported}><FilePenLine className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                        
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger disabled={!doc.isImported}>
                             <Move className="mr-2 h-4 w-4" /> Move to
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                             <DropdownMenuSubContent>
                               <DropdownMenuItem onSelect={() => onMove(doc)}>
                                 <FolderOutput className="mr-2 h-4 w-4" /> Unassigned
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               {allFolders.map(folder => (
                                 <DropdownMenuItem key={folder.id} onSelect={() => onMove(doc, folder.id)}>
                                   <FolderIcon className="mr-2 h-4 w-4" /> {folder.name}
                                 </DropdownMenuItem>
                               ))}
                             </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onTrash(doc)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Trash</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </li>
    );
}

function FolderItem({ folder, docsInFolder, onRename, onTrash, ...docHandlers }: {
    folder: Folder;
    docsInFolder: Document[];
    onRename: (folder: Folder) => void;
    onTrash: (folder: Folder) => void;
    [key: string]: any; // For other doc handlers
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <li className="mb-2">
            <div className="flex items-center justify-between p-2 group hover:bg-accent/50 transition-colors rounded-md">
                <button className="flex items-center gap-2 text-left flex-1" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <FolderIcon className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-sm">{folder.name}</span>
                    <span className="text-sm text-muted-foreground">({docsInFolder.length})</span>
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onRename(folder)}><FilePenLine className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onTrash(folder)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {isOpen && (
                <ul className="pl-6 border-l-2 border-dashed ml-4 mt-1">
                    {docsInFolder.length > 0 ? (
                        docsInFolder.map(doc => <DocumentItem key={doc.id} doc={doc} {...docHandlers} />)
                    ) : (
                        <p className="text-xs text-muted-foreground p-2">This folder is empty.</p>
                    )}
                </ul>
            )}
        </li>
    );
}


function DocumentsPageContent() {
  const { user, signInWithGoogle, userLoading } = useUser();
  const { documents, folders, loading, setDocuments, setFolders, syncCloudAccounts, loadLocalData } = useDocuments(user);
  
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [importingDocId, setImportingDocId] = useState<string | null>(null);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const [isImportSuccess, setIsImportSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [filterType, setFilterType] = useState(initialFilter);

  const [showTrashConfirm, setShowTrashConfirm] = useState<Document | Folder | null>(null);
  const [deleteFolderAction, setDeleteFolderAction] = useState<'delete' | 'unassign'>('unassign');
  const [renamingItem, setRenamingItem] = useState<Document | Folder | null>(null);
  const [newName, setNewName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  
  const { toast } = useToast();

  const handleSync = async () => {
    setLoadingDrive(true);
    await syncCloudAccounts();
    setLoadingDrive(false);
  };
  
  const docsToImportCount = useMemo(() => documents.filter(doc => doc.source === 'drive' && !doc.isImported).length, [documents]);

  const importDocument = async (doc: Document): Promise<boolean> => {
    // ... (import logic remains the same)
    if (!user) {
       toast({ variant: 'destructive', title: "Authentication Error", description: "Cannot import document without a valid session." });
       return false;
    }
    const { workAccessToken, personalAccessToken } = useUser();
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

        if (!result.content) throw new Error("No content was extracted from the document.");

        const storageKey = `documents_${user.uid}`;
        const existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const docIndex = existingDocuments.findIndex((d: any) => d.id === doc.id);
        
        const newDocRecord = {
            id: doc.id, name: doc.name, uploaded: new Date().toISOString(), textContent: result.content,
            source: 'drive', sourceProvider: doc.sourceProvider, mimeType: doc.mimeType,
            webViewLink: doc.webViewLink, accountType: doc.accountType, folderId: doc.folderId,
        };

        const contentKey = `document_content_${doc.id}`;
        localStorage.setItem(contentKey, `data:text/plain;base64,${btoa(unescape(encodeURIComponent(result.content)))}`);

        if (docIndex > -1) {
            existingDocuments[docIndex] = { ...existingDocuments[docIndex], ...newDocRecord };
        } else {
            existingDocuments.unshift(newDocRecord);
        }
        localStorage.setItem(storageKey, JSON.stringify(existingDocuments));

        setDocuments(prevDocs => prevDocs.map(d => d.id === doc.id ? {...d, isImported: true, textContent: result.content } : d));
        return true;
    } catch (error: any) {
        toast({ variant: 'destructive', title: `Import Failed for ${doc.name}`, description: "Could not extract content.", });
        return false;
    } finally {
        setImportingDocId(null);
    }
  };

  const handleImportAndAnalyze = async (doc: Document) => {
     toast({ title: 'Importing Document...', description: `Extracting content from ${doc.name}.` });
    const success = await importDocument(doc);
    if (success) toast({ title: "Import Successful", description: `${doc.name} is now available.` });
  };

  const handleImportAll = async () => {
    const docsToImport = documents.filter(doc => doc.source === 'drive' && !doc.isImported);
    if (docsToImport.length === 0) {
        toast({ title: 'Nothing to Import', description: 'All cloud files have already been imported.' });
        return;
    }
    setIsImportingAll(true);
    setIsImportSuccess(false);
    let successCount = 0;
    toast({ title: 'Starting Bulk Import...', description: `Importing ${docsToImport.length} documents.`});
    for (const doc of docsToImport) {
        const success = await importDocument(doc);
        if (success) successCount++;
    }
    setIsImportSuccess(true);
    toast({ title: 'Bulk Import Complete', description: `Successfully imported ${successCount} out of ${docsToImport.length} documents.` });
    setTimeout(() => { setIsImportingAll(false); setIsImportSuccess(false); }, 2000);
  };
  
  const handleTrash = (item: Document | Folder) => setShowTrashConfirm(item);

  const confirmTrash = () => {
    if (!showTrashConfirm || !user) return;
    const isFolder = 'createdAt' in showTrashConfirm;
    
    if (isFolder) {
        // Folder deletion
        const foldersKey = `folders_${user.uid}`;
        let currentFolders = JSON.parse(localStorage.getItem(foldersKey) || '[]');
        localStorage.setItem(foldersKey, JSON.stringify(currentFolders.filter((f: Folder) => f.id !== showTrashConfirm.id)));
        setFolders(currentFolders.filter((f: Folder) => f.id !== showTrashConfirm.id));

        if (deleteFolderAction === 'unassign') {
            const docsKey = `documents_${user.uid}`;
            let currentDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
            const updatedDocs = currentDocs.map((d: Document) => d.folderId === showTrashConfirm.id ? { ...d, folderId: undefined } : d);
            localStorage.setItem(docsKey, JSON.stringify(updatedDocs));
            setDocuments(docs => docs.map(d => d.folderId === showTrashConfirm.id ? { ...d, folderId: undefined } : d));
        } else { // 'delete'
             const docsKey = `documents_${user.uid}`;
             let currentDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
             const docsToTrash = documents.filter(d => d.folderId === showTrashConfirm.id);
             docsToTrash.forEach(doc => {
                 const trashKey = `trash_${user.uid}`;
                 const existingTrash = JSON.parse(localStorage.getItem(trashKey) || '[]');
                 const trashedDoc = { ...doc, trashedAt: new Date().toISOString() };
                 localStorage.setItem(trashKey, JSON.stringify([trashedDoc, ...existingTrash]));
                 localStorage.removeItem(`document_content_${doc.id}`);
             });
             const updatedDocs = currentDocs.filter((d: Document) => d.folderId !== showTrashConfirm.id);
             localStorage.setItem(docsKey, JSON.stringify(updatedDocs));
             setDocuments(docs => docs.filter(d => d.folderId !== showTrashConfirm.id));
        }

        toast({ title: "Folder Deleted", description: `"${showTrashConfirm.name}" has been deleted.` });

    } else { // Document deletion
        const docsKey = `documents_${user.uid}`;
        const trashKey = `trash_${user.uid}`;
        let existingDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
        const existingTrash = JSON.parse(localStorage.getItem(trashKey) || '[]');
        const docToTrash = documents.find(d => d.id === showTrashConfirm.id);
        if (!docToTrash) return;

        const trashedDoc = { ...docToTrash, trashedAt: new Date().toISOString() };
        localStorage.setItem(trashKey, JSON.stringify([trashedDoc, ...existingTrash]));
        localStorage.setItem(docsKey, JSON.stringify(existingDocs.filter((d: any) => d.id !== showTrashConfirm.id)));
        localStorage.removeItem(`document_content_${showTrashConfirm.id}`);
        setDocuments(prevDocs => prevDocs.filter(d => d.id !== showTrashConfirm.id));
        toast({ title: "Moved to Trash", description: `${showTrashConfirm.name} has been moved to trash.` });
    }
    setShowTrashConfirm(null);
  };

  const handleOpenRenameDialog = (item: Document | Folder) => { setRenamingItem(item); setNewName(item.name); };

  const handleConfirmRename = () => {
    if (!renamingItem || !newName.trim() || !user) return;
    const isFolder = 'createdAt' in renamingItem;

    if (isFolder) {
        const foldersKey = `folders_${user.uid}`;
        let currentFolders = JSON.parse(localStorage.getItem(foldersKey) || '[]');
        const updatedFolders = currentFolders.map((f: Folder) => f.id === renamingItem.id ? { ...f, name: newName.trim() } : f);
        localStorage.setItem(foldersKey, JSON.stringify(updatedFolders));
        setFolders(updatedFolders);
    } else {
        const docsKey = `documents_${user.uid}`;
        let currentDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
        const updatedStoredDocs = currentDocs.map((d: any) => d.id === renamingItem.id ? { ...d, name: newName.trim() } : d);
        localStorage.setItem(docsKey, JSON.stringify(updatedStoredDocs));
        setDocuments(prevDocs => prevDocs.map(d => d.id === renamingItem.id ? { ...d, name: newName.trim() } : d));
    }

    toast({ title: "Rename Successful", description: `Renamed to "${newName.trim()}".` });
    setRenamingItem(null);
    setNewName("");
  };

  const handleCreateFolder = () => {
      if (!newName.trim() || !user) return;
      const foldersKey = `folders_${user.uid}`;
      let currentFolders = JSON.parse(localStorage.getItem(foldersKey) || '[]');
      const newFolder: Folder = { id: nanoid(), name: newName.trim(), createdAt: new Date().toISOString() };
      const updatedFolders = [newFolder, ...currentFolders];
      localStorage.setItem(foldersKey, JSON.stringify(updatedFolders));
      setFolders(updatedFolders);

      toast({ title: "Folder Created", description: `"${newName.trim()}" has been created.` });
      setShowNewFolderDialog(false);
      setNewName("");
  };

  const handleMoveDocument = (doc: Document, folderId?: string) => {
    if (!user) return;
    const docsKey = `documents_${user.uid}`;
    let currentDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
    const updatedDocs = currentDocs.map((d: Document) => d.id === doc.id ? { ...d, folderId } : d);
    localStorage.setItem(docsKey, JSON.stringify(updatedDocs));
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, folderId } : d));
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'Unassigned';
    toast({ title: "Document Moved", description: `"${doc.name}" moved to ${folderName}.`});
  };

  const handleSyncAccount = async (provider: 'google', accountType: AccountType) => {
      toast({ title: `Connecting to your ${provider} ${accountType} account...`});
      await signInWithGoogle(accountType);
  }

  // --- Filtering and Grouping Logic ---
  const { unassignedDocs, docsByFolder } = useMemo(() => {
    const filtered = documents
        .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(doc => {
            if (filterType === 'all') return true;
            if (filterType === 'local') return doc.source === 'local';
            if (filterType === 'google') return doc.sourceProvider === 'google';
            if (filterType === 'imported') return doc.isImported;
            if (filterType === 'work') return doc.accountType === 'work';
            if (filterType === 'personal') return doc.accountType === 'personal';
            return doc.mimeType.includes(filterType);
        })
        .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

    const unassigned: Document[] = [];
    const byFolder: Record<string, Document[]> = {};

    for (const doc of filtered) {
        if (doc.folderId && folders.find(f => f.id === doc.folderId)) {
            if (!byFolder[doc.folderId]) byFolder[doc.folderId] = [];
            byFolder[doc.folderId].push(doc);
        } else {
            unassigned.push(doc);
        }
    }
    return { unassignedDocs: unassigned, docsByFolder: byFolder };
  }, [documents, folders, searchQuery, filterType]);

  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.name.localeCompare(b.name)), [folders]);


  const renderMainContent = () => {
    if (loading || userLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-border rounded-lg">
          <Loader className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
          <h2 className="text-2xl font-bold font-headline mb-2">Loading Documents...</h2>
          <p className="text-muted-foreground">Please wait a moment.</p>
        </div>
      );
    }
    
    const hasResults = sortedFolders.length > 0 || unassignedDocs.length > 0;
    
    if (!hasResults && !loadingDrive) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border rounded-lg">
                <FileIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">
                  {searchQuery || filterType !== 'all' ? 'No Results Found' : 'No Documents Found'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchQuery || filterType !== 'all'
                    ? `Your search and filter criteria did not return any documents.`
                    : 'Upload a document or connect a cloud account to get started.'
                  }
                </p>
                <div className="flex gap-4">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="lg"><PlusCircle className="mr-2 h-4 w-4" />Connect Account</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleSyncAccount('google', 'work')}><GoogleIcon /> Google Work</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleSyncAccount('google', 'personal')}><GoogleIcon /> Google Personal</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                    <Button asChild size="lg" variant="secondary"><Link href="/add"><HardDriveUpload className="mr-2 h-4 w-4" />Upload File</Link></Button>
                </div>
            </div>
        );
    }

    const docHandlers = { onRename: handleOpenRenameDialog, onTrash: handleTrash, onMove: handleMoveDocument, onImportAndAnalyze: handleImportAndAnalyze, importingDocId, isImportingAll };

    return (
        <div className="border rounded-lg overflow-hidden bg-card/50 p-2">
            <ul className="divide-y divide-border">
                {loadingDrive && (
                    <li className="flex items-center justify-center p-4 text-muted-foreground"><Loader className="w-5 h-5 animate-spin mr-2" />Fetching cloud files...</li>
                )}
                {sortedFolders.map(folder => (
                    <FolderItem
                        key={folder.id}
                        folder={folder}
                        docsInFolder={docsByFolder[folder.id] || []}
                        onRename={handleOpenRenameDialog}
                        onTrash={handleTrash}
                        {...docHandlers}
                    />
                ))}
                {unassignedDocs.map(doc => <DocumentItem key={doc.id} doc={doc} {...docHandlers} />)}
             </ul>
        </div>
    )
  };

  return (
    <div className="relative min-h-dvh w-full pt-16">
      <div className="bg-aurora"></div>
      <main className="flex-1 p-4 md:p-6 relative">
        <HyperdriveAnimation isImporting={isImportingAll} isSuccess={isImportSuccess} />
        <TooltipProvider>
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">My Documents</h1>
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <div className="relative w-full md:w-auto flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="search" placeholder="Search documents..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="imported">Imported</SelectItem>
                                <SelectItem value="work">Work Account</SelectItem>
                                <SelectItem value="personal">Personal Account</SelectItem>
                                <SelectItem value="google">Google Drive</SelectItem>
                                <SelectItem value="local">Local Uploads</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={() => setShowNewFolderDialog(true)} variant="outline"><FolderPlus className="mr-2 h-4 w-4" /> New Folder</Button>
                        {docsToImportCount > 0 && (
                            <Button onClick={handleImportAll} disabled={isImportingAll}><DownloadCloud className={`mr-2 h-4 w-4 ${isImportingAll ? 'animate-spin' : ''}`} /> Import All ({docsToImportCount})</Button>
                        )}
                        <Button variant="outline" onClick={handleSync} disabled={loadingDrive}><RefreshCw className={`mr-2 h-4 w-4 ${loadingDrive ? 'animate-spin' : ''}`} /> Sync</Button>
                    </div>
                </div>
                {renderMainContent()}
            </div>

            {/* Dialogs */}
            <AlertDialog open={!!showTrashConfirm} onOpenChange={(open) => !open && setShowTrashConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {showTrashConfirm && 'createdAt' in showTrashConfirm ? (
                            <>
                              You are about to delete the folder "{showTrashConfirm.name}". What should be done with the documents inside?
                              <div className="flex items-center space-x-2 mt-4">
                                <Button variant={deleteFolderAction === 'unassign' ? 'secondary' : 'outline'} onClick={() => setDeleteFolderAction('unassign')}>Move to Unassigned</Button>
                                <Button variant={deleteFolderAction === 'delete' ? 'destructive' : 'outline'} onClick={() => setDeleteFolderAction('delete')}>Move to Trash</Button>
                              </div>
                            </>
                          ) : `This will move the document "${showTrashConfirm?.name}" to the trash.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmTrash} className={cn(showTrashConfirm && 'createdAt' in showTrashConfirm && 'bg-destructive hover:bg-destructive/90')}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog open={!!renamingItem} onOpenChange={(open) => !open && setRenamingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename {renamingItem && 'createdAt' in renamingItem ? 'Folder' : 'Document'}</DialogTitle>
                        <DialogDescription>Enter a new name for "{renamingItem?.name}".</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenamingItem(null)}>Cancel</Button>
                        <Button onClick={handleConfirmRename}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="new-folder-name" className="text-right">Folder Name</Label>
                        <Input id="new-folder-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. 'Project Phoenix'" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowNewFolderDialog(false); setNewName(''); }}>Cancel</Button>
                        <Button onClick={handleCreateFolder}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
      </main>
    </div>
  );
}

function DocumentsPage() { return <DocumentsPageContent /> }
export default withAuth(DocumentsPage);

    