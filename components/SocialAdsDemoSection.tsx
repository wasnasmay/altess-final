"use client";

import React, { useState, useEffect } from 'react';
import { Play, Clock, TrendingUp } from 'lucide-react';

interface SocialVideo {
  id: string;
  platform: 'instagram' | 'tiktok';
  embedUrl: string;
  title: string;
  duration: number;
}

export default function SocialAdsDemoSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(30);

  // Vidéos de démonstration (exemples)
  const demoVideos: SocialVideo[] = [
    {
      id: '1',
      platform: 'instagram',
      embedUrl: 'https://www.instagram.com/reel/C2xampleReel/',
      title: 'Découvrez notre orchestre oriental',
      duration: 30
    },
    {
      id: '2',
      platform: 'tiktok',
      embedUrl: 'https://www.tiktok.com/@example/video/1234567890',
      title: 'Formation musicale ALTESS',
      duration: 30
    }
  ];

  const currentVideo = demoVideos[currentIndex];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Passer à la vidéo suivante
          setCurrentIndex((prevIndex) =>
            (prevIndex + 1) % demoVideos.length
          );
          return currentVideo.duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, currentVideo.duration, demoVideos.length]);

  // Reset timer when video changes
  useEffect(() => {
    setTimeRemaining(currentVideo.duration);
  }, [currentIndex, currentVideo.duration]);

  return (
    <section className="py-16 bg-black border-t border-amber-500/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-4">
            <span className="text-amber-400 text-sm font-semibold">DÉMONSTRATION</span>
          </div>
          <h2 className="text-4xl font-bold text-amber-400 mb-4">
            L'Heure des Réseaux Sociaux
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Diffusion automatique de vos contenus Instagram et TikTok avec le cadre doré ALTESS
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Video Player avec Cadre Doré */}
            <div className="md:col-span-2">
              <div className="relative">
                {/* Cadre Doré ALTESS */}
                <div className="relative p-1 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl shadow-2xl shadow-amber-500/50">
                  {/* Inner Border */}
                  <div className="p-1 bg-black rounded-xl">
                    {/* Video Container */}
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-[600px]">
                      {/* Video Placeholder - En production, remplacer par embed réel */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Play size={40} className="text-amber-400 ml-1" />
                          </div>
                          <p className="text-amber-400 font-semibold mb-2">{currentVideo.title}</p>
                          <p className="text-gray-500 text-sm capitalize">
                            Vidéo {currentVideo.platform}
                          </p>

                          {/* Preview Image */}
                          <div className="mt-8 px-8">
                            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-6">
                              <p className="text-gray-400 text-sm leading-relaxed">
                                Intégrez vos vidéos Instagram et TikTok directement dans votre diffusion.
                                Les vidéos s'enchaînent automatiquement avec la durée que vous choisissez.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000"
                          style={{
                            width: `${((currentVideo.duration - timeRemaining) / currentVideo.duration) * 100}%`
                          }}
                        />
                      </div>

                      {/* Timer Overlay */}
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-full flex items-center gap-2">
                        <Clock size={14} className="text-amber-400" />
                        <span className="text-white text-sm font-mono">{timeRemaining}s</span>
                      </div>

                      {/* Platform Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-full">
                        <span className="text-amber-400 text-xs font-semibold uppercase">
                          {currentVideo.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ALTESS Watermark */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full shadow-lg">
                  <span className="text-black font-bold text-sm">ALTESS</span>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isPlaying
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500 text-black hover:bg-amber-400'
                  }`}
                >
                  {isPlaying ? 'Pause' : 'Lecture'}
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % demoVideos.length)}
                  className="px-6 py-3 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                >
                  Vidéo suivante
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-amber-400" size={24} />
                  <h3 className="text-lg font-semibold text-amber-400">Statistiques Live</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Vidéo actuelle</div>
                    <div className="text-white font-semibold">{currentIndex + 1} / {demoVideos.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Durée moyenne</div>
                    <div className="text-white font-semibold">30 secondes</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Format</div>
                    <div className="text-white font-semibold">9:16 (Vertical)</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Fonctionnalités</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Cadre doré exclusif ALTESS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Enchaînement automatique</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Durée personnalisable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Instagram + TikTok</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Watermark automatique</span>
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-center">
                <h3 className="text-black font-bold mb-2">Intéressé ?</h3>
                <p className="text-black/80 text-sm mb-4">
                  Ajoutez vos vidéos depuis votre espace prestataire
                </p>
                <button className="w-full py-2 bg-black text-amber-400 font-semibold rounded-lg hover:bg-gray-900 transition-colors">
                  Accéder à mon espace
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-amber-400 text-center mb-8">
            Comment ça fonctionne ?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400 font-bold text-xl">
                1
              </div>
              <h4 className="font-semibold text-white mb-2">Ajoutez vos liens</h4>
              <p className="text-gray-400 text-sm">
                Collez vos liens Instagram ou TikTok dans votre espace prestataire
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400 font-bold text-xl">
                2
              </div>
              <h4 className="font-semibold text-white mb-2">Configuration auto</h4>
              <p className="text-gray-400 text-sm">
                Le système ajoute le cadre doré ALTESS automatiquement
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400 font-bold text-xl">
                3
              </div>
              <h4 className="font-semibold text-white mb-2">Diffusion</h4>
              <p className="text-gray-400 text-sm">
                Vos vidéos sont diffusées pendant l'Heure des Réseaux Sociaux
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
