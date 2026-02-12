'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EvenementielRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/evenementiel/prestataires');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>
  );
}
