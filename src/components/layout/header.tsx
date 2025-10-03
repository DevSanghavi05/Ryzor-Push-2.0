import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/40 fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <BrainCircuit className="h-7 w-7 text-accent group-hover:text-primary transition-colors" />
          <span className="text-xl font-bold font-headline text-foreground">
            Ryzor AI
          </span>
        </Link>
      </div>
    </header>
  );
}
