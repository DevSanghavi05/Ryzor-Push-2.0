
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/firebase/auth/with-auth';
import { Paintbrush, Type } from 'lucide-react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const fontOptions = [
    { name: 'Default', body: 'Inter, sans-serif', headline: '"Space Grotesk", sans-serif', className: 'font-sans' },
    { name: 'Modern Serif', body: '"Lora", serif', headline: '"Playfair Display", serif', className: 'font-serif' },
    { name: 'Monospace', body: '"Roboto Mono", monospace', headline: '"IBM Plex Mono", monospace', className: 'font-mono' },
];


function SettingsPage() {
  const { toast } = useToast();
  const [hue, setHue] = useState(240);
  const [font, setFont] = useState('font-sans');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedHue = localStorage.getItem('theme-hue');
    if (savedHue) {
      setHue(parseInt(savedHue, 10));
    }
    const savedFont = localStorage.getItem('theme-font-class');
    if (savedFont) {
        setFont(savedFont);
    }
  }, []);

  // Apply settings when they change
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-hue', hue.toString());
    localStorage.setItem('theme-hue', hue.toString());
    
    document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
    document.body.classList.add(font);
    localStorage.setItem('theme-font-class', font);

  }, [hue, font]);

  const handleFontChange = (value: string) => {
    setFont(value);
    toast({
        title: 'Font Updated',
        description: 'The application font has been changed.',
    });
  }

  const handleHueChange = (value: number[]) => {
    setHue(value[0]);
  }
  
  const handleHueCommit = () => {
     toast({
        title: 'Color Updated',
        description: 'The primary theme color has been changed.',
    });
  }

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-12"
        >
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground mt-2">Customize your Ryzor experience.</p>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Paintbrush /> Appearance</CardTitle>
                    <CardDescription>Change the primary color of your workspace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Label>Primary Hue</Label>
                        <Slider
                            defaultValue={[hue]}
                            max={360}
                            step={1}
                            onValueChange={handleHueChange}
                            onValueCommit={handleHueCommit}
                            className="w-[60%]"
                        />
                        <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }} />
                    </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Type /> Typography</CardTitle>
                    <CardDescription>Choose the font style for your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={font} onValueChange={handleFontChange}>
                        {fontOptions.map(option => (
                            <div key={option.name} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.className} id={option.name} />
                                <Label htmlFor={option.name} className="flex-1">
                                    <span className="font-bold">{option.name}</span>
                                    <p className="text-sm text-muted-foreground" style={{ fontFamily: option.headline }}>Headline font example</p>
                                    <p className="text-sm text-muted-foreground" style={{ fontFamily: option.body }}>Body font example.</p>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
             </Card>

        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage);
