
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/firebase/auth/with-auth';
import { Loader2, Send, Mail, BookOpen, AlertCircle, Wand2, Inbox, RefreshCw, CornerUpLeft } from 'lucide-react';
import { summarizeEmails, draftReply, getEmails, summarizeSingleEmail, type Email } from '@/ai/flows/gmail-flow';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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


function GmailPage() {
  const { workAccessToken, personalAccessToken, signInWithGoogle, workProvider, personalProvider } = useUser();
  const { toast } = useToast();
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeCategory, setActiveCategory] = useState<'primary' | 'unread'>('primary');

  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  const [globalSummary, setGlobalSummary] = useState('');
  const [isGlobalSummaryOpen, setIsGlobalSummaryOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

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
      setError('Failed to fetch emails. Your token may have expired.');
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


  const handleConnect = async (accountType: 'work' | 'personal') => {
      toast({ title: 'Connecting to Google...', description: 'Please follow the prompts.'});
      try {
        await signInWithGoogle(accountType);
        toast({ title: 'Successfully connected!', description: 'You can now use the Gmail features.'});
      } catch(e: any) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: e.message });
      }
  }

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Gmail Assistant</h1>
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
                    <p className="mb-6 text-muted-foreground">Authorize Ryzor to access your Gmail to use this feature.</p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => handleConnect('work')}>Connect Work Account</Button>
                        <Button onClick={() => handleConnect('personal')}>Connect Personal Account</Button>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="border bg-card text-card-foreground rounded-lg shadow-lg max-w-7xl mx-auto h-[75vh] flex">
            {/* Sidebar */}
            <div className="w-64 border-r p-4 flex flex-col">
              <h2 className="text-xl font-bold mb-4">Inbox</h2>
              <div className="flex flex-col gap-2">
                <Button variant={activeCategory === 'primary' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => fetchEmails('primary')}>
                  <Inbox className="mr-2 h-4 w-4"/> Primary
                </Button>
                 <Button variant={activeCategory === 'unread' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => fetchEmails('unread')}>
                  <Mail className="mr-2 h-4 w-4"/> Unread
                </Button>
              </div>
            </div>

            {/* Email List */}
            <div className="w-[30rem] border-r flex flex-col">
              <div className="p-2 border-b flex items-center justify-between gap-2">
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
                      <li key={email.id} onClick={() => setSelectedEmail(email)}
                          className={`p-4 border-b cursor-pointer hover:bg-accent/50 ${selectedEmail?.id === email.id ? 'bg-accent' : ''}`}>
                          <div className="flex items-baseline justify-between text-xs">
                              <p className="font-bold truncate">{email.from.split('<')[0].trim()}</p>
                              <p className="text-muted-foreground">{new Date(email.date).toLocaleDateString()}</p>
                          </div>
                          <p className="font-semibold text-sm truncate mt-1">{email.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center p-20 text-muted-foreground">No emails found.</div>
                )}
              </ScrollArea>
            </div>

            {/* Email Detail */}
            <div className="flex-1 p-4 flex flex-col">
              {selectedEmail ? (
                <>
                  <div className="border-b pb-4">
                      <div className="flex items-center gap-4">
                          <Avatar>
                              <AvatarFallback>{selectedEmail.from.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                              <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
                              <p className="text-sm text-muted-foreground">From: {selectedEmail.from}</p>
                              <p className="text-sm text-muted-foreground">Date: {new Date(selectedEmail.date).toLocaleString()}</p>
                          </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={handleSummarizeSingle} disabled={isSummarizing}>
                           {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>} Summarize
                        </Button>
                         <Button size="sm" onClick={() => setIsDraftModalOpen(true)}>
                           <CornerUpLeft className="mr-2 h-4 w-4"/> Draft Reply
                        </Button>
                      </div>
                  </div>
                  <ScrollArea className="flex-1 mt-4">
                    <div className="prose prose-sm dark:prose-invert max-w-full whitespace-pre-wrap"
                         dangerouslySetInnerHTML={{ __html: selectedEmail.body || ''}} />
                  </ScrollArea>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <div >
                    <Mail className="h-16 w-16 mx-auto mb-4"/>
                    <p>Select an email to read</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
              <Send className="mr-2 h-4 w-4" /> Open in Gmail
            </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default withAuth(GmailPage);

    