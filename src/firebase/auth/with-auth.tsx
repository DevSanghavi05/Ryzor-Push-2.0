'use client';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { Loader } from 'lucide-react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!loading && !user) {
        // If the user is not logged in, redirect them to the login page,
        // preserving the page they were trying to access.
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl);
      }
    }, [user, loading, router, pathname]);

    if (loading || !user) {
      // Show a loading spinner while we check for the user or during redirection.
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      );
    }

    // If the user is logged in, show the component they were trying to access.
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
