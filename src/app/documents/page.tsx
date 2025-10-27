
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
    Briefcase,
    Globe,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { useUser } from '@/firebase/auth/use-user';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Document = {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
  webViewLink: string;
  icon: React.ReactNode;
  source: 'drive' | 'local';
};

const getFileIcon = (mimeType: string, source: 'drive' | 'local') => {
    if (source === 'local') return <HardDriveUpload className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('spreadsheet')) return <Sheet className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('presentation')) return <Presentation className="w-5 h-5 text-yellow-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
}

// Helper to extract text from a Google Doc response object
const extractTextFromDoc = (doc: any): string => {
    let text = '';
    if (doc.body && doc.body.content) {
        doc.body.content.forEach((element: any) => {
            if (element.paragraph) {
                element.paragraph.elements.forEach((paragraphElement: any) => {
                    if (paragraphElement.textRun) {
                        text += paragraphElement.textRun.content;
                    }
                });
            }
        });
    }
    return text;
};


function DocumentsPageContent() {
  const { user, loading: userLoading } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFilter = searchParams.get('filter') || 'all';
  const [filterType, setFilterType] = useState(initialFilter);

  const [showTrashConfirm, setShowTrashConfirm] = useState<Document | null>(null);
  const { toast } = useToast();
  
  const hasFetchedDriveFiles = useRef(false);
  
  // This effect runs once on component mount to check for a cookie
  // and fetch files if the cookie exists.
  useEffect(() => {
    const fetchInitialDriveFiles = async () => {
        try {
            // This is a simple check. We assume if a cookie exists, we can try fetching.
            // A more robust solution might involve a dedicated endpoint to check token validity.
            const res = await fetch('/api/drive/files');
            if (res.ok) {
                const driveFiles = await res.json();
                if (driveFiles.length > 0 && !hasFetchedDriveFiles.current) {
                    hasFetchedDriveFiles.current = true;
                    const formattedDriveFiles: Document[] = driveFiles.map((file: any) => ({
                      id: file.id,
                      name: file.name,
                      modifiedTime: file.modifiedTime,
                      mimeType: file.mimeType,
                      webViewLink: file.webViewLink,
                      icon: getFileIcon(file.mimeType, 'drive'),
                      source: 'drive' as const,
                    }));
                    setDocuments(prevDocs => {
                       const localDocs = prevDocs.filter(d => d.source === 'local');
                       return [...localDocs, ...formattedDriveFiles];
                    });
                }
            }
        } catch(e) {
            // It's okay if this fails, it just means the user isn't authed with Drive
            console.log("No initial Drive session found.");
        }
    }
    fetchInitialDriveFiles();
  }, [])

  const fetchLocalFiles = useCallback(() => {
    if (!user) return [];
    const storageKey = `documents_${user.uid}`;
    const localDocsString = localStorage.getItem(storageKey);
    const localDocs = localDocsString ? JSON.parse(localDocsString) : [];
    return localDocs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      modifiedTime: doc.uploaded,
      mimeType: doc.mimeType || 'application/pdf', // Preserve mimeType if it exists
      webViewLink: `/documents/${doc.id}`, // All local docs use the local viewer
      icon: getFileIcon(doc.mimeType || 'application/pdf', 'local'),
      source: 'local' as const,
    }));
  }, [user]);

  useEffect(() => {
    if (user) {
        const localFiles = fetchLocalFiles();
        setDocuments(prevDocs => {
            const driveDocs = prevDocs.filter(p => p.source === 'drive');
            return [...localFiles, ...driveDocs];
        });
        setLoading(false);
    }
  }, [user, fetchLocalFiles]);

  const syncGoogleDrive = async () => {
    // Redirect to our backend route which will then redirect to Google
    router.push('/api/auth/google/signin');
  };

  const filteredDocuments = documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(doc => {
        if (filterType === 'all') return true;
        if (filterType === 'local') return doc.source === 'local';
        if (filterType === 'drive') return doc.source === 'drive';
        return doc.mimeType.includes(filterType);
    });

  const getFileType = (mimeType: string, source: 'drive' | 'local') => {
    if (source === 'local') return 'Imported File';
    if (source === 'drive') return 'Google Drive';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('document')) return 'Doc';
    if (mimeType.includes('spreadsheet')) return 'Sheet';
    if (mimeType.includes('presentation')) return 'Slides';
    return 'File';
  }

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
    if (showTrashConfirm && user) {
        if (showTrashConfirm.source === 'local') {
             const storageKey = `documents_${user.uid}`;
             const contentKey = `document_content_${showTrashConfirm.id}`;
             const existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
             const updatedDocuments = existingDocuments.filter((d: any) => d.id !== showTrashConfirm.id);
             localStorage.setItem(storageKey, JSON.stringify(updatedDocuments));
             localStorage.removeItem(contentKey);
             setDocuments(documents.filter(d => d.id !== showTrashConfirm.id));
        } else {
            // Here you would call the API to move the Drive file to trash
             toast({ variant: 'destructive', title: "Not Implemented", description: "Deleting Drive files is not yet supported." });
        }
       
        toast({
            title: "Moved to Trash",
            description: `${showTrashConfirm.name} has been moved to trash.`
        });
        setShowTrashConfirm(null);
    }
  }

  const handleDocumentClick = (e: React.MouseEvent, doc: Document) => {
    if (doc.source === 'drive') {
        window.open(doc.webViewLink, '_blank');
    } else {
        router.push(doc.webViewLink);
    }
  };

  const handleImportAndAnalyze = async (doc: Document) => {
     toast({
        title: 'Importing Document...',
        description: 'This may take a moment.',
      });

    try {
      const response = await fetch(`/api/drive/files/${doc.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch document content.');
      }
      const { textContent } = await response.json();
      
      if (!textContent.trim()) {
        toast({ variant: 'destructive', title: "Import Failed", description: "The document appears to be empty." });
        return;
      }

      if (!user) return;
      
      const newDocument = {
        id: doc.id,
        name: doc.name,
        uploaded: new Date().toISOString(),
        textContent: textContent,
        mimeType: doc.mimeType,
      };

      const storageKey = `documents_${user.uid}`;
      let existingDocuments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const docIndex = existingDocuments.findIndex((d: any) => d.id === doc.id);
      if (docIndex > -1) {
        existingDocuments[docIndex] = newDocument;
      } else {
        existingDocuments = [newDocument, ...existingDocuments];
      }
      localStorage.setItem(storageKey, JSON.stringify(existingDocuments));

      toast({
        title: "Document Ready",
        description: `${doc.name} content is now available for chat.`,
      });

      // Visually refresh list to show it's "local" now.
      setDocuments(prevDocs => {
        const otherDocs = prevDocs.filter(d => d.id !== doc.id);
        const updatedDoc: Document = {
          ...doc,
          source: 'local',
          webViewLink: `/documents/${doc.id}`,
          icon: getFileIcon(doc.mimeType, 'local'),
        };
        return [...otherDocs, updatedDoc].sort((a,b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
      });

    } catch (error: any) {
      console.error("Error importing Google Doc:", error);
      toast({
        variant: 'destructive',
        title: "Import Failed",
        description: error.message || "Could not import the document.",
      });
    }
  };


  return (
    <div className="flex flex-col min-h-dvh bg-background relative">
      <div className="bg-aurora"></div>
      <main className="flex-1 p-4 md:p-6 relative">
      <TooltipProvider>
        <div className="container mx-auto pt-24">
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
                        <SelectItem value="local">Imported</SelectItem>
                        <SelectItem value="drive">Google Drive</SelectItem>
                    </SelectContent>
                </Select>
                <Button 
                  variant="outline"
                  onClick={syncGoogleDrive}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Google Drive
                </Button>
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
                  <li key={`${doc.id}-${doc.source}`} className="flex items-center justify-between p-4 group hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4 truncate">
                        {doc.icon}
                        <div className="truncate">
                            <a href={doc.webViewLink} onClick={(e) => { e.preventDefault(); handleDocumentClick(e, doc); }} className="font-medium truncate hover:underline cursor-pointer">{doc.name}</a>
                            <p className="text-sm text-muted-foreground">
                                {doc.source === 'drive' ? 'Drive' : 'Imported'} &middot; Modified: {new Date(doc.modifiedTime).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {doc.source === 'drive' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="secondary" size="sm" onClick={() => handleImportAndAnalyze(doc)}>
                                        <Wand className="mr-2 h-4 w-4" />
                                        Import
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Import this file to make its content available to the AI.</p>
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
                        This will move the document "{showTrashConfirm?.name}" to the trash. This action is not easily reversible for local documents.
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
      </TooltipProvider>
      </main>
    </div>
  );
}


function DocumentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DocumentsPageContent />
    </Suspense>
  )
}

export default withAuth(DocumentsPage);
