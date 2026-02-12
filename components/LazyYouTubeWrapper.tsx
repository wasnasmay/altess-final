"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GlobalYouTubePlayer } from './GlobalYouTubePlayer';

export function LazyYouTubeWrapper() {
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (document.readyState === 'complete') {
      setShouldLoad(true);
    } else {
      const handleLoad = () => {
        setTimeout(() => {
          setShouldLoad(true);
        }, 500);
      };

      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  if (!shouldLoad) {
    return null;
  }

  return <GlobalYouTubePlayer />;
}
