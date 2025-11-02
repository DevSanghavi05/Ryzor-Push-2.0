'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import withAuth from '@/firebase/auth/with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ArrowRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface ChatSession {
    id: string;
    savedAt: string;
    messages: Message[];
    title: string;
}


function ChatHistoryPage() {
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [history, setHistory] = useState<ChatSession[]>([]);
    const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);

    useEffect(() => {
        if (user) {
            const historyKey = `chat_history_${user.uid}`;
            const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]') as ChatSession[];
            setHistory(storedHistory.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
        }
    }, [user]);

    const handleDeleteSession = () => {
        if (!user || !sessionToDelete) return;
        const historyKey = `chat_history_${user.uid}`;
        const updatedHistory = history.filter(s => s.id !== sessionToDelete.id);
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        toast({
            variant: 'destructive',
            title: 'Chat Deleted',
            description: 'The conversation has been removed from your history.',
        });
        setSessionToDelete(null);
    }

    return (
        <div className="relative min-h-screen w-full pt-16">
            <div className="bg-aurora"></div>
            <div className="relative container mx-auto py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-headline">Chat History</h1>
                    <p className="text-muted-foreground mt-2">Review your saved conversations.</p>
                </div>

                {history.length === 0 ? (
                     <Card className="text-center py-20">
                        <CardHeader>
                            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-2xl font-bold">No Saved Chats</h2>
                            <p className="text-muted-foreground mt-2">You haven't saved any chats yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {history.map(session => (
                            <Card key={session.id} className="hover:bg-accent/5 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{session.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Saved on {new Date(session.savedAt).toLocaleString()} &middot; {session.messages.length} messages
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setSessionToDelete(session)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" onClick={() => router.push(`/history/${session.id}`)}>
                                            View Chat <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this chat history. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default withAuth(ChatHistoryPage);
