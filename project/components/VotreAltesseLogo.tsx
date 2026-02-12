'use client';

import { Crown, Sparkles, Radio } from 'lucide-react';

type LogoVariant = 'full' | 'icon' | 'compact';

interface VotreAltesseLogoProps {
  variant?: LogoVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const RoyalArchIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="royalGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      d="M 50 20 L 30 70 L 38 70 L 45 50 L 55 50 L 62 70 L 70 70 L 50 20 Z M 48 43 L 50 37 L 52 43 L 52 43 Z"
      fill="url(#royalGoldGradient)"
      stroke="#fef3c7"
      strokeWidth="1"
    />
    <circle cx="50" cy="15" r="3" fill="#fbbf24" opacity="0.8">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export default function VotreAltesseLogo({ variant = 'full', className = '', size = 'md' }: VotreAltesseLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  };

  const textSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16',
  };

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-xl blur-lg opacity-50 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 p-3 rounded-xl shadow-2xl">
            <RoyalArchIcon className={iconSizeClasses[size]} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-lg blur-md opacity-50"></div>
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 p-2 rounded-lg shadow-xl">
            <RoyalArchIcon className="w-5 h-5" />
          </div>
        </div>
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent tracking-tight`}>
          Votre Altesse
        </span>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center gap-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 p-4 rounded-2xl shadow-2xl border border-amber-300/30">
          <div className="relative">
            <RoyalArchIcon className={iconSizeClasses[size]} />
            <Crown className="absolute -top-1 -right-1 w-3 h-3 text-amber-200 animate-pulse" />
            <Radio className="absolute -bottom-1 -left-1 w-3 h-3 text-amber-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent tracking-tight`}>
            Votre Altesse
          </span>
          <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
        <span className="text-xs text-amber-400/90 tracking-wide font-semibold -mt-1 italic">
          L'Excellence au Service du Partage
        </span>
      </div>
    </div>
  );
}

export function VotreAltesseLogoText({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 blur-2xl opacity-30 animate-pulse"></div>
      <h1 className={`relative ${textSizes[size]} font-bold`}>
        <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent drop-shadow-2xl">
          Votre Altesse
        </span>
      </h1>
      <div className="absolute -top-2 -right-2">
        <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
      </div>
    </div>
  );
}

export function VotreAltesseLogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center gap-6 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 p-5 rounded-2xl shadow-2xl border-2 border-amber-300/40">
          <RoyalArchIcon className="w-12 h-12" />
        </div>
      </div>

      <div className="flex flex-col items-start">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent tracking-tight" style={{ fontFamily: 'serif' }}>
            Votre Altesse
          </span>
          <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-amber-400/90 tracking-wide italic font-semibold">
            L'Excellence au Service du Partage
          </span>
          <span className="text-xs text-amber-400/60 tracking-widest uppercase">
            • Web Radio & TV •
          </span>
        </div>
      </div>
    </div>
  );
}

export function VotreAltesseLogoMinimal({ className = '' }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-lg blur-md opacity-50"></div>
        <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 p-2 rounded-lg shadow-xl">
          <RoyalArchIcon className="w-6 h-6" />
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
        Votre Altesse
      </span>
    </div>
  );
}
