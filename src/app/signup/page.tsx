
'use client';

import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2">
        <title>Google</title>
        <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

const MicrosoftIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2">
        <title>Microsoft</title>
        <path fill="#f25022" d="M11.4 11.4H0V0h11.4v11.4z" />
        <path fill="#00a4ef" d="M11.4 24H0V12.6h11.4V24z" />
        <path fill="#7fba00" d="M24 11.4H12.6V0H24v11.4z" />
        <path fill="#ffb900" d="M24 24H12.6V12.6H24V24z" />
    </svg>
);


export default function SignUpPage() {
  const { user, loading, signUpWithEmail, signInWithGoogle, signInWithMicrosoft } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    }
  }, [user, loading, router, searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please re-enter your password.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      // The useEffect will handle redirection on successful sign-up
    } catch (error: any) {
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
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
            <Card className="w-full max-w-sm bg-card/50 backdrop-blur-sm border-border">
                <CardHeader className="text-center">
                    <Logo className="h-10 w-10 mx-auto mb-4" />
                    <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
                    <CardDescription>Join Ryzor to unlock your intelligent workspace.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
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
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign Up
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or sign up with
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-2 w-full">
                        <Button variant="outline" className="w-full" onClick={() => signInWithGoogle('work')}>
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => signInWithMicrosoft('work')}>
                            <MicrosoftIcon />
                            <span>Continue with Microsoft</span>
                        </Button>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign In
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
