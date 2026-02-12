"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cacheManager } from '@/lib/cache-manager';
import OptimizedImage from '@/components/OptimizedImage';
import { Search, Filter, Play, Clock, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  media_type: 'video' | 'image';
  duration_seconds?: number;
  file_size?: number;
  created_at: string;
}

interface VisualMediaLibraryProps {
  onSelect?: (item: MediaItem) => void;
  selectedIds?: string[];
  multiSelect?: boolean;
  mediaType?: 'video' | 'image' | 'all';
}

const ITEMS_PER_PAGE = 20;
const ITEM_HEIGHT = 180;

export default function VisualMediaLibrary({
  onSelect,
  selectedIds = [],
  multiSelect = false,
  mediaType = 'all'
}: VisualMediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image'>(mediaType);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMedia();
  }, [filterType]);

  const loadMedia = async () => {
    const cacheKey = `media_library_${filterType}`;
    const cached = cacheManager.get<MediaItem[]>(cacheKey);

    if (cached) {
      setItems(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('media_type', filterType);
    }

    const { data, error } = await query;

    if (data && !error) {
      setItems(data);
      cacheManager.set(cacheKey, data, 5 * 60 * 1000);
    }

    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Virtual scrolling calculation
  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const itemsPerRow = 4;
    const rowHeight = ITEM_HEIGHT;
    const totalRows = Math.ceil(filteredItems.length / itemsPerRow);
    const totalHeight = totalRows * rowHeight;

    const scrollTop = containerRef.current?.scrollTop || 0;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);

    const startIndex = Math.max(0, startRow * itemsPerRow - itemsPerRow);
    const endIndex = Math.min(filteredItems.length, (endRow + 1) * itemsPerRow);

    const visibleItems = filteredItems.slice(startIndex, endIndex);
    const offsetY = startRow * rowHeight;

    return { visibleItems, totalHeight, offsetY };
  }, [filteredItems, scrollTop]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const handleSelect = (item: MediaItem) => {
    onSelect?.(item);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black rounded-lg border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un média..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-amber-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-black border border-amber-500/20 rounded-lg p-1">
            {['all', 'video', 'image'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  filterType === type
                    ? 'bg-amber-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {type === 'all' ? 'Tous' : type === 'video' ? 'Vidéos' : 'Images'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[600px] overflow-y-auto custom-scrollbar"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
              <p className="mt-4 text-amber-400">Chargement de la bibliothèque...</p>
            </div>
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                padding: '16px'
              }}
            >
              {visibleItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`group relative bg-gradient-to-br from-amber-500/10 to-transparent border rounded-lg overflow-hidden transition-all hover:scale-105 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/50'
                        : 'border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-black relative">
                      {item.thumbnail_url ? (
                        <OptimizedImage
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          {item.media_type === 'video' ? (
                            <Play size={32} />
                          ) : (
                            <ImageIcon size={32} />
                          )}
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Duration Badge */}
                      {item.duration_seconds && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(item.duration_seconds)}
                        </div>
                      )}

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="p-2 bg-black/40">
                      <p className="text-xs text-white truncate font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.media_type}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-amber-500/20 bg-black/40">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{filteredItems.length} médias</span>
          <span>{selectedIds.length} sélectionné(s)</span>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(217, 119, 6, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 119, 6, 0.5);
        }
      `}</style>
    </div>
  );
}
