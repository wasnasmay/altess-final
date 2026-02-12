'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WhatsAppFloatingButton() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    loadWhatsAppSettings();
  }, []);

  async function loadWhatsAppSettings() {
    try {
      const { data } = await supabase
        .from('whatsapp_settings')
        .select('phone_number')
        .eq('is_enabled', true)
        .maybeSingle();

      if (data) {
        setPhoneNumber(data.phone_number);
      }
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
    }
  }

  if (!phoneNumber) {
    return null;
  }

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent('Bonjour, je souhaite obtenir plus d\'informations sur vos orchestres orientaux.')}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-lg">
            <div className="font-semibold">WhatsApp</div>
            <div className="text-xs text-gray-300">{phoneNumber}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}

        {/* Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Contactez-nous sur WhatsApp"
        >
          <MessageCircle className="w-7 h-7" strokeWidth={2} />
        </a>

        {/* Pulse Animation */}
        <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20"></div>
      </div>
    </div>
  );
}
