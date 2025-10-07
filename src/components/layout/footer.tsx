import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Placeholder icons - consider using a library like lucide-react
const TwitterIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>;
const GithubIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .8 2.8.6 3.5.4.1-.3.4-.6.7-.7-2.7-.3-5.5-1.3-5.5-6a4.6 4.6 0 0 1 1.2-3.2c-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2a4.6 4.6 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.5 6 .4.3.8.9.8 1.8v2.6c0 .3.2.7.8.6A12 12 0 0 0 12 0z" /></svg>;
const LinkedinIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;

export function Footer() {
  return (
    <footer className="border-t border-border/40 mt-auto bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-6 gap-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ryzor AI. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
            <Link href="#">Terms of Service</Link>
          </Button>
          <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
            <Link href="#">Privacy Policy</Link>
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="#" aria-label="Twitter">
              <TwitterIcon />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="#" aria-label="GitHub">
              <GithubIcon />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="#" aria-label="LinkedIn">
              <LinkedinIcon />
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
