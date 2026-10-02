'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { AuthRole } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Props {
  /** Roles permitted on this page. Omit to allow any signed-in account. */
  allow?: AuthRole[];
  children: React.ReactNode;
}

/**
 * Wraps a page so it only renders for a signed-in account with an allowed role.
 *
 * Redirects are gated on `isInitialized`, never on `isAuthenticated` alone --
 * the latter starts false for signed-in users too, so redirecting on it would
 * bounce every cold page load back to /login.
 */
export function AuthGate({ allow, children }: Props) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, role } = useAuthStore();

  const permitted = !allow || (role !== null && allow.includes(role));

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (!permitted) {
      router.replace('/dashboard');
    }
  }, [isInitialized, isAuthenticated, permitted, router]);

  if (!isInitialized || !isAuthenticated || !permitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner label={isInitialized && !permitted ? 'Redirecting...' : 'Loading...'} />
      </div>
    );
  }

  return <>{children}</>;
}
