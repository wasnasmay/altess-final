'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

interface AdminNavigationProps {
  title: string;
  showBackButton?: boolean;
}

export default function AdminNavigation({ title, showBackButton = true }: AdminNavigationProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex items-center justify-between border-b pb-4 bg-red-600 text-white px-6 py-4 rounded-lg relative z-50">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2"
      >
        <LayoutDashboard className="w-4 h-4" />
        Menu Admin
      </Button>
    </div>
  );
}
