
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is now deprecated. The chat functionality has been moved to the main page.
// We will redirect users to the main page if they land here.
export default function DeprecatedChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
