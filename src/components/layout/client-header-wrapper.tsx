'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Dynamically import the main Header component with SSR disabled
const DynamicHeader = dynamic(() => import('@/components/layout/header').then((mod) => mod.Header), {
  ssr: false,
  // Basic placeholder matching AppBar height/color. Adjust if needed.
  loading: () => <div style={{ height: '64px', backgroundColor: '#1976d2' }}></div>
});

export function ClientHeaderWrapper() {
  // Using pathname to detect navigation, but we'll use React.memo to prevent unnecessary re-renders
  const pathname = usePathname();

  // Only re-render the header when the pathname changes
  return React.useMemo(() => {
    return <DynamicHeader key={pathname} />;
  }, [pathname]);
}