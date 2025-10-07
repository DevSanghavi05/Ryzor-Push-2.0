'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useState } from 'react';
import { UploadForm } from '@/components/upload/upload-form';
import * as React from 'react';

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
  const [isUploadOpen, setUploadOpen] = useState(false);

  // We need to clone the children to pass down the onUploadClick prop
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-expect-error - injecting prop
      return React.cloneElement(child, { onUploadClick: () => setUploadOpen(true) });
    }
    return child;
  });

  return (
    <html lang="en" className="dark">
      <head>
        <title>Ryzor AI MVP</title>
        <meta name="description" content="Upload a PDF and ask it questions." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-dvh">
        <FirebaseClientProvider>
          <Header onUploadClick={() => setUploadOpen(true)} />
          <main className="flex-1 flex flex-col pt-24">{childrenWithProps}</main>
          <Footer />
        </FirebaseClientProvider>
        <Toaster />
        <UploadForm open={isUploadOpen} onOpenChange={setUploadOpen} />
      </body>
    </html>
  );
}
