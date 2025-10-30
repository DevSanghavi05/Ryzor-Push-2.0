
'use client';

import { LogOut, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookCopy, LogIn, Plus } from 'lucide-react';
import { ThemeToggleButton } from '../theme-toggle';
import { Logo } from './logo';

export function Header() {
  const { user } = useUser();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-transparent">
        <header className="container mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-6 border border-border/40 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg">
            <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
                <Logo className="h-6 w-6" />
                <span>Ryzor AI</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost">
                    <Link href="/">Home</Link>
                </Button>
                <Button asChild variant="ghost">
                    <Link href="/about">About</Link>
                </Button>
                {user && (
                <>
                    <Button asChild variant="ghost">
                        <Link href="/add" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" >
                        <Link href="/documents" className="flex items-center gap-2">
                            <BookCopy className="h-4 w-4" /> My Documents
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" >
                        <Link href="/trash" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Trash
                        </Link>
                    </Button>
                </>
                )}
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                  <UserAvatar />
              ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                    </Link>
                 </Button>
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
        <LogOut className="mr-2 h-4 w-4" />
        <span className="hidden md:inline">Sign Out</span>
      </Button>
    </div>
  );
}

    