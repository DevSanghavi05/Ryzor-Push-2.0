

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
    Filter
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { useUser } from '@/firebase/auth/use-user';
import type { gapi as Gapi } from 'gapi-script';
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

type Document = {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
  webViewLink: string;
  icon: React.ReactNode;
};

const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('spreadsheet')) return <Sheet className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('presentation')) return <Presentation className="w-5 h-5 text-yellow-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
}

function DocumentsPage({ onUploadClick }: { onUploadClick?: () => void }) {
  const { accessToken, user, loading: userLoading } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showTrashConfirm, setShowTrashConfirm] = useState<Document | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchFiles = useCallback((gapiInstance: typeof Gapi) => {
    if (!gapiInstance.client?.drive) {
        console.error("Drive API client not loaded.");
        setLoading(false);
        return;
    }
    gapiInstance.client.drive.files.list({
      'pageSize': 20,
      'fields': "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)"
    }).then((response: any) => {
      const files = response.result.files as any[];
      const formattedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        icon: getFileIcon(file.mimeType),
      }));
      setDocuments(formattedFiles);
      setLoading(false);
    }).catch((error: any) => {
        const errorDetails = error.result?.error;
        if (errorDetails) {
          console.error("Error fetching files from Google Drive API:", JSON.stringify(errorDetails, null, 2));
        } else {
          console.error("Error fetching files: ", error);
        }
        setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }
    if (!accessToken) {
      setLoading(false);
      return;
    };

    const initGapiClient = async () => {
      try {
        const gapiScript = await import('gapi-script');
        const gapiInstance = gapiScript.gapi;
        
        gapiInstance.load('client', () => {
          gapiInstance.client.init({
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
          }).then(() => {
            gapiInstance.auth.setToken({ access_token: accessToken });
            fetchFiles(gapiInstance);
          }).catch(err => {
              console.error("Error initializing GAPI client", err);
              setLoading(false);
          });
        });
      } catch (e) {
        console.error("Error loading GAPI script", e);
        setLoading(false);
      }
    };

    initGapiClient();

  }, [accessToken, userLoading, fetchFiles]);


  const filteredDocuments = documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(doc => {
        if (filterType === 'all') return true;
        return doc.mimeType.includes(filterType);
    });

  const getFileType = (mimeType: string) => {
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

  const handleShare = (doc: Document) => {
    if (!navigator.share) {
      handleCopyLink(doc.webViewLink);
      return;
    }

    navigator.share({
      title: doc.name,
      text: `Check out this document: ${doc.name}`,
      url: doc.webViewLink,
    }).catch((error) => {
      // Fallback to copy link if sharing is not allowed or fails
      if (error.name === 'AbortError') {
        // This is fine, user cancelled the share sheet
        return;
      }
      console.error('Error sharing:', error);
      // Fallback for other errors
      handleCopyLink(doc.webViewLink);
    });
  };

  const handleTrash = (doc: Document) => {
    setShowTrashConfirm(doc);
  }

  const confirmTrash = () => {
    if (showTrashConfirm) {
        // Here you would call the API to move the file to trash
        // For now, we just remove it from the local state
        setDocuments(documents.filter(d => d.id !== showTrashConfirm.id));
        toast({
            title: "Moved to Trash",
            description: `${showTrashConfirm.name} has been moved to trash.`
        });
        setShowTrashConfirm(null);
    }
  }


  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 p-4 md:p-6">
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
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="document">Docs</SelectItem>
                        <SelectItem value="spreadsheet">Sheets</SelectItem>
                        <SelectItem value="presentation">Slides</SelectItem>
                        <SelectItem value="pdf">PDFs</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          {loading ? (
             <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-border rounded-lg">
                <Loader className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">
                    Fetching Documents...
                </h2>
                <p className="text-muted-foreground">Please wait while we connect to your accounts.</p>
             </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <ul className="divide-y divide-border">
                {filteredDocuments.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between p-4 group hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4 truncate">
                        {doc.icon}
                        <div className="truncate">
                            <p className="font-medium truncate">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Modified: {new Date(doc.modifiedTime).toLocaleDateString()} &middot; {getFileType(doc.mimeType)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => window.open(doc.webViewLink, '_blank')}>
                                    <ExternalLink className="mr-2 h-4 w-4" /> Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleShare(doc)}>
                                    <Share2 className="mr-2 h-4 w-4" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleCopyLink(doc.webViewLink)}>
                                    <Link2 className="mr-2 h-4 w-4" /> Copy Link
                                </DropdownMenuItem>
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
                    : 'Upload a document or connect a cloud account to get started.'
                  }
                </p>
                <Button onClick={onUploadClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Your First Document
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
      </main>
    </div>
  );
}

export default withAuth(DocumentsPage);
