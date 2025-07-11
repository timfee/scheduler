import { type ReactNode } from 'react';
import { AdminNavigation } from '@/app/admin/components/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="mt-2 text-gray-600">
            Manage your calendar connections, availability, and booking settings
          </p>
        </div>
        
        <AdminNavigation />
        
        <main className="mt-8">
          {children}
        </main>
      </div>
    </div>
  );
}