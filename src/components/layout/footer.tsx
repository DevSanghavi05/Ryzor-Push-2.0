
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto relative z-[1]">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-6 gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ryzor. Made with care.
        </p>
        <div className="flex items-center gap-4">
          <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/terms">Terms of Service</Link>
          </Button>
          <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/privacy">Privacy Policy</Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
