
'use client';

import { useEffect, useState } from 'react';
import withAuth from '@/firebase/auth/with-auth';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Trash2, Undo, AlertTriangle, Loader } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type TrashedDocument = {
  id: string;
  name: string;
  trashedAt: string;
  // Include other original properties if needed for restore
  [key: string]: any;
};

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

function TrashPage() {
  const { user, loading: userLoading } = useUser();
  const [trashedItems, setTrashedItems] = useState<TrashedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<TrashedDocument | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const loadAndCleanTrash = () => {
    if (!user) return;

    setLoading(true);
    const trashKey = `trash_${user.uid}`;
    const allTrash = JSON.parse(localStorage.getItem(trashKey) || '[]') as TrashedDocument[];
    
    const now = new Date().getTime();
    const recentTrash: TrashedDocument[] = [];
    let itemsExpired = 0;

    allTrash.forEach(item => {
      const trashedTime = new Date(item.trashedAt).getTime();
      if (now - trashedTime < THIRTY_DAYS_IN_MS) {
        recentTrash.push(item);
      } else {
        itemsExpired++;
        // Permanently delete content associated with expired item
        localStorage.removeItem(`document_content_${item.id}`);
      }
    });

    if (itemsExpired > 0) {
      localStorage.setItem(trashKey, JSON.stringify(recentTrash));
      toast({
        title: "Trash Cleaned",
        description: `${itemsExpired} item(s) older than 30 days were permanently deleted.`
      });
    }

    setTrashedItems(recentTrash.sort((a, b) => new Date(b.trashedAt).getTime() - new Date(a.trashedAt).getTime()));
    setLoading(false);
  };
  
  useEffect(() => {
    if (user) {
      loadAndCleanTrash();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRestore = (itemToRestore: TrashedDocument) => {
    if (!user) return;

    const trashKey = `trash_${user.uid}`;
    const docsKey = `documents_${user.uid}`;

    // Remove from trash
    const updatedTrash = trashedItems.filter(item => item.id !== itemToRestore.id);
    localStorage.setItem(trashKey, JSON.stringify(updatedTrash));
    setTrashedItems(updatedTrash);

    // Add back to documents
    const { trashedAt, ...originalDoc } = itemToRestore;
    const existingDocs = JSON.parse(localStorage.getItem(docsKey) || '[]');
    localStorage.setItem(docsKey, JSON.stringify([originalDoc, ...existingDocs]));

    toast({
        title: "Document Restored",
        description: `"${itemToRestore.name}" has been restored to your documents.`
    });
  };

  const confirmPermanentDelete = () => {
    if (!itemToDelete || !user) return;
    
    const trashKey = `trash_${user.uid}`;

    // Remove from trash state and storage
    const updatedTrash = trashedItems.filter(item => item.id !== itemToDelete.id);
    localStorage.setItem(trashKey, JSON.stringify(updatedTrash));
    setTrashedItems(updatedTrash);

    // Remove content blob from storage
    localStorage.removeItem(`document_content_${itemToDelete.id}`);

    toast({
      variant: 'destructive',
      title: "Permanently Deleted",
      description: `"${itemToDelete.name}" has been deleted forever.`,
    });

    setItemToDelete(null);
  };

  return (
    <div className="relative min-h-dvh w-full pt-16">
      <div className="bg-aurora"></div>
      <main className="flex-1 p-4 md:p-6 relative">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              Trash
            </h1>
            <p className="text-muted-foreground">Items are permanently deleted after 30 days.</p>
          </div>

          {(loading || userLoading) ? (
            <div className="flex justify-center py-16">
                <Loader className="w-8 h-8 animate-spin" />
            </div>
          ) : trashedItems.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <ul className="divide-y divide-border">
                {trashedItems.map(item => (
                  <li key={item.id} className="flex items-center justify-between p-4 group hover:bg-accent/50 transition-colors">
                    <div className="truncate">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Trashed on: {new Date(item.trashedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleRestore(item)}>
                        <Undo className="mr-2" />
                        Restore
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setItemToDelete(item)}>
                        <Trash2 className="mr-2" />
                        Delete Permanently
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-border rounded-lg">
              <Trash2 className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold font-headline mb-2">
                The trash is empty
              </h2>
              <p className="text-muted-foreground">Deleted documents will appear here.</p>
            </div>
          )}
        </div>
      </main>

       <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-destructive" /> Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the document "{itemToDelete?.name}" and remove all of its data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmPermanentDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Yes, Delete Permanently
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

export default withAuth(TrashPage);

    

    