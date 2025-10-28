'use client';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { Loader } from 'lucide-react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        // If the user is not logged in, redirect them to the homepage
        // where they can click the sign-in button.
        router.push('/');
      }
    }, [user, loading, router]);

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
