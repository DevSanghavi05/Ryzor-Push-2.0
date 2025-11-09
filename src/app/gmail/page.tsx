'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/firebase/auth/with-auth';
import { Loader2, Send, Mail, BookOpen, AlertCircle, Wand2 } from 'lucide-react';
import { summarizeEmails, draftReply } from '@/ai/flows/gmail-flow';
import { MarkdownContent } from '@/components/chat/markdown-content';

function GmailPage() {
  const { workAccessToken, personalAccessToken, signInWithGoogle, workProvider, personalProvider } = useUser();
  const { toast } = useToast();
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftingEmailId, setDraftingEmailId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  
  const handleSummarize = async (read: boolean) => {
    setIsLoading(true);
    setSummary('');
    setError('');

    // Prefer work account, fallback to personal
    const accessToken = workAccessToken || personalAccessToken;
    const accountType = workAccessToken ? 'work' : 'personal';

    if (!accessToken) {
      toast({
        variant: 'destructive',
        title: 'Not Connected',
        description: 'Please connect a Google account to summarize emails.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await summarizeEmails({
        accessToken,
        count: 5,
        read: read,
      });

      if(result.emails.length === 0) {
        setSummary(`No ${read ? 'read' : 'unread'} emails found.`);
      } else {
        const formattedSummary = result.emails.map(e => 
          `**From:** ${e.from}\n**Subject:** ${e.subject}\n**Summary:** ${e.summary}`
        ).join('\n\n---\n\n');
        setSummary(formattedSummary);
      }
    } catch (e: any) {
      setError('Failed to summarize emails. Your authentication token might have expired. Please try reconnecting your account.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDraftReply = async (prompt: string, emailContext: string) => {
      setIsDrafting(true);
      const accessToken = workAccessToken || personalAccessToken;
      if (!accessToken) {
          toast({ variant: 'destructive', title: 'Not Connected' });
          setIsDrafting(false);
          return;
      }

      try {
          const result = await draftReply({
              prompt,
              emailContext,
              accessToken,
          });
          setDraftContent(result.draft);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to generate draft.' });
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
  
  const connectedAccount = workProvider ? 'Work' : personalProvider ? 'Personal' : null;

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Gmail Assistant</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Let AI summarize your inbox and help you draft replies.
          </p>
        </div>

        {!connectedAccount ? (
            <Card className="max-w-xl mx-auto text-center p-8">
                <CardHeader>
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Connect your Google Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-6 text-muted-foreground">You need to authorize Ryzor to access your Gmail to use this feature.</p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => handleConnect('work')}>Connect Work Account</Button>
                        <Button onClick={() => handleConnect('personal')}>Connect Personal Account</Button>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Inbox Summary</CardTitle>
                <p className="text-sm text-muted-foreground">Connected Account: {connectedAccount}</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Button onClick={() => handleSummarize(false)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                    Summarize Unread (5)
                  </Button>
                  <Button onClick={() => handleSummarize(true)} disabled={isLoading} variant="secondary">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                    Summarize Recent (5)
                  </Button>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm flex items-center gap-3">
                    <AlertCircle className="h-5 w-5"/>
                    <div>
                      <p className='font-bold'>Authentication Error</p>
                      <p>{error}</p>
                      <Button variant="link" className="p-0 h-auto mt-1" onClick={() => handleConnect(workProvider ? 'work' : 'personal')}>Reconnect Now</Button>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-4 border rounded-lg bg-background/50 min-h-[200px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : summary ? (
                    <MarkdownContent content={summary} />
                  ) : (
                    <p className="text-muted-foreground text-center pt-10">Click a button to generate a summary.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Draft Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste the email content you want to reply to here..."
                    className="min-h-[150px]"
                    id="email-context"
                  />
                  <Textarea
                    placeholder="Your instructions for the reply (e.g., 'Politely decline the invitation and suggest next week.')"
                    id="reply-prompt"
                  />
                  <Button onClick={() => handleDraftReply(
                      (document.getElementById('reply-prompt') as HTMLTextAreaElement).value,
                      (document.getElementById('email-context') as HTMLTextAreaElement).value
                  )} disabled={isDrafting}>
                    {isDrafting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate Draft
                  </Button>

                   <div className="mt-4 p-4 border rounded-lg bg-background/50 min-h-[150px]">
                    <h3 className="font-semibold mb-2">Generated Draft:</h3>
                    {isDrafting ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : draftContent ? (
                        <MarkdownContent content={draftContent} />
                    ) : (
                        <p className="text-muted-foreground text-center pt-8">Your AI-generated draft will appear here.</p>
                    )}
                </div>
                 <Button disabled={!draftContent || isDrafting}>
                    <Send className="mr-2 h-4 w-4" /> Send with your Gmail
                </Button>
                <p className="text-xs text-muted-foreground">Note: Sending functionality is for demonstration. In a real app, this would open a pre-populated Gmail compose window.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(GmailPage);
