"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check if Firebase is actually configured with real keys, not placeholders.
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const isFirebaseConfigured = !!apiKey && apiKey !== "your_api_key_here";

  useEffect(() => {
    if (!loading && isFirebaseConfigured) {
       if (!user) {
         router.push('/login');
       } else if (!user.emailVerified) {
         router.push('/verify-email');
       }
    }
  }, [user, loading, router, isFirebaseConfigured]);

  if (loading && isFirebaseConfigured) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  return <>{children}</>;
}
