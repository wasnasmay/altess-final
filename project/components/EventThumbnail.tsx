import { Calendar } from 'lucide-react';

interface EventThumbnailProps {
  imageUrl?: string | null;
  eventTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'circle';
  className?: string;
}

export default function EventThumbnail({
  imageUrl,
  eventTitle = 'Événement',
  size = 'sm',
  shape = 'square',
  className = ''
}: EventThumbnailProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const shapeClasses = {
    square: 'rounded-lg',
    circle: 'rounded-full'
  };

  const baseClasses = `
    ${sizeClasses[size]}
    ${shapeClasses[shape]}
    border-2 border-amber-500/40
    shadow-sm
    flex items-center justify-center
    overflow-hidden
    bg-gradient-to-br from-amber-500/10 to-amber-600/5
    transition-all duration-200
    hover:border-amber-500/60
    hover:shadow-md
    ${className}
  `;

  if (imageUrl) {
    return (
      <div className={baseClasses}>
        <img
          src={imageUrl}
          alt={eventTitle}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/10';
              fallback.innerHTML = `<svg class="w-1/2 h-1/2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      <Calendar className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-amber-600`} />
    </div>
  );
}
