'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Volume2 } from 'lucide-react';

interface MobileAudioUnlockButtonProps {
  onUnlock: () => void;
  userHasInteracted: boolean;
}

export default function MobileAudioUnlockButton({ onUnlock, userHasInteracted }: MobileAudioUnlockButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userHasInteracted) {
      setIsVisible(false);
    }
  }, [userHasInteracted]);

  const handleUnlock = () => {
    onUnlock();
    setIsVisible(false);
  };

  if (!isMobile || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="text-center max-w-sm">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 border-4 border-amber-500/40 flex items-center justify-center animate-pulse">
            <Volume2 className="w-16 h-16 text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
            Bienvenue sur ALTESS
          </h2>
          <p className="text-slate-300 text-base mb-2">
            Pour écouter notre WebRadio et WebTV
          </p>
          <p className="text-slate-400 text-sm">
            Appuyez sur le bouton ci-dessous pour activer le son
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleUnlock}
          className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-bold py-8 text-xl shadow-2xl shadow-amber-500/50 transition-all duration-300 hover:scale-105"
        >
          <Play className="w-8 h-8 mr-3" />
          Démarrer l'expérience
        </Button>

        <p className="text-xs text-slate-500 mt-6 leading-relaxed">
          Cette interaction est nécessaire pour respecter les politiques des navigateurs mobiles concernant la lecture automatique de l'audio.
        </p>
      </div>
    </div>
  );
}
