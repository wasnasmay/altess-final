'use client';

import { Progress } from '@/components/ui/progress';
import { Calendar, Clock } from 'lucide-react';

interface ExpirationProgressBarProps {
  expiresAt?: string;
  createdAt?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ExpirationProgressBar({
  expiresAt,
  createdAt,
  showLabel = true,
  size = 'md',
}: ExpirationProgressBarProps) {
  if (!expiresAt) {
    return showLabel ? (
      <div className="text-xs text-zinc-500">Pas d'expiration</div>
    ) : null;
  }

  const now = Date.now();
  const expiryTime = new Date(expiresAt).getTime();
  const createdTime = createdAt ? new Date(createdAt).getTime() : now - 30 * 24 * 60 * 60 * 1000; // Default to 30 days ago if no created date

  // Calculate progress (0-100, where 0 = just created, 100 = expired)
  const totalDuration = expiryTime - createdTime;
  const elapsed = now - createdTime;
  const progressValue = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  // Calculate days remaining
  const daysRemaining = Math.floor((expiryTime - now) / (1000 * 60 * 60 * 24));

  // Determine status and color
  let status: 'active' | 'expiring' | 'expired' = 'active';
  let colorClass = 'bg-green-500';
  let textColorClass = 'text-green-400';
  let bgColorClass = 'bg-green-500/20';
  let borderColorClass = 'border-green-500/30';

  if (daysRemaining < 0) {
    status = 'expired';
    colorClass = 'bg-red-500';
    textColorClass = 'text-red-400';
    bgColorClass = 'bg-red-500/20';
    borderColorClass = 'border-red-500/30';
  } else if (daysRemaining <= 7) {
    status = 'expiring';
    colorClass = 'bg-red-500';
    textColorClass = 'text-red-400';
    bgColorClass = 'bg-red-500/20';
    borderColorClass = 'border-red-500/30';
  } else if (daysRemaining <= 30) {
    status = 'expiring';
    colorClass = 'bg-orange-500';
    textColorClass = 'text-orange-400';
    bgColorClass = 'bg-orange-500/20';
    borderColorClass = 'border-orange-500/30';
  } else if (daysRemaining <= 60) {
    status = 'expiring';
    colorClass = 'bg-yellow-500';
    textColorClass = 'text-yellow-400';
    bgColorClass = 'bg-yellow-500/20';
    borderColorClass = 'border-yellow-500/30';
  }

  // Status label
  let statusLabel = '';
  if (daysRemaining < 0) {
    statusLabel = 'Expiré';
  } else if (daysRemaining === 0) {
    statusLabel = 'Expire aujourd\'hui';
  } else if (daysRemaining === 1) {
    statusLabel = 'Expire demain';
  } else if (daysRemaining <= 7) {
    statusLabel = `${daysRemaining} jours restants`;
  } else if (daysRemaining <= 30) {
    statusLabel = `${daysRemaining} jours`;
  } else {
    statusLabel = new Date(expiresAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  const textSizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="space-y-1">
      {/* Progress Bar */}
      <div className={`relative overflow-hidden rounded-full ${heightClass} bg-zinc-800`}>
        <div
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${progressValue}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 ${textSizeClass} ${textColorClass}`}>
            {status === 'expired' ? (
              <Clock className="w-3 h-3" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            <span className="font-medium">{statusLabel}</span>
          </div>
          {status !== 'active' && daysRemaining >= 0 && (
            <div
              className={`px-2 py-0.5 rounded-full ${bgColorClass} border ${borderColorClass} ${textSizeClass} ${textColorClass} font-semibold`}
            >
              {daysRemaining <= 7 ? 'URGENT' : 'Bientôt'}
            </div>
          )}
          {status === 'expired' && (
            <div
              className={`px-2 py-0.5 rounded-full ${bgColorClass} border ${borderColorClass} ${textSizeClass} ${textColorClass} font-semibold`}
            >
              MASQUÉ AUTO
            </div>
          )}
        </div>
      )}
    </div>
  );
}
