
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import withAuth from '@/firebase/auth/with-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Wand2, Presentation, Palette, FileText, Image as ImageIcon, BarChart2, Users, Bot, Download,
  Music, Sparkles, Share2, Type
} from 'lucide-react';

const FeatureButton = ({ icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) => {
  const Icon = icon;
  return (
    <Button variant="ghost" className="w-full h-auto justify-start p-3 text-left" onClick={onClick}>
      <Icon className="h-5 w-5 mr-3 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Button>
  );
}

function SlidesPage() {
  const { toast } = useToast();
  const comingSoon = () => toast({ title: 'Coming Soon!', description: 'This feature is under development.' });

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <div className="h-[80vh] flex border bg-card/80 text-card-foreground backdrop-blur-sm rounded-lg shadow-lg">

          {/* Sidebar */}
          <div className="w-80 border-r p-4 flex flex-col gap-4">
            <h2 className="text-lg font-semibold px-3">AI Toolkit</h2>
            <Separator />
            <FeatureButton icon={FileText} title="Content Generation" description="Draft slides from a prompt or doc." onClick={comingSoon} />
            <FeatureButton icon={Palette} title="Design Automation" description="Smart templates and layouts." onClick={comingSoon} />
            <FeatureButton icon={Type} title="AI Text Editor" description="Rewrite, summarize, and polish." onClick={comingSoon} />
            <FeatureButton icon={ImageIcon} title="Image Generation" description="Create visuals and icons." onClick={comingSoon} />
            <FeatureButton icon={BarChart2} title="Data Visualization" description="Generate charts and diagrams." onClick={comingSoon} />
            <Separator />
            <h2 className="text-lg font-semibold px-3 mt-4">Advanced</h2>
             <FeatureButton icon={Music} title="AI Voiceover & Music" description="Generate audio for your slides." onClick={comingSoon} />
             <FeatureButton icon={Sparkles} title="Brand Sync" description="Ensure consistent branding." onClick={comingSoon} />
             <FeatureButton icon={Users} title="Collaboration" description="Real-time editing and comments." onClick={comingSoon} />
            <Separator />
             <div className="mt-auto space-y-2">
                <Button variant="outline" className="w-full" onClick={comingSoon}><Share2 className="mr-2 h-4 w-4"/> Integrate</Button>
                <Button className="w-full" onClick={comingSoon}><Download className="mr-2 h-4 w-4" /> Export</Button>
             </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background/30">
            <div className="w-full max-w-4xl text-center">
                <div className="mx-auto w-fit mb-6 bg-primary/10 p-4 rounded-full">
                    <Presentation className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-4xl font-bold font-headline mb-4">AI Presentation Maker</h1>
                <p className="text-muted-foreground mb-8 text-lg">
                    Describe your presentation, and let AI build the first draft.
                </p>

                <div className="relative">
                    <Input
                        id="presentation-prompt"
                        placeholder="e.g., 'A 10-slide presentation on the future of renewable energy'"
                        className="h-14 text-lg pr-16 rounded-full shadow-lg"
                        onKeyDown={(e) => e.key === 'Enter' && comingSoon()}
                    />
                    <Button 
                        size="icon" 
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full h-10 w-10"
                        onClick={comingSoon}
                    >
                        <Wand2 className="h-5 w-5" />
                    </Button>
                </div>
                
                 <div className="mt-24 p-8 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">Your presentation will appear here.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SlidesPage);
