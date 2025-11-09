'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/firebase/auth/with-auth';
import { Loader2, Send, Mail, AlertCircle, Wand2, Inbox, RefreshCw, CornerUpLeft, Archive, Trash2, FileEdit } from 'lucide-react';
import { summarizeEmails, draftReply, getEmails, summarizeSingleEmail, type Email, draftNewEmail } from '@/ai/flows/gmail-flow';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { useRouter } from 'next/navigation';


function MailPage() {
  const { workAccessToken, personalAccessToken, signInWithGoogle, workProvider, personalProvider } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeCategory, setActiveCategory] = useState<'primary' | 'unread'>('primary');

  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  const [globalSummary, setGlobalSummary] = useState('');
  const [isGlobalSummaryOpen, setIsGlobalSummaryOpen] = useState(false);
  
  // State for drafting replies
  const [draft, setDraft] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  
  // State for composing new emails
  const [newEmailDraft, setNewEmailDraft] = useState('');
  const [newEmailPrompt, setNewEmailPrompt] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  const [error, setError] = useState('');
  
  const accessToken = workAccessToken || personalAccessToken;
  const connectedAccountType = workProvider ? 'work' : (personalProvider ? 'personal' : null);

  const fetchEmails = async (category: 'primary' | 'unread' = 'primary') => {
    if (!accessToken) return;
    setIsLoading(true);
    setError('');
    setSelectedEmail(null);
    try {
      const result = await getEmails({ accessToken, category, count: 25 });
      setEmails(result.emails);
      setActiveCategory(category);
    } catch (e: any) {
      setError('Failed to fetch emails. Your token may have expired. Please reconnect from the Documents page.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEmails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);


  const handleGlobalSummarize = async (read: boolean) => {
    if (!accessToken) return;
    setIsSummarizing(true);
    setGlobalSummary('');
    try {
      const result = await summarizeEmails({ accessToken, count: 10, read });
      setGlobalSummary(result.summary);
      setIsGlobalSummaryOpen(true);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to generate summary' });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSummarizeSingle = async () => {
    if (!selectedEmail || !accessToken) return;
    setIsSummarizing(true);
    try {
        const { summary } = await summarizeSingleEmail({ email: selectedEmail, accessToken });
        toast({
            title: "Email Summary",
            description: <p className="mt-2 p-3 bg-secondary rounded-md">{summary}</p>,
            duration: 9000,
        });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Failed to summarize email" });
    } finally {
        setIsSummarizing(false);
    }
  };
  
  const handleOpenEmail = (email: Email) => {
    setSelectedEmail(email);
    setIsEmailModalOpen(true);
  }
  
  const handleOpenDraftModal = () => {
    setDraft('');
    setDraftPrompt('');
    setIsEmailModalOpen(false);
    setIsDraftModalOpen(true);
  }
  
  const handleOpenComposeModal = () => {
    setNewEmailDraft('');
    setNewEmailPrompt('');
    setIsComposeModalOpen(true);
  }

  const handleDraftReply = async () => {
    if (!selectedEmail || !accessToken || !draftPrompt) return;
    setIsDrafting(true);
    setDraft('');
    try {
      const { draft: draftContent } = await draftReply({
        prompt: draftPrompt,
        emailToReplyTo: selectedEmail,
        accessToken
      });
      setDraft(draftContent);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to generate draft' });
    } finally {
      setIsDrafting(false);
    }
  };
  
  const handleDraftNew = async () => {
    if (!accessToken || !newEmailPrompt) return;
    setIsComposing(true);
    setNewEmailDraft('');
    try {
        const { draft } = await draftNewEmail({ prompt: newEmailPrompt, accessToken });
        setNewEmailDraft(draft);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Failed to generate draft' });
    } finally {
        setIsComposing(false);
    }
  }

  const handleAction = (action: 'archive' | 'delete') => {
    toast({
        title: `Action: ${action}`,
        description: `This is a demo. The email would be ${action}d.`,
    });
  }

  const truncateSnippet = (snippet: string, wordLimit: number) => {
    const words = snippet.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return snippet;
  }


  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Mail Assistant</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Summarize, draft, and manage your inbox with AI.
          </p>
        </div>

        {!connectedAccountType ? (
            <Card className="max-w-xl mx-auto text-center p-8">
                <CardHeader>
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Connect your Google Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-6 text-muted-foreground">To use the Mail Assistant, connect your Google account from the Documents page.</p>
                    <Button onClick={() => router.push('/documents')}>Go to Documents</Button>
                </CardContent>
            </Card>
        ) : (
          <div className="border bg-card text-card-foreground rounded-lg shadow-lg max-w-7xl mx-auto h-[75vh] flex">
            {/* Sidebar */}
            <div className="w-64 border-r p-4 flex flex-col gap-2">
              <Button size="lg" className="mb-4 rounded-full h-12" onClick={handleOpenComposeModal}>
                <FileEdit className="mr-2 h-5 w-5"/> Compose
              </Button>
              <div className="flex flex-col gap-1">
                <Button variant={activeCategory === 'primary' ? 'secondary' : 'ghost'} className="justify-start rounded-full text-base py-6" onClick={() => fetchEmails('primary')}>
                  <Inbox className="mr-3 h-5 w-5"/> Primary
                </Button>
                 <Button variant={activeCategory === 'unread' ? 'secondary' : 'ghost'} className="justify-start rounded-full text-base py-6" onClick={() => fetchEmails('unread')}>
                  <Mail className="mr-3 h-5 w-5"/> Unread
                </Button>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchEmails(activeCategory)} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin':''}`} /> Refresh
                  </Button>
                  <div className='flex gap-2'>
                    <Button variant="outline" size="sm" onClick={() => handleGlobalSummarize(false)} disabled={isSummarizing}>
                      {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>} Summarize Unread
                    </Button>
                  </div>
              </div>
              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                ) : emails.length > 0 ? (
                  <ul>
                    {emails.map(email => (
                      <li key={email.id}
                          className="group p-4 border-b cursor-pointer hover:bg-accent/50 flex justify-between items-start"
                          onClick={() => handleOpenEmail(email)}
                       >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between">
                                <p className="font-bold truncate text-sm">{email.from.split('<')[0].trim()}</p>
                                <p className="text-xs text-muted-foreground">{new Date(email.date).toLocaleDateString()}</p>
                            </div>
                            <p className="font-medium text-sm truncate mt-1">{email.subject}</p>
                            <p className="text-xs text-muted-foreground">{truncateSnippet(email.snippet, 15)}</p>
                          </div>
                          <div className="ml-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleAction('archive')}}><Archive className="h-4 w-4 text-muted-foreground" /></Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleAction('delete')}}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                          </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center p-20 text-muted-foreground">No emails found.</div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Global Summary Modal */}
       <Dialog open={isGlobalSummaryOpen} onOpenChange={setIsGlobalSummaryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inbox Summary</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-full p-4 bg-secondary rounded-md">
            {isSummarizing ? <Loader2 className="animate-spin" /> : globalSummary}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Email View Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          {selectedEmail && (
            <>
              <DialogHeader>
                  <DialogTitle className="truncate">{selectedEmail.subject}</DialogTitle>
                  <DialogDescription>
                      From: {selectedEmail.from} | {new Date(selectedEmail.date).toLocaleString()}
                  </DialogDescription>
              </DialogHeader>
              <div className="border-t -mx-6 px-6 pt-4 flex-1 min-h-0">
                  <ScrollArea className="h-full">
                      <div className="prose prose-sm dark:prose-invert max-w-full whitespace-pre-wrap"
                           dangerouslySetInnerHTML={{ __html: selectedEmail.body || ''}} />
                  </ScrollArea>
              </div>
              <DialogFooter className="border-t -mx-6 px-6 pt-4">
                <Button size="sm" onClick={handleSummarizeSingle} disabled={isSummarizing}>
                   {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>} Summarize
                </Button>
                 <Button size="sm" onClick={handleOpenDraftModal}>
                   <CornerUpLeft className="mr-2 h-4 w-4"/> Draft Reply
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Draft Reply Modal */}
      <Dialog open={isDraftModalOpen} onOpenChange={setIsDraftModalOpen}>
        <DialogContent className="sm:max-w-2xl">
           <DialogHeader>
            <DialogTitle>Draft a Reply</DialogTitle>
            <DialogDescription>
              Replying to: &quot;{selectedEmail?.subject}&quot;
            </DialogDescription>
          </DialogHeader>
           <div className="grid gap-4 py-4">
              <Textarea 
                id="draft-prompt"
                placeholder="Your instructions for the reply (e.g., 'Politely decline the invitation and suggest next week.')"
                value={draftPrompt}
                onChange={e => setDraftPrompt(e.target.value)}
              />
               <Button onClick={handleDraftReply} disabled={isDrafting}>
                 {isDrafting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                 Generate Draft
               </Button>
               <Separator />
               <div className="min-h-[200px] p-4 border rounded-md bg-background/50">
                  <h3 className="font-semibold mb-2">Generated Draft:</h3>
                  {isDrafting ? (
                      <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                  ) : draft ? (
                      <MarkdownContent content={draft} />
                  ) : (
                      <p className="text-muted-foreground text-center pt-8">Your AI-generated draft will appear here.</p>
                  )}
              </div>
           </div>
           <DialogFooter>
             <Button disabled={!draft} onClick={() => toast({title: "Coming Soon!", description: "This would open a Gmail compose window."})}>
              <Send className="mr-2 h-4 w-4" /> Open in Mail
            </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
       {/* Compose Modal */}
       <Dialog open={isComposeModalOpen} onOpenChange={setIsComposeModalOpen}>
        <DialogContent className="sm:max-w-2xl">
           <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
           <div className="grid gap-4 py-4">
              <input placeholder="To" className="p-2 bg-transparent border-b" />
              <input placeholder="Subject" className="p-2 bg-transparent border-b" />
               <Textarea 
                  id="compose-body"
                  placeholder="Your message..."
                  className="min-h-[200px] mt-2"
                  value={newEmailDraft}
                  onChange={e => setNewEmailDraft(e.target.value)}
              />
              <Separator />
               <div className="space-y-2">
                 <label htmlFor="compose-prompt" className="text-sm font-medium">Smart Compose</label>
                 <Textarea 
                    id="compose-prompt"
                    placeholder="Tell the AI what to write (e.g., 'Draft an intro email to the marketing team...')"
                    value={newEmailPrompt}
                    onChange={e => setNewEmailPrompt(e.target.value)}
                  />
                   <Button onClick={handleDraftNew} disabled={isComposing} className="w-full">
                     {isComposing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                     Generate
                   </Button>
               </div>
           </div>
           <DialogFooter>
             <Button onClick={() => toast({title: "Coming Soon!", description: "This would send the email."})} disabled={!newEmailDraft}>
              <Send className="mr-2 h-4 w-4" /> Send
            </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default withAuth(MailPage);
