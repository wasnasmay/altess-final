'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type TickerMessage = {
  id: string;
  message: string;
  background_color: string;
  text_color: string;
  display_duration_seconds: number;
};

export default function AdvertisingTicker() {
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickerMessages();

    const channel = supabase
      .channel('advertising_tickers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advertising_tickers'
        },
        () => {
          loadTickerMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const currentMessage = messages[currentIndex];
    const duration = (currentMessage?.display_duration_seconds || 30) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, messages]);

  async function loadTickerMessages() {
    try {
      const { data, error } = await supabase
        .from('advertising_tickers')
        .select('id, message, background_color, text_color, display_duration_seconds')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages ticker:', error);
    }
  }

  if (messages.length === 0) return null;

  const currentMessage = messages[currentIndex];

  return (
    <div
      className="relative w-full h-12 overflow-hidden flex items-center border border-amber-500/30 rounded-xl"
      style={{
        background: `linear-gradient(90deg, ${currentMessage.background_color}f0 0%, ${currentMessage.background_color} 50%, ${currentMessage.background_color}f0 100%)`,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(217, 119, 6, 0.1)'
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

      <div
        ref={tickerRef}
        className="ticker-content whitespace-nowrap relative z-10"
        style={{
          color: currentMessage.text_color,
          animation: 'ticker-scroll 35s linear infinite'
        }}
      >
        <span
          className="inline-block px-6 text-sm md:text-base font-bold tracking-wide"
          style={{
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.08em'
          }}
        >
          {currentMessage.message}
        </span>
        <span
          className="inline-block px-6 text-sm md:text-base font-bold tracking-wide"
          style={{
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.08em'
          }}
        >
          {currentMessage.message}
        </span>
        <span
          className="inline-block px-6 text-sm md:text-base font-bold tracking-wide"
          style={{
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.08em'
          }}
        >
          {currentMessage.message}
        </span>
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .ticker-content {
          display: inline-flex;
          padding-left: 100%;
          animation: ticker-scroll 35s linear infinite;
          will-change: transform;
        }

        @media (max-width: 768px) {
          .ticker-content {
            animation: ticker-scroll 25s linear infinite;
          }
        }

        @media (min-width: 1920px) {
          .ticker-content {
            animation: ticker-scroll 40s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}
