
'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthProviderDropdown } from '../auth/auth-provider-dropdown';
import { BookCopy } from 'lucide-react';

export function Header() {
  const { user } = useUser();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <header className="container mx-auto px-4 lg:px-6 h-14 flex items-center justify-between border border-border/40 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg">
            <Button asChild variant="ghost">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/add">Add</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/about">About</Link>
            </Button>
            <Button asChild variant="ghost" >
                <Link href="/documents">
                    <BookCopy />
                    My Documents
                </Link>
            </Button>
            {user ? (
                <UserAvatar />
            ) : (
                <AuthProviderDropdown isHeader={true} />
            )}
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
