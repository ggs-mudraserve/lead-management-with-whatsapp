// Remove 'use client' directive

import React from 'react';
import type { Metadata } from "next";
// Remove provider imports from layout - they are now in providers.tsx
// import { ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import theme from '../theme';
// import { AuthProvider } from '@/context/AuthContext';
import Providers from './providers'; // Import the new Providers component
import { ClientHeaderWrapper } from '@/components/layout/client-header-wrapper';

// Remove dynamic import logic from here
// const Header = dynamic(() => import('@/components/layout/header').then((mod) => mod.Header), {
//   ssr: false,
//   loading: () => <div style={{ height: '64px', backgroundColor: '#1976d2' }}></div>
// });

// Keep metadata export
export const metadata: Metadata = {
  title: "Lead & Bank App Management",
  description: "Internal application for managing leads and bank applications",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ClientHeaderWrapper key="header" />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
