
'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthProviderDropdown } from '../auth/auth-provider-dropdown';
import { Separator } from '../ui/separator';
import { BookCopy } from 'lucide-react';

export function Header({ onUploadClick }: { onUploadClick: () => void }) {
  const { user } = useUser();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '#', label: 'About' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <header className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between border border-border/40 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg">
            <Link href="/" className="font-bold font-headline text-lg">
                Ryzor AI
            </Link>
            
            <div className="flex items-center gap-4">
                <Separator orientation="vertical" className="h-6" />

                <nav className="hidden md:flex items-center gap-2">
                    <Button asChild variant="ghost">
                      <Link href="/">Home</Link>
                    </Button>
                    <Button variant="ghost" onClick={onUploadClick}>
                      Upload
                    </Button>
                    <Button asChild variant="ghost">
                      <Link href="#">About</Link>
                    </Button>
                </nav>

                <Separator orientation="vertical" className="h-6" />
                
                <Button asChild variant="ghost" className="hidden md:flex" >
                    <Link href="/documents">
                        <BookCopy />
                        My Documents
                    </Link>
                </Button>

                <Separator orientation="vertical" className="h-6" />
                
                {user ? (
                    <UserAvatar />
                ) : (
                    <AuthProviderDropdown isHeader={true} />
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
