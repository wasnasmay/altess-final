'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function EventShortLinkPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveSlug() {
      try {
        const { data: event, error } = await supabase
          .from('public_events')
          .select('id, slug')
          .eq('custom_slug', params.slug)
          .single();

        if (error || !event) {
          router.push('/');
          return;
        }

        router.push(`/boutique/${event.slug}/event/${event.id}`);
      } catch (error) {
        console.error('Error resolving slug:', error);
        router.push('/');
      }
    }

    resolveSlug();
  }, [params.slug, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Redirection vers l'événement...</p>
        <p className="text-slate-400 text-sm mt-2">altess.fr/e/{params.slug}</p>
      </div>
    </div>
  );
}
