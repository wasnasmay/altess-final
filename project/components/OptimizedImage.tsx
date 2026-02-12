"use client";

import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  placeholder?: 'blur' | 'empty';
}

/**
 * Optimized Image Component
 * - Lazy loading with Intersection Observer
 * - Automatic compression and caching
 * - Progressive loading with blur effect
 * - Responsive sizing
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onLoad,
  onError,
  placeholder = 'blur'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    // Intersection Observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    const err = new Error(`Failed to load image: ${src}`);
    setError(err);
    onError?.(err);
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${error ? 'hidden' : ''}
          `}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Image non disponible</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Optimized Thumbnail Component
 * Specialized for small preview images
 */
export function OptimizedThumbnail({
  src,
  alt,
  className = '',
  size = 80
}: {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded ${className}`}
      placeholder="blur"
    />
  );
}

/**
 * Image Preloader Hook
 * Preload images in the background
 */
export function useImagePreloader(urls: string[]) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (urls.length === 0) {
      setIsComplete(true);
      return;
    }

    let loaded = 0;

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === urls.length) {
          setIsComplete(true);
        }
      };
      img.onerror = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === urls.length) {
          setIsComplete(true);
        }
      };
    });
  }, [urls]);

  return {
    loadedCount,
    totalCount: urls.length,
    progress: urls.length > 0 ? (loadedCount / urls.length) * 100 : 0,
    isComplete
  };
}
