
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
//   title: 'Ryzor AI MVP',
//   description: 'Upload a PDF and ask it questions.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Ryzor AI MVP</title>
        <meta name="description" content="Upload a PDF and ask it questions." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:hsl(184, 99%, 34%);' /><stop offset='100%' style='stop-color:hsl(266, 100%, 50%);' /></linearGradient></defs><path fill='url(%23g)' d='M26.6,80 L26.6,33.3 C26.6,26.6 33.3,20 40,20 L60,20 L80,40 L60,40 L60,60 L80,60 L60,80 L26.6,80 Z' /></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
