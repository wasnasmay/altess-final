'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import PlayoutTimelineGrid from '@/components/PlayoutTimelineGrid';

export default function WebTVPlayoutPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'admin') {
        router.push('/admin');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
          <p className="mt-4 text-amber-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar />
      <div className="ml-16">
        <PlayoutTimelineGrid channelType="webtv" />
      </div>
    </div>
  );
}
