'use client';

import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PremiumBadgeProps {
  isPremium: boolean;
  expiresAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showExpiry?: boolean;
}

export default function PremiumBadge({
  isPremium,
  expiresAt,
  size = 'md',
  showExpiry = false,
}: PremiumBadgeProps) {
  if (!isPremium) {
    return null;
  }

  // Check if expired
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  if (isExpired) {
    return null;
  }

  // Check if expiring soon (within 7 days)
  const isExpiringSoon = expiresAt && new Date(expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  const iconSize =
    size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`
          bg-gradient-to-r from-amber-500/20 to-amber-600/20
          text-amber-400
          border-amber-500/40
          hover:border-amber-500/60
          flex items-center gap-1
          ${textSize}
          font-semibold
          ${isExpiringSoon ? 'animate-pulse' : ''}
        `}
      >
        <Crown className={`${iconSize} fill-amber-500`} />
        PREMIUM
      </Badge>
      {showExpiry && expiresAt && (
        <span
          className={`
            ${textSize}
            ${isExpiringSoon ? 'text-orange-400 font-semibold' : 'text-zinc-500'}
          `}
        >
          {isExpiringSoon
            ? `Expire dans ${Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours`
            : `Jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
        </span>
      )}
    </div>
  );
}
