
'use client';

import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/layout/logo';
import { AuthProviderButtons } from '@/components/auth/auth-provider-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, signInWithEmail } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    }
  }, [user, loading, router, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      // The useEffect will handle redirection on successful sign-in
    } catch (error: any) {
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential') {
        description = 'The email or password you entered is incorrect. If you previously signed in with Google or Microsoft, please use that method instead.';
      } else {
        description = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: description,
      });
      setIsSubmitting(false);
    }
  };

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
                    <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
                    <CardDescription>Sign in to unlock your intelligent workspace.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    
                    <AuthProviderButtons />

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link
                            href="/signup"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign Up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
