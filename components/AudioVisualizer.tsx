'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioRef?: React.RefObject<HTMLAudioElement>;
  color?: string;
  barCount?: number;
}

export default function AudioVisualizer({
  audioRef,
  color = '#f59e0b',
  barCount = 64
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceCreatedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Fonction pour initialiser l'analyseur audio
    const initAudioAnalyser = () => {
      if (sourceCreatedRef.current || !audioRef?.current) return;

      try {
        console.log('🎨 Initializing audio visualizer...');

        // Utiliser un AudioContext existant ou en créer un nouveau
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        // Reprendre le context s'il est suspendu
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        const source = audioContext.createMediaElementSource(audioRef.current);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        sourceCreatedRef.current = true;

        console.log('✅ Audio visualizer initialized successfully');
      } catch (error) {
        console.warn('⚠️ Could not create audio analyser:', error);
        // Ne pas bloquer le reste de l'app si le visualizer échoue
      }
    };

    // Attendre l'événement 'play' pour initialiser l'analyseur
    // Cela garantit que l'utilisateur a interagi avec la page
    if (audioRef?.current && !sourceCreatedRef.current) {
      const audio = audioRef.current;
      const handlePlay = () => {
        initAudioAnalyser();
      };

      audio.addEventListener('play', handlePlay, { once: true });

      return () => {
        audio.removeEventListener('play', handlePlay);
      };
    }

    const draw = () => {
      if (!ctx || !canvas) return;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);

      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const barWidth = width / barCount;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + 'CC');
        gradient.addColorStop(1, color + '66');

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * dataArrayRef.current.length);
          const value = dataArrayRef.current[dataIndex] || 0;
          const barHeight = (value / 255) * height * 0.8;

          const x = i * barWidth;
          const y = height - barHeight;

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
      } else {
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + 'AA');
        gradient.addColorStop(1, color + '44');

        const time = Date.now() * 0.001;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const normalizedPosition = i / barCount;
          const wave1 = Math.sin(time * 2 + normalizedPosition * Math.PI * 4) * 0.3;
          const wave2 = Math.sin(time * 3 + normalizedPosition * Math.PI * 2) * 0.2;
          const wave3 = Math.sin(time * 1.5 + normalizedPosition * Math.PI * 6) * 0.15;
          const amplitude = (wave1 + wave2 + wave3 + 0.5) / 1.5;

          const barHeight = Math.max(height * 0.1, height * amplitude * 0.6);
          const x = i * barWidth;
          const y = height - barHeight;

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.8, pointerEvents: 'none' }}
    />
  );
}
