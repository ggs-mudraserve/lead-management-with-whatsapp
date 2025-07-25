import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Performance Analytics | Admin',
  description: 'Performance analytics and reporting dashboard',
};

interface PerformanceLayoutProps {
  children: React.ReactNode;
}

export default function PerformanceLayout({ children }: PerformanceLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}