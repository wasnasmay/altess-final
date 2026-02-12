'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DynamicWhatsAppButtonProps {
  phoneNumber?: string | null;
  message?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export default function DynamicWhatsAppButton({
  phoneNumber,
  message = "Bonjour, je souhaite obtenir plus d'informations.",
  className = '',
  size = 'default',
  variant = 'default'
}: DynamicWhatsAppButtonProps) {
  if (!phoneNumber) {
    return null;
  }

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);

  const handleClick = () => {
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      size={size}
      variant={variant}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      WhatsApp
    </Button>
  );
}
