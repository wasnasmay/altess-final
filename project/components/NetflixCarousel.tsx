'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext';

type MediaItem = {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
};

type NetflixCarouselProps = {
  items: MediaItem[];
  title?: string;
};

export default function NetflixCarousel({ items, title }: NetflixCarouselProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { playerRef, setIsPlaying, setSavedPlaybackTime } = usePlayer();
  const isScrollingRef = useRef(false);

  const duplicatedItems = [...items, ...items, ...items];

  useEffect(() => {
    if (carouselRef.current && items.length > 0) {
      const itemWidth = 280 + 32;
      const initialScroll = itemWidth * items.length;
      carouselRef.current.scrollLeft = initialScroll;
      updateScrollButtons();
    }
  }, [items.length]);

  useEffect(() => {
    updateScrollButtons();
  }, [scrollPosition]);

  useEffect(() => {
    if (isPaused || !carouselRef.current || items.length === 0) return;

    const scrollInterval = setInterval(() => {
      if (carouselRef.current && !isScrollingRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        const itemWidth = 280 + 32;
        const totalOriginalWidth = itemWidth * items.length;
        const maxScroll = totalOriginalWidth * 2;

        if (scrollLeft >= maxScroll) {
          isScrollingRef.current = true;
          carouselRef.current.scrollLeft = scrollLeft - totalOriginalWidth;
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 50);
        } else if (scrollLeft <= totalOriginalWidth - itemWidth) {
          isScrollingRef.current = true;
          carouselRef.current.scrollLeft = scrollLeft + totalOriginalWidth;
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 50);
        } else {
          carouselRef.current.scrollBy({ left: 1, behavior: 'auto' });
        }
        updateScrollButtons();
      }
    }, 30);

    return () => clearInterval(scrollInterval);
  }, [isPaused, items.length]);

  const updateScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.8;
      const newPosition = direction === 'left'
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;

      carouselRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });

      setTimeout(updateScrollButtons, 300);
    }
  };

  const handleItemClick = (item: MediaItem) => {
    if (item.type === 'video') {
      if (playerRef.current) {
        if (typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          setSavedPlaybackTime(currentTime);
        }
        if (typeof playerRef.current.pause === 'function') {
          playerRef.current.pause();
        }
      }
      setIsPlaying(false);
    }
    setSelectedItem(item);
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
    setTimeout(() => {
      if (playerRef.current && typeof playerRef.current.play === 'function') {
        playerRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  const getVideoThumbnail = (item: MediaItem) => {
    if (item.thumbnail) return item.thumbnail;

    if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
      const videoId = item.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    return 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg';
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative group mb-12">
      {title && (
        <h3 className="text-xl font-semibold mb-6 px-4 lg:px-12 text-white/90">{title}</h3>
      )}

      <div
        className="relative px-4 lg:px-12"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-full w-12 rounded-none bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        <div
          ref={carouselRef}
          className="flex gap-8 overflow-x-hidden scrollbar-hide"
          onScroll={updateScrollButtons}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {duplicatedItems.map((item, index) => (
            <div
              key={`carousel-${index}`}
              className="relative flex-shrink-0 cursor-pointer group/card"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleItemClick(item)}
              style={{
                width: '280px',
                zIndex: hoveredIndex === index ? 10 : 1,
              }}
            >
              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ease-out"
                style={{
                  height: '160px',
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: hoveredIndex === index
                    ? '0 8px 30px rgba(251, 191, 36, 0.3), 0 0 0 2px rgba(251, 191, 36, 0.5)'
                    : '0 4px 12px rgba(0, 0, 0, 0.4)',
                }}
              >
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={item.title || `Media ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={getVideoThumbnail(item)}
                      alt={item.title || `Video ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center transition-transform hover:scale-110 shadow-lg shadow-amber-500/50">
                        <Play className="w-7 h-7 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {item.title && (
                <div className="mt-3 px-1">
                  <p className="text-sm font-medium text-white/90 line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-full w-12 rounded-none bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 bg-slate-900/95 border-slate-800 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseDialog}
            className="absolute right-4 top-4 z-50 text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>

          {selectedItem && (
            <div className="relative w-full">
              {selectedItem.type === 'image' ? (
                <div className="relative w-full aspect-video">
                  <Image
                    src={selectedItem.url}
                    alt={selectedItem.title || 'Image'}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="relative w-full aspect-video p-4">
                  {selectedItem.url.includes('youtube.com') || selectedItem.url.includes('youtu.be') ? (
                    <iframe
                      src={selectedItem.url.replace('watch?v=', 'embed/')}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={selectedItem.url}
                      controls
                      autoPlay
                      className="w-full h-full rounded-lg"
                    >
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  )}
                </div>
              )}

              {selectedItem.title && (
                <div className="p-4 text-white">
                  <h3 className="text-xl font-semibold">{selectedItem.title}</h3>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
