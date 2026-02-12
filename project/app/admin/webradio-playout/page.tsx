'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PlayoutTimelineGrid from '@/components/PlayoutTimelineGrid';

export default function WebRadioPlayoutPage() {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
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

  return <PlayoutTimelineGrid channelType="webradio" />;
}
