'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
