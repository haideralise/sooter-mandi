'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    // Wait for checkAuth() to finish, otherwise a signed-in user is bounced
    // to /login on every cold load.
    if (!isInitialized) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isAuthenticated, isInitialized, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl">🧵</p>
        <h1 className="text-2xl font-bold text-white mt-3">SooterMandi</h1>
        <p className="text-primary-100 mt-1">Thread Market Rate Tracking</p>
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white mt-6" />
      </div>
    </div>
  );
}
