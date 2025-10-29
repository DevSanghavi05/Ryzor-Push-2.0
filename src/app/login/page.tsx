'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/layout/logo';
import { AuthProviderButtons } from '@/components/auth/auth-provider-dropdown';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="bg-aurora"></div>
        <div className="relative">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <Logo className="h-10 w-10 mx-auto mb-4" />
                    <CardTitle className="font-headline text-2xl">Welcome to Ryzor AI</CardTitle>
                    <CardDescription>Sign in to unlock your intelligent workspace.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <AuthProviderButtons />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
