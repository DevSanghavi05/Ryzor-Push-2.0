
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import withAuth from '@/firebase/auth/with-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Wand2, Presentation, Palette, FileText, Image as ImageIcon, BarChart2, Users, Bot, Download,
  Music, Sparkles, Share2, Type, Search, Plus, ThumbsUp, MoreVertical, Folder, Star
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

const RecentPresentationCard = ({ title, opened, imageUrl }: { title: string, opened: string, imageUrl: string }) => {
  return (
     <div className="space-y-2">
      <Card className="group cursor-pointer">
        <CardContent className="p-0 aspect-[4/3] flex items-center justify-center bg-secondary/30 relative overflow-hidden">
             <Image src={imageUrl} alt={title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
        </CardContent>
      </Card>
      <h3 className="font-medium text-foreground truncate">{title}</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Presentation className="h-4 w-4" />
        <span>Opened {opened}</span>
        <MoreVertical className="h-4 w-4 ml-auto cursor-pointer hover:text-foreground" />
      </div>
    </div>
  )
}


function SlidesPage() {
  const { toast } = useToast();
  const comingSoon = () => toast({ title: 'Coming Soon!', description: 'This feature is under development.' });

  const templates = [
      { title: 'AI Presentation Maker', isAi: true },
      { title: 'Portfolio', imageUrl: 'https://picsum.photos/seed/slide1/400/300' },
      { title: 'Lookbook', imageUrl: 'https://picsum.photos/seed/slide2/400/300' },
      { title: 'Wedding', imageUrl: 'https://picsum.photos/seed/slide3/400/300' },
      { title: 'Photo Album', imageUrl: 'https://picsum.photos/seed/slide4/400/300' },
  ];
  
  const recentPresentations = [
      { title: 'Q3 Earnings Report', opened: 'yesterday', imageUrl: 'https://picsum.photos/seed/recent1/400/300' },
      { title: 'Project Phoenix Kick-off', opened: 'Oct 28, 2024', imageUrl: 'https://picsum.photos/seed/recent2/400/300' },
      { title: 'Marketing Strategy 2025', opened: 'Oct 25, 2024', imageUrl: 'https://picsum.photos/seed/recent3/400/300' },
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recentPresentations.map((pres, i) => (
                    <RecentPresentationCard key={i} {...pres} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SlidesPage);


    