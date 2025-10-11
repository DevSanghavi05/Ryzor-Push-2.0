'use client';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { Loader } from 'lucide-react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading, signInWithGoogle } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        // Instead of routing, just trigger the sign-in.
        // The `useUser` hook will update the state, and this component will re-render.
        signInWithGoogle().catch(() => {
            // If sign-in fails or is dismissed, you might want to redirect.
            router.push('/');
        });
      }
    }, [user, loading, router, signInWithGoogle]);

    if (loading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
