
'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthProviderDropdown } from '../auth/auth-provider-dropdown';
import { BookCopy, BrainCircuit } from 'lucide-react';
import { ThemeToggleButton } from '../theme-toggle';

export function Header() {
  const { user } = useUser();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <header className="container mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-6 border border-border/40 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg">
            <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
                <BrainCircuit className="h-6 w-6 text-primary"/>
                <span>Ryzor AI</span>
            </Link>
            <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost">
                <Link href="/">Home</Link>
                </Button>
                <Button asChild variant="ghost">
                <Link href="/about">About</Link>
                </Button>
                {user && (
                <>
                    <Button asChild variant="ghost">
                    <Link href="/add">Add</Link>
                    </Button>
                    <Button asChild variant="ghost" >
                        <Link href="/documents">
                            <BookCopy />
                            My Documents
                        </Link>
                    </Button>
                </>
                )}
            </div>
            <div className="flex-1 flex justify-end items-center gap-4">
              {user ? (
                  <UserAvatar />
              ) : (
                  <AuthProviderDropdown isHeader={true} />
              )}
              <ThemeToggleButton />
            </div>
        </header>
    </div>
  );
}

function UserAvatar() {
  const { user, signOut } = useUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
       <Avatar className="h-8 w-8">
        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
        <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <Button onClick={signOut} variant="ghost" size="sm">
        <LogOut className="mr-2" />
        Sign Out
      </Button>
    </div>
  );
}

    