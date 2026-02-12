'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WhatsAppChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('33123456789');
  const [whatsappMessage, setWhatsappMessage] = useState(
    "Bonjour, je souhaite obtenir plus d'informations sur vos services."
  );

  useEffect(() => {
    loadWhatsAppSettings();
  }, []);

  async function loadWhatsAppSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('setting_key', ['whatsapp_number', 'whatsapp_message'])
        .eq('is_public', true);

      if (error) {
        console.error('Error loading WhatsApp settings:', error);
        return;
      }

      if (data) {
        const phoneData = data.find(s => s.setting_key === 'whatsapp_number');
        const messageData = data.find(s => s.setting_key === 'whatsapp_message');

        if (phoneData?.setting_value) {
          // Nettoyer le numéro pour l'URL WhatsApp (enlever les espaces, +, tirets)
          const cleanNumber = phoneData.setting_value.replace(/[\s+\-()]/g, '');
          setWhatsappNumber(cleanNumber);
        }

        if (messageData?.setting_value) {
          setWhatsappMessage(messageData.setting_value);
        }
      }
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
    }
  }

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  // Z-index optimisé: Card z-[99999], Button z-[100000] pour visibilité maximale
  return (
    <>
      {isOpen && (
        <Card className="fixed bottom-24 left-6 w-80 shadow-2xl z-[99999] animate-in slide-in-from-bottom-4">
          <CardHeader className="bg-green-600 text-white p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat WhatsApp
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-green-700 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Besoin d'aide ? Contactez-nous directement sur WhatsApp pour une réponse rapide.
            </p>
            <Button
              onClick={handleWhatsAppClick}
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Ouvrir WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-2xl bg-green-600 hover:bg-green-700 z-[100000] transition-transform hover:scale-110"
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </>
  );
}
