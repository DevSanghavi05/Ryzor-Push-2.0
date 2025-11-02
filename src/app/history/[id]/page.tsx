'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import withAuth from '@/firebase/auth/with-auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { Logo } from '@/components/layout/logo';
import { motion } from 'framer-motion';

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

function ChatHistoryViewerPage() {
    const { user } = useUser();
    const params = useParams();
    const id = params.id as string;
    const [session, setSession] = useState<ChatSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            const historyKey = `chat_history_${user.uid}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]') as ChatSession[];
            const foundSession = history.find(s => s.id === id);
            setSession(foundSession || null);
            setLoading(false);
        }
    }, [user, id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin" />
            </div>
        );
    }
    
    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center">
                <h2 className="text-2xl font-bold mb-4">Chat Not Found</h2>
                <p className="text-muted-foreground mb-8">The requested chat session could not be found.</p>
                <Button asChild>
                    <Link href="/history">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to History
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full pt-16">
            <div className="bg-aurora"></div>
            <div className="relative container mx-auto py-12">
                <div className="mb-8">
                    <Button asChild variant="ghost">
                        <Link href="/history">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Chat History
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold font-headline mt-2">{session.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Saved on {new Date(session.savedAt).toLocaleString()}
                    </p>
                </div>

                 <div className="space-y-6 max-w-4xl mx-auto">
                    {session.messages.map((msg, i) => (
                        <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`flex gap-4 items-start ${
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                        >
                        {msg.role === 'model' && (
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 flex items-center justify-center text-white p-2 shrink-0 shadow-lg shadow-violet-500/30">
                            <Logo />
                            </div>
                        )}
                        <div
                            className={`px-5 py-3.5 rounded-2xl max-w-[80%] ${
                            msg.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/30' 
                                : 'bg-white/10 border border-white/10 backdrop-blur-sm'
                            }`}
                        >
                            <MarkdownContent content={msg.content} />
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-muted-foreground shrink-0 border border-white/10">
                            <User size={18} />
                            </div>
                        )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default withAuth(ChatHistoryViewerPage);
