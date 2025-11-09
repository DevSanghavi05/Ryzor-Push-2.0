
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import withAuth from '@/firebase/auth/with-auth';
import { Palette, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  // HSL is used for theming. H(ue) is the color, S(aturation) and L(ightness) control the shade.
  const [hue, setHue] = useState(240); // Default: Blue
  const [saturation, setSaturation] = useState(10);
  const [lightness, setLightness] = useState(4);

  useEffect(() => {
    // On load, try to get the current theme from CSS variables to initialize the sliders
    if (typeof window !== 'undefined') {
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryColor = rootStyle.getPropertyValue('--primary').trim();
      if (primaryColor) {
        const [h, s, l] = primaryColor.split(' ').map(parseFloat);
        setHue(h);
        setSaturation(s);
        setLightness(l);
      }
    }
  }, []);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value, 10);
    setHue(newHue);
    // Dynamically update the CSS variable for live preview
    document.documentElement.style.setProperty('--primary-hue', newHue.toString());
  };

  const handleSave = () => {
    // In a real app, this would make an API call to save the user's theme preference.
    // For this demo, we'll just show a confirmation and redirect.
    toast({
      title: 'Theme Saved!',
      description: 'Your new brand color has been applied.',
    });
    // We assume the CSS is updated by a build process or a server-side mechanism
    // after saving. Since we can't do that here, we'll just redirect.
    router.push('/');
  };
  
  const tempPrimary = `${hue} ${saturation}% ${lightness}%`;
  const tempForeground = `${hue} 0% 98%`;

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6 flex items-center justify-center">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <Palette className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="text-3xl font-headline">Customize Your Workspace</CardTitle>
            <p className="text-muted-foreground">
              Choose a primary color that reflects your brand or style.
            </p>
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

            {/* Theme Preview */}
            <div className="space-y-4">
              <h3 className="font-medium text-center">Live Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light Mode Preview */}
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
                {/* Dark Mode Preview */}
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
              <Button variant="ghost" onClick={() => router.push('/')}>Skip for Now</Button>
              <Button onClick={handleSave}>Save and Continue</Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage);
