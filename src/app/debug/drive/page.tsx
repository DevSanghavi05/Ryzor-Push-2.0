'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase'; 
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function GoogleDriveDebugPage() {
  const { signInWithGoogle, user, accessToken, loading } = useUser();
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchDriveFiles = async () => {
    if (!accessToken) {
      alert('No Google access token found! Please ensure you are signed in.');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType)', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      const data = await res.json();

      if (!res.ok) {
        // Try to parse Google's error format
        const errorMessage = data.error?.message || `Request failed with status ${res.status}`;
        throw new Error(errorMessage);
      }
      
      console.log('Drive Files Response:', data);
      setDriveFiles(data.files || []);

    } catch (err: any) {
      console.error('Error fetching Drive files:', err);
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6 pt-24">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Google Drive Sync Debug</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                This page helps diagnose issues with fetching files from Google Drive.
            </p>
        </div>

        <div className="max-w-2xl mx-auto bg-card p-6 rounded-lg shadow-lg">
            {loading ? (
                 <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                 </div>
            ) : !user ? (
                <div className="text-center">
                    <p className="mb-4">Please sign in to continue.</p>
                    <Button
                        onClick={() => signInWithGoogle()}
                        size="lg"
                    >
                        Sign in with Google
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="text-center">
                        <p className="text-muted-foreground">Signed in as: {user.email}</p>
                        <p className="text-xs text-muted-foreground truncate">Firebase UID: {user.uid}</p>
                    </div>

                    <Button
                        onClick={fetchDriveFiles}
                        disabled={isFetching}
                        className="w-full"
                        size="lg"
                    >
                        {isFetching ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Fetching...
                            </>
                        ) : (
                            'Fetch Drive Files'
                        )}
                    </Button>
                    
                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                            <h3 className="font-bold">An Error Occurred</h3>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {driveFiles.length > 0 && (
                         <div className="border rounded-lg">
                            <ul className="divide-y divide-border">
                                {driveFiles.map((file) => (
                                <li key={file.id} className="p-3 text-sm">
                                    📄 {file.name} ({file.mimeType})
                                </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
