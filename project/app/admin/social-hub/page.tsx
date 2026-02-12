"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import CompactVideoPlayer from '@/components/CompactVideoPlayer';
import { cacheManager } from '@/lib/cache-manager';
import {
  Play,
  Pause,
  Settings,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';

interface SocialSource {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook';
  enabled: boolean;
}

interface MediaItem {
  id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  duration: number;
  type: 'premium' | 'altess';
}

export default function SocialHubPage() {
  const [sources, setSources] = useState<SocialSource[]>([
    { id: '1', platform: 'tiktok', enabled: true },
    { id: '2', platform: 'instagram', enabled: true },
    { id: '3', platform: 'youtube', enabled: false },
    { id: '4', platform: 'facebook', enabled: false }
  ]);

  const [videoDuration, setVideoDuration] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState({
    totalVideos: 0,
    duration: '0h 0m',
    viewers: 0
  });

  useEffect(() => {
    loadMediaLibrary();
  }, []);

  const loadMediaLibrary = async () => {
    const cacheKey = 'social_hub_media';
    const cached = cacheManager.get<MediaItem[]>(cacheKey);

    if (cached) {
      setPlaylist(cached);
      updateStats(cached);
      return;
    }

    const { data } = await supabase
      .from('media_library')
      .select('id, title, url, thumbnail_url, duration_seconds')
      .eq('media_type', 'video')
      .limit(50);

    if (data) {
      const items: MediaItem[] = data.map((item, idx) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        duration: item.duration_seconds || 30,
        type: idx % 3 === 0 ? 'altess' : 'premium'
      }));

      setPlaylist(items);
      updateStats(items);
      cacheManager.set(cacheKey, items, 10 * 60 * 1000);
    }
  };

  const updateStats = (items: MediaItem[]) => {
    const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    setStats({
      totalVideos: items.length,
      duration: `${hours}h ${minutes}m`,
      viewers: Math.floor(Math.random() * 500) + 100
    });
  };

  const toggleSource = (platformId: string) => {
    setSources(prev =>
      prev.map(s =>
        s.id === platformId ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleVideoEnd = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
      setIsPlaying(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      tiktok: '📱',
      instagram: '📷',
      youtube: '▶️',
      facebook: '👥'
    };
    return icons[platform] || '🎬';
  };

  const currentVideo = playlist[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <main className="ml-16 p-6">
        {/* Header - Compact */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-amber-400 mb-1">Social Hub</h1>
          <p className="text-sm text-gray-400">Diffusion automatique multi-plateformes</p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Video Player (Compact) */}
          <div className="col-span-5 space-y-3">
            {/* Live Stats - Mini Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-xs text-gray-400">Vidéos</span>
                </div>
                <div className="text-xl font-bold text-amber-400">{stats.totalVideos}</div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-xs text-gray-400">Durée</span>
                </div>
                <div className="text-xl font-bold text-amber-400">{stats.duration}</div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-amber-400" />
                  <span className="text-xs text-gray-400">Vues</span>
                </div>
                <div className="text-xl font-bold text-amber-400">{stats.viewers}</div>
              </div>
            </div>

            {/* Compact Video Player */}
            {currentVideo ? (
              <CompactVideoPlayer
                videoId={currentVideo.url.includes('youtube.com') || currentVideo.url.includes('youtu.be')
                  ? currentVideo.url.split('v=')[1]?.split('&')[0] || currentVideo.url.split('/').pop() || currentVideo.url
                  : currentVideo.url}
              />
            ) : (
              <div className="aspect-video bg-black border border-amber-500/20 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Play size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune vidéo sélectionnée</p>
                </div>
              </div>
            )}

            {/* Controls - Compact */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  isPlaying
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                {isPlaying ? (
                  <><Pause size={16} className="inline mr-2" />Arrêter</>
                ) : (
                  <><Play size={16} className="inline mr-2" />Démarrer</>
                )}
              </button>

              <button className="p-2 border border-amber-500/20 rounded-lg hover:bg-amber-500/10 transition-colors">
                <Settings size={18} className="text-amber-400" />
              </button>
            </div>
          </div>

          {/* Middle Column - Sources & Settings */}
          <div className="col-span-3 space-y-3">
            {/* Social Sources */}
            <div className="bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-400 mb-3">Sources actives</h3>
              <div className="space-y-2">
                {sources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                      source.enabled
                        ? 'bg-amber-500/20 border border-amber-500/30'
                        : 'bg-black/20 border border-gray-700 opacity-50'
                    }`}
                  >
                    <span className="text-lg">{getPlatformIcon(source.platform)}</span>
                    <span className="text-sm capitalize flex-1 text-left">
                      {source.platform}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        source.enabled ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Slider */}
            <div className="bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-amber-400">Durée/vidéo</h3>
                <span className="text-amber-400 font-bold">{videoDuration}s</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={videoDuration}
                onChange={(e) => setVideoDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15s</span>
                <span>60s</span>
              </div>
            </div>
          </div>

          {/* Right Column - Playlist */}
          <div className="col-span-4 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">
              File d'attente ({playlist.length})
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {playlist.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    idx === currentIndex
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>{item.duration}s</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        item.type === 'altess'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {item.type === 'altess' ? 'ALTESS' : 'Premium'}
                      </span>
                    </div>
                  </div>

                  {/* Index */}
                  <div className="text-xs text-gray-600 font-mono">
                    #{(idx + 1).toString().padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(217, 119, 6, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 119, 6, 0.5);
        }
      `}</style>
    </div>
  );
}
