'use client';

import { usePlayer } from '@/contexts/PlayerContext';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { X, Maximize2, Volume2, VolumeX, Play, Pause, Radio } from 'lucide-react';
import { Slider } from './ui/slider';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export function GlobalRadioPlayer() {
  const pathname = usePathname();
  const {
    currentMedia,
    isPlayerOpen,
    setIsPlayerOpen,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    mode,
    userHasInteracted,
    setUserHasInteracted,
  } = usePlayer();

  const [radioMetadata, setRadioMetadata] = useState<{
    title: string;
    artist: string;
  }>({
    title: 'En cours de lecture',
    artist: 'Radio en direct'
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const shouldShowPlayer = currentMedia && isPlayerOpen && mode === 'radio';

  function getProxiedStreamUrl(streamUrl: string): string {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!baseUrl) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_URL not configured, using direct stream');
        return streamUrl;
      }
      const encodedUrl = encodeURIComponent(streamUrl);
      const proxiedUrl = `${baseUrl}/functions/v1/stream-radio-proxy?url=${encodedUrl}`;
      console.log('🔗 Using robust proxy stream:', proxiedUrl);
      return proxiedUrl;
    } catch (error) {
      console.error('❌ Error creating proxied URL:', error);
      return streamUrl;
    }
  }

  async function fetchRadioMetadata(streamUrl: string) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!baseUrl) return;

      const encodedUrl = encodeURIComponent(streamUrl);
      const response = await fetch(
        `${baseUrl}/functions/v1/get-radio-metadata?url=${encodedUrl}`
      );

      if (response.ok) {
        const metadata = await response.json();
        setRadioMetadata({
          title: metadata.title || metadata.song || 'En cours de lecture',
          artist: metadata.artist || metadata.station || 'Radio en direct'
        });
      }
    } catch (error) {
      console.error('Error fetching radio metadata:', error);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentMedia?.source_url) return;

    console.log('🎵 Setting up radio stream:', currentMedia.source_url);

    const streamUrl = currentMedia.source_url;
    const proxiedUrl = getProxiedStreamUrl(streamUrl);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (streamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hls.loadSource(proxiedUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed');
          if (isPlaying && userHasInteracted) {
            audio.play().catch(err => console.error('Play error:', err));
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🔄 Network error, attempting to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🔄 Media error, attempting to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('💥 Fatal error, destroying HLS instance');
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = proxiedUrl;
        if (isPlaying && userHasInteracted) {
          audio.play().catch(err => console.error('Play error:', err));
        }
      }
    } else {
      audio.src = proxiedUrl;
      if (isPlaying && userHasInteracted) {
        audio.play().catch(err => console.error('Play error:', err));
      }
    }

    fetchRadioMetadata(streamUrl);
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
    }
    metadataIntervalRef.current = setInterval(() => {
      fetchRadioMetadata(streamUrl);
    }, 30000);

    return () => {
      if (metadataIntervalRef.current) {
        clearInterval(metadataIntervalRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentMedia?.source_url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && userHasInteracted) {
      audio.play().catch(err => console.error('Play error:', err));
    } else {
      audio.pause();
    }
  }, [isPlaying, userHasInteracted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume / 100;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    setUserHasInteracted(true);
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setIsPlayerOpen(false);
  };

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  if (!shouldShowPlayer) return null;

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      <div
        className="fixed bottom-4 md:bottom-6 right-2 left-2 md:left-auto md:right-6 w-auto md:w-96 z-[100] bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-300 ease-in-out shadow-2xl"
        style={{
          borderRadius: '16px',
          boxShadow: '0 30px 60px -12px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.15)',
        }}
      >
          <div
            className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-md border-b border-amber-500/20 p-3 md:p-3 flex items-center justify-between"
            style={{ borderRadius: '16px 16px 0 0' }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm md:text-sm truncate">
                  {radioMetadata.title}
                </div>
                <div className="text-amber-400 text-xs md:text-xs truncate">
                  {radioMetadata.artist}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-1 flex-shrink-0">
              {pathname !== '/' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-8 md:w-8 text-white hover:bg-white/10"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                >
                  <Maximize2 className="h-4 w-4 md:h-4 md:w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-8 md:w-8 text-white hover:bg-white/10"
                onClick={handleClose}
              >
                <X className="h-4 w-4 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-sm p-4 md:p-4" style={{ borderRadius: '0 0 16px 16px' }}>
            <div className="flex items-center gap-3 md:gap-3">
              <Button
                size="icon"
                className="h-14 w-14 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 flex-shrink-0 transition-transform active:scale-95"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 md:h-5 md:w-5 text-white" />
                ) : (
                  <Play className="h-6 w-6 md:h-5 md:w-5 ml-0.5 text-white" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 md:h-9 md:w-9 text-white/80 hover:text-white hover:bg-white/10 flex-shrink-0 transition-transform active:scale-95"
                onClick={() => {
                  setUserHasInteracted(true);
                  if (isMuted && volume === 0) {
                    setVolume(50);
                    setIsMuted(false);
                  } else if (isMuted) {
                    setIsMuted(false);
                  } else {
                    setIsMuted(true);
                  }
                }}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5 md:h-5 md:w-5" />
                ) : (
                  <Volume2 className="h-5 w-5 md:h-5 md:w-5" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={(value) => {
                    setUserHasInteracted(true);
                    const newVolume = value[0];
                    setVolume(newVolume);
                    if (newVolume > 0) {
                      setIsMuted(false);
                    } else {
                      setIsMuted(true);
                    }
                  }}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-400 [&_[role=slider]]:to-amber-600 [&_[role=slider]]:shadow-md [&_[role=slider]]:border [&_[role=slider]]:border-white/20 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 md:[&_[role=slider]]:w-3 md:[&_[role=slider]]:h-3 [&>.relative]:h-2 md:[&>.relative]:h-1.5 [&>.relative]:bg-white/20"
                />
              </div>

              <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                <Radio className="w-5 h-5 md:w-5 md:h-5" />
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
