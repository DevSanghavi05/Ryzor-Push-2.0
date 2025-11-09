
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { UserCog, AlertTriangle, ShieldCheck, MessageSquare, Mail, Calendar, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser, AccountType } from '@/firebase/auth/use-user';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2">
        <title>Google</title>
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const ServiceToggle = ({
    label,
    icon,
    accountType,
    serviceConnected,
    onToggle
}: {
    label: string,
    icon: React.ReactNode,
    accountType: AccountType,
    serviceConnected: boolean,
    onToggle: (checked: boolean) => void
}) => {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className='flex items-center gap-3'>
                {icon}
                <div>
                    <h3 className="font-semibold">{label}</h3>
                    <p className="text-sm text-muted-foreground">{serviceConnected ? `Connected` : 'Not connected'}</p>
                </div>
            </div>
            <Switch
                checked={serviceConnected}
                onCheckedChange={onToggle}
            />
        </div>
    )
}

function SettingsPage() {
  const { toast } = useToast();
  const { user, workProvider, personalProvider, signInWithGoogle, disconnectGoogleAccount } = useUser();
  const [feedback, setFeedback] = useState('');
  
  const handleConnect = async (accountType: AccountType) => {
      toast({ title: `Connecting to Google ${accountType} account...`});
      try {
        await signInWithGoogle(accountType);
        toast({ title: `Successfully connected to Google ${accountType} account.` });
      } catch(e: any) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: e.message });
      }
  }

  const handleDisconnect = (accountType: AccountType) => {
      disconnectGoogleAccount(accountType);
      toast({ title: `Disconnected from Google ${accountType} account.`});
  }
  
  const handleFeedbackSubmit = () => {
    if(!feedback.trim()) {
        toast({ variant: 'destructive', title: 'Please enter your feedback.'});
        return;
    }
    toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for helping us improve Ryzor.'
    });
    setFeedback('');
  }

  const handleToggle = (accountType: AccountType, serviceConnected: boolean) => {
    if (serviceConnected) {
      // Logic to show a confirmation dialog before disconnecting
      disconnectGoogleAccount(accountType);
    } else {
      handleConnect(accountType);
    }
  }

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-12"
        >
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your accounts, permissions, and workspace appearance.</p>
            </div>

            {/* Accounts & Permissions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCog /> Accounts & Permissions</CardTitle>
                    <CardDescription>Connect or disconnect your accounts to grant or revoke access to services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Work Account */}
                    <div className='space-y-4'>
                        <h3 className="font-semibold text-lg flex items-center gap-2"><GoogleIcon /> Google Work Account</h3>
                        <div className="space-y-2 pl-4 border-l-2">
                             <ServiceToggle 
                                label="Google Drive"
                                icon={<Folder />}
                                accountType="work"
                                serviceConnected={!!workProvider}
                                onToggle={(checked) => handleToggle('work', checked)}
                            />
                             <ServiceToggle 
                                label="Gmail"
                                icon={<Mail />}
                                accountType="work"
                                serviceConnected={!!workProvider}
                                onToggle={(checked) => handleToggle('work', checked)}
                            />
                             <ServiceToggle 
                                label="Google Calendar"
                                icon={<Calendar />}
                                accountType="work"
                                serviceConnected={!!workProvider}
                                onToggle={(checked) => handleToggle('work', checked)}
                            />
                        </div>
                    </div>
                    <Separator />
                    {/* Personal Account */}
                     <div className='space-y-4'>
                        <h3 className="font-semibold text-lg flex items-center gap-2"><GoogleIcon /> Google Personal Account</h3>
                        <div className="space-y-2 pl-4 border-l-2">
                             <ServiceToggle 
                                label="Google Drive"
                                icon={<Folder />}
                                accountType="personal"
                                serviceConnected={!!personalProvider}
                                onToggle={(checked) => handleToggle('personal', checked)}
                            />
                             <ServiceToggle 
                                label="Gmail"
                                icon={<Mail />}
                                accountType="personal"
                                serviceConnected={!!personalProvider}
                                onToggle={(checked) => handleToggle('personal', checked)}
                            />
                             <ServiceToggle 
                                label="Google Calendar"
                                icon={<Calendar />}
                                accountType="personal"
                                serviceConnected={!!personalProvider}
                                onToggle={(checked) => handleToggle('personal', checked)}
                            />
                        </div>
                    </div>
                    <div className="pt-4 text-xs text-muted-foreground flex gap-2 items-start">
                        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Ryzor requests read-only permissions for Drive, Gmail, and Calendar to provide its services. We never store your passwords. You can revoke access at any time from your Google Account settings.</span>
                    </div>
                </CardContent>
            </Card>

             <Separator />

             {/* Feedback */}
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Submit Feedback</CardTitle>
                    <CardDescription>Have an idea or found a bug? Let us know!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Tell us what you think..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[120px]"
                    />
                     <div className="flex justify-end">
                         <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
                    </div>
                </CardContent>
             </Card>

        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage);
