import { BrainCircuit, BookCopy, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthProviderDropdown } from '../auth/auth-provider-dropdown';

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


export function Header() {
  const { user } = useUser();

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/40 fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group mr-auto">
          <BrainCircuit className="h-7 w-7 text-accent group-hover:text-primary transition-colors" />
          <span className="text-xl font-bold font-headline text-foreground">
            Ryzor AI
          </span>
        </Link>
        <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" >
                <Link href={user ? "/documents" : "#"}>
                    <BookCopy />
                    My Documents
                </Link>
            </Button>
            {user ? <UserAvatar /> : <AuthProviderDropdown isHeader={true} />}
        </nav>
      </div>
    </header>
  );
}
