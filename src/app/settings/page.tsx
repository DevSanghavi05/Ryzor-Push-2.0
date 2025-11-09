
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { Palette, Sun, Moon, UserCog, Link as LinkIcon, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser, AccountType } from '@/firebase/auth/use-user';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2">
        <title>Google</title>
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, workProvider, personalProvider, signInWithGoogle, disconnectGoogleAccount } = useUser();
  
  const [hue, setHue] = useState(240);
  const [saturation, setSaturation] = useState(10);
  const [lightness, setLightness] = useState(4);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryColor = rootStyle.getPropertyValue('--primary').trim();
      if (primaryColor) {
        const [h, s, l] = primaryColor.split(' ').map(parseFloat);
        if(!isNaN(h) && !isNaN(s) && !isNaN(l)) {
          setHue(h);
          setSaturation(s);
          setLightness(l);
        }
      }
    }
  }, []);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value, 10);
    setHue(newHue);
    document.documentElement.style.setProperty('--primary-hue', newHue.toString());
  };

  const handleSaveTheme = () => {
    toast({
      title: 'Theme Saved!',
      description: 'Your new brand color has been applied.',
    });
    // In a real app, this would persist to a database.
    // For now, it's just a live preview that resets on refresh.
  };

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

  const tempPrimary = `${hue} ${saturation}% ${lightness}%`;
  const tempForeground = `${hue} 0% 98%`;

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
                    <CardDescription>Connect or disconnect your accounts. Permissions are managed through your provider.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Work Account */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><GoogleIcon /> Google Work Account</h3>
                            <p className="text-sm text-muted-foreground">{workProvider ? `Connected` : 'Not connected'}</p>
                        </div>
                        {workProvider ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Disconnect</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle /> Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will disconnect your Google Work account from Ryzor. You will need to reconnect it to access its data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDisconnect('work')} className="bg-destructive hover:bg-destructive/90">Disconnect</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Button onClick={() => handleConnect('work')}><LinkIcon className="mr-2 h-4 w-4"/> Connect</Button>
                        )}
                    </div>
                    {/* Personal Account */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2"><GoogleIcon /> Google Personal Account</h3>
                            <p className="text-sm text-muted-foreground">{personalProvider ? `Connected` : 'Not connected'}</p>
                        </div>
                         {personalProvider ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Disconnect</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle /> Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will disconnect your Google Personal account from Ryzor. You will need to reconnect it to access its data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDisconnect('personal')} className="bg-destructive hover:bg-destructive/90">Disconnect</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Button onClick={() => handleConnect('personal')}><LinkIcon className="mr-2 h-4 w-4"/> Connect</Button>
                        )}
                    </div>
                    <div className="pt-4 text-xs text-muted-foreground flex gap-2 items-center">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Ryzor requests read-only permissions for Drive, Gmail, and Calendar to provide its services. We never store your passwords. You can revoke access at any time from your Google Account settings.</span>
                    </div>
                </CardContent>
            </Card>

            <Separator />
            
            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
                    <CardDescription>Choose a primary color that reflects your brand or style.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                    <label htmlFor="hue-slider" className="font-medium">
                        Primary Color Hue
                    </label>
                    <input
                        id="hue-slider"
                        type="range"
                        min="0"
                        max="360"
                        value={hue}
                        onChange={handleColorChange}
                        className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                        style={{
                        background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
                        }}
                    />
                    <div className="text-center text-sm text-muted-foreground">
                        Hue: {hue}
                    </div>
                    </div>

                    <div className="space-y-4">
                    <h3 className="font-medium text-center">Live Preview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-black flex items-center gap-2"><Sun className="w-5 h-5"/> Light Mode</h4>
                            <div style={{ backgroundColor: `hsl(${tempPrimary})` }} className="w-6 h-6 rounded-full border"></div>
                        </div>
                        <Button style={{ backgroundColor: `hsl(${tempPrimary})`, color: `hsl(${tempForeground})` }}>
                            Primary Button
                        </Button>
                        <p className="text-sm" style={{color: `hsl(${tempPrimary})`}}>This is some sample accent text.</p>
                        </div>
                        <div className="border rounded-lg p-6 bg-gray-900 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white flex items-center gap-2"><Moon className="w-5 h-5"/> Dark Mode</h4>
                            <div style={{ backgroundColor: `hsl(${tempForeground})` }} className="w-6 h-6 rounded-full border"></div>
                        </div>
                        <Button style={{ backgroundColor: `hsl(${tempForeground})`, color: `hsl(${tempPrimary})` }}>
                            Primary Button
                        </Button>
                        <p className="text-sm" style={{color: `hsl(${tempForeground})`}}>This is some sample accent text.</p>
                        </div>
                    </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                    <Button variant="ghost" onClick={() => router.push('/')}>Cancel</Button>
                    <Button onClick={handleSaveTheme}>Save Theme</Button>
                    </div>
                </CardContent>
            </Card>

        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage);
