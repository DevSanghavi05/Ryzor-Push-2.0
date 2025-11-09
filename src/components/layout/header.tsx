'use client';

import { LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggleButton } from '../theme-toggle';
import { Logo } from './logo';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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


export function Header() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const NavLinks = () => {
    const { user } = useUser();
    
    return (
      <nav className="hidden md:flex items-center gap-2">
        {user ? (
          <>
            <Button asChild variant="ghost">
              <Link href="/">Workspace</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/documents">My Documents</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/gmail">Gmail</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/calendar">Calendar</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/history">Chat History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/add">Add Source</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#why" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          </div>
        )}
      </nav>
    );
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
        <header className="container mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-6 transition-all duration-300 border border-border bg-background/50 backdrop-blur-sm rounded-xl shadow-lg">
            <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
                <Logo className="h-6 w-6" />
                <span>Ryzor</span>
            </Link>
            
            {isClient && <NavLinks />}

            <div className="flex items-center gap-4">
              <ThemeToggleButton />
              {isClient ? (
                  <UserArea />
              ) : (
                <div className='h-8 w-24'></div>
              )}
            </div>
        </header>
    </div>
  );
}

const UserArea = () => {
  const { user } = useUser();
  return user ? (
    <UserAvatar />
  ) : (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="ghost">
        <Link href="/login">
            Sign In
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">
            Sign Up
        </Link>
      </Button>
    </div>
  );
}
