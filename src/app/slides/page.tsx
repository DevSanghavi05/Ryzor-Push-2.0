
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import withAuth from '@/firebase/auth/with-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Wand2, Presentation, Search, Plus, MoreVertical, Star, Folder, Loader2, Mail
} from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea';
import { useUser, AccountType } from '@/firebase';
import { useEffect, useState } from 'react';


const TemplateCard = ({ title, imageUrl, isAi = false }: { title: string, imageUrl?: string, isAi?: boolean }) => {
  const { toast } = useToast();
  const comingSoon = () => toast({ title: 'Coming Soon!', description: 'This feature is under development.' });

  const content = (
    <Card className="group cursor-pointer border-border hover:border-primary transition-colors duration-200">
      <CardContent className="p-0 aspect-[4/3] flex items-center justify-center bg-secondary/30 relative overflow-hidden">
        {imageUrl ? (
            <Image src={imageUrl} alt={title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
        ) : isAi ? (
            <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded-full">
                    <Plus className="h-6 w-6 text-white"/>
                </div>
            </div>
        ) : (
            <div className="h-full w-full bg-secondary"></div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-2">
        {isAi ? (
             <Dialog>
                <DialogTrigger asChild>
                    {content}
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>AI Presentation Maker</DialogTitle>
                        <DialogDescription>
                            Describe the presentation you want to create. The more detailed your prompt, the better the result.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea placeholder="e.g., 'A 10-slide presentation for a quarterly business review, focusing on sales performance and future goals.'" className="min-h-[120px]" />
                    <DialogFooter>
                        <Button onClick={comingSoon}>
                            <Wand2 className="mr-2 h-4 w-4"/> Generate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        ) : (
            <div onClick={comingSoon}>{content}</div>
        )}
      <p className="text-sm font-medium">{title}</p>
    </div>
  )
}

const RecentPresentationCard = ({ title, modifiedTime, webViewLink, iconLink }: { title: string, modifiedTime: string, webViewLink: string, iconLink: string }) => {
  return (
     <div className="space-y-2">
      <a href={webViewLink} target="_blank" rel="noopener noreferrer">
        <Card className="group cursor-pointer">
          <CardContent className="p-0 aspect-[4/3] flex items-center justify-center bg-secondary/30 relative overflow-hidden">
              <Image src={`https://picsum.photos/seed/${title}/400/300`} alt={title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
          </CardContent>
        </Card>
      </a>
      <h3 className="font-medium text-foreground truncate">{title}</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Image src={iconLink} alt="slide icon" width={16} height={16} />
        <span>Opened {new Date(modifiedTime).toLocaleDateString()}</span>
        <MoreVertical className="h-4 w-4 ml-auto cursor-pointer hover:text-foreground" />
      </div>
    </div>
  )
}


function SlidesPage() {
  const { toast } = useToast();
  const comingSoon = () => toast({ title: 'Coming Soon!', description: 'This feature is under development.' });
  const { workProvider, personalProvider, workAccessToken, personalAccessToken, fetchDriveFiles, signInWithGoogle } = useUser();
  
  const [presentations, setPresentations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connectedAccountType = workProvider ? 'work' : personalProvider ? 'personal' : null;
  
  useEffect(() => {
    const loadPresentations = async () => {
        if (!connectedAccountType) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const allFiles = await fetchDriveFiles(connectedAccountType);
            if(allFiles) {
                const slides = allFiles.filter(file => file.mimeType === 'application/vnd.google-apps.presentation')
                                     .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
                setPresentations(slides);
            }
        } catch (e: any) {
            setError('Failed to fetch presentations. Please try reconnecting your account.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    loadPresentations();
  }, [connectedAccountType, fetchDriveFiles]);

  const handleConnect = async (accountType: AccountType) => {
    toast({ title: `Connecting to Google ${accountType} Account...`, description: 'Please follow the prompts.' });
    try {
        await signInWithGoogle(accountType);
        // The useEffect will trigger a reload of presentations
        toast({ title: 'Successfully connected!', description: 'You can now see your presentations.'});
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: e.message });
    }
  };


  const templates = [
      { title: 'AI Presentation Maker', isAi: true },
      { title: 'Portfolio', imageUrl: 'https://picsum.photos/seed/slide1/400/300' },
      { title: 'Lookbook', imageUrl: 'https://picsum.photos/seed/slide2/400/300' },
      { title: 'Wedding', imageUrl: 'https://picsum.photos/seed/slide3/400/300' },
      { title: 'Photo Album', imageUrl: 'https://picsum.photos/seed/slide4/400/300' },
  ];
  

  return (
    <div className="relative min-h-screen w-full pt-16 bg-secondary/30">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-md">
                    <Presentation className="h-6 w-6 text-white"/>
                </div>
                <h1 className="text-2xl font-medium text-foreground">Slides</h1>
            </div>
            <div className="flex-1 max-w-2xl mx-8">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search" className="bg-background/50 h-12 pl-12 rounded-full border-border focus-visible:ring-primary"/>
                 </div>
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon"><Star className="h-5 w-5 text-muted-foreground"/></Button>
                 <Button variant="ghost" size="icon"><Folder className="h-5 w-5 text-muted-foreground"/></Button>
            </div>
        </div>

        {/* Start a new presentation */}
        <div className="bg-card/80 backdrop-blur-sm border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Start a new presentation</h2>
                <Button variant="ghost" onClick={comingSoon}>Template gallery</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {templates.map((template, i) => (
                    <TemplateCard key={i} {...template} />
                ))}
            </div>
        </div>
        
        {/* Recent presentations */}
        <div className="mt-10">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Recent presentations</h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={comingSoon}>Owned by anyone</Button>
                    {/* View toggles can go here */}
                </div>
            </div>
            {!connectedAccountType ? (
                <Card className="max-w-xl mx-auto text-center p-8">
                    <CardHeader>
                        <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>Connect your Google Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6 text-muted-foreground">Authorize Ryzor to access your Google Slides to see your presentations.</p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => handleConnect('work')}>Connect Work Account</Button>
                            <Button onClick={() => handleConnect('personal')}>Connect Personal Account</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center text-destructive p-8 bg-destructive/10 rounded-lg">{error}</div>
            ) : presentations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {presentations.map((pres, i) => (
                        <RecentPresentationCard key={i} {...pres} />
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    <p>No Google Slides presentations found in your connected account.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(SlidesPage);
