'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggleButton } from '../theme-toggle';
import { Logo } from './logo';

export function Header() {
  const { user } = useUser();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
        <header className="container mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-6 transition-all duration-300 border border-border bg-background/50 backdrop-blur-sm rounded-xl shadow-lg">
            <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
                <Logo className="h-6 w-6" />
                <span>Ryzor</span>
            </Link>
            
            {user ? (
                // Nav for logged in users
                <nav className="hidden md:flex items-center gap-2">
                    <Button asChild variant="ghost">
                        <Link href="/">Workspace</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/documents">My Documents</Link>
                    </Button>
                     <Button asChild variant="ghost">
                        <Link href="/history">Chat History</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/add">Add Source</Link>
                    </Button>
                </nav>
            ) : (
                 // Nav for logged out users on landing page
                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/#why" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                    <Link href="/#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</Link>
                    <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                    <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                </nav>
            )}

            <div className="flex items-center gap-4">
              <ThemeToggleButton />
              {user ? (
                  <UserAvatar />
              ) : (
                  <Button asChild size="sm">
                    <Link href="/login">
                        Try It Free
                    </Link>
                 </Button>
              )}
            </div>
        </header>
    </div>
  );
}

function UserAvatar() {
  const { user, signOut } = useUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
       <Avatar className="h-8 w-8 border-2 border-primary/50">
        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
        <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <Button onClick={signOut} variant="ghost" size="icon" className="group">
        <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Button>
    </div>
  );
}
