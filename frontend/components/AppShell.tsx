'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { getStoredAuth, DEFAULT_CREDENTIALS, setStoredAuth } from '@/lib/auth';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize default session if none exists
    if (!getStoredAuth()) {
      setStoredAuth(DEFAULT_CREDENTIALS);
    }
  }, []);

  // Landing page and Login page render without the internal sidebar
  const isPublicRoute = pathname === '/' || pathname === '/login';

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  if (isPublicRoute) {
    return <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
