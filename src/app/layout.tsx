
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';

// Metadata needs to be exported from a server component, so we can't have it here anymore.
// We can re-add it if we create a nested layout structure.
// export const metadata: Metadata = {
//   title: 'Ryzor MVP',
//   description: 'Upload a PDF and ask it questions.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  React.useEffect(() => {
    // This code must run in a useEffect to avoid hydration errors,
    // as localStorage is only available on the client.
    const savedHue = localStorage.getItem('theme-hue');
    if (savedHue) {
      document.documentElement.style.setProperty('--primary-hue', savedHue);
    }
    const savedFont = localStorage.getItem('theme-font-class');
    if (savedFont) {
        document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
        document.body.classList.add(savedFont);
    }
  }, []);


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Ryzor</title>
        <meta name="description" content="No more folders. Just answers." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:hsl(var(--primary));' /><stop offset='100%' style='stop-color:hsl(var(--accent));' /></linearGradient></defs><path fill='url(%23g)' d='M20 80 V 20 H 60 L 80 50 L 60 80 H 20 Z M 35 65 V 35 H 50 L 50 50 H 45 V 65 H 35 Z' /></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=Lora:ital,wght@0,400..700;1,400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />

      </head>
      <body className="font-body antialiased flex flex-col min-h-dvh bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <Header />
            <main className="flex-1 flex flex-col relative z-[1]">{children}</main>
            <Footer />
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
