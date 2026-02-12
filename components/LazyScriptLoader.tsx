"use client";

import React, { useEffect, useState } from 'react';

interface LazyScriptLoaderProps {
  scripts: Array<{
    src: string;
    id: string;
    async?: boolean;
    defer?: boolean;
  }>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  children: React.ReactNode;
  loadOnMount?: boolean;
}

/**
 * Lazy Script Loader Component
 * Only loads external scripts when explicitly triggered
 * Prevents auto-loading of heavy social media SDKs
 */
export default function LazyScriptLoader({
  scripts,
  onLoad,
  onError,
  children,
  loadOnMount = false
}: LazyScriptLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(loadOnMount);

  useEffect(() => {
    if (!shouldLoad || isLoaded || isLoading) return;

    setIsLoading(true);

    const loadScripts = async () => {
      try {
        for (const script of scripts) {
          // Check if script already exists
          if (document.getElementById(script.id)) {
            continue;
          }

          await new Promise<void>((resolve, reject) => {
            const scriptElement = document.createElement('script');
            scriptElement.src = script.src;
            scriptElement.id = script.id;
            scriptElement.async = script.async ?? true;
            scriptElement.defer = script.defer ?? false;

            scriptElement.onload = () => resolve();
            scriptElement.onerror = () => reject(new Error(`Failed to load script: ${script.src}`));

            document.body.appendChild(scriptElement);
          });
        }

        setIsLoaded(true);
        onLoad?.();
      } catch (error) {
        onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScripts();
  }, [shouldLoad, scripts, isLoaded, isLoading, onLoad, onError]);

  const triggerLoad = () => {
    setShouldLoad(true);
  };

  return (
    <div
      onClick={triggerLoad}
      onMouseEnter={triggerLoad}
      className="w-full h-full"
    >
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
            <p className="mt-2 text-sm text-amber-400">Chargement...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured loaders for common platforms
 */

export function TikTokScriptLoader({ children, onLoad }: { children: React.ReactNode; onLoad?: () => void }) {
  return (
    <LazyScriptLoader
      scripts={[
        {
          src: 'https://www.tiktok.com/embed.js',
          id: 'tiktok-embed',
          async: true
        }
      ]}
      onLoad={onLoad}
    >
      {children}
    </LazyScriptLoader>
  );
}

export function InstagramScriptLoader({ children, onLoad }: { children: React.ReactNode; onLoad?: () => void }) {
  return (
    <LazyScriptLoader
      scripts={[
        {
          src: 'https://www.instagram.com/embed.js',
          id: 'instagram-embed',
          async: true
        }
      ]}
      onLoad={onLoad}
    >
      {children}
    </LazyScriptLoader>
  );
}

export function FacebookScriptLoader({ children, onLoad }: { children: React.ReactNode; onLoad?: () => void }) {
  return (
    <LazyScriptLoader
      scripts={[
        {
          src: 'https://connect.facebook.net/en_US/sdk.js',
          id: 'facebook-jssdk',
          async: true,
          defer: true
        }
      ]}
      onLoad={onLoad}
    >
      {children}
    </LazyScriptLoader>
  );
}
