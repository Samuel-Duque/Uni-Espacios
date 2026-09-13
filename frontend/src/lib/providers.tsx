'use client';

import React from 'react';
import { QueryProvider } from '../components/providers/query-provider';
import { AuthProvider } from './auth-context';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryProvider>
  );
}

