import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type SiteSettings = {
  whatsapp_number: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  site_name: string;
  site_tagline: string;
  site_description: string;
  footer_baseline: string;
  copyright_text: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp_number: '33123456789',
  contact_email: 'contact@votre-altesse.fr',
  contact_phone: '+33 1 23 45 67 89',
  contact_address: 'Paris, Île-de-France',
  site_name: 'Votre Altesse',
  site_tagline: 'L\'Excellence au Service du Partage',
  site_description: 'L\'Excellence au Service du Partage - WebTV, WebRadio, Événementiel, Académie & Plus',
  footer_baseline: 'L\'Excellence au Service du Partage - Média, Culture & Événementiel',
  copyright_text: 'Votre Altesse. Tous droits réservés.',
  social_facebook: 'https://facebook.com',
  social_instagram: 'https://instagram.com',
  social_youtube: 'https://youtube.com'
};

let cachedSettings: SiteSettings | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      // Utiliser le cache si disponible et récent
      const now = Date.now();
      if (cachedSettings && (now - cacheTime) < CACHE_DURATION) {
        setSettings(cachedSettings);
        setLoading(false);
        return;
      }

      // Charger depuis la base de données
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .eq('is_public', true);

      if (error) {
        console.error('Error loading site settings:', error);
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
        return;
      }

      // Convertir en objet
      const loadedSettings: SiteSettings = { ...DEFAULT_SETTINGS };
      data?.forEach((setting) => {
        if (setting.setting_key in loadedSettings) {
          (loadedSettings as any)[setting.setting_key] = setting.setting_value;
        }
      });

      // Mettre à jour le cache
      cachedSettings = loadedSettings;
      cacheTime = now;

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading site settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }

  function invalidateCache() {
    cachedSettings = null;
    cacheTime = 0;
    loadSettings();
  }

  return settings;
}

// Fonction utilitaire pour récupérer un paramètre spécifique
export async function getSetting(key: keyof SiteSettings): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .eq('is_public', true)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SETTINGS[key];
    }

    return data.setting_value;
  } catch (error) {
    console.error(`Error loading setting ${key}:`, error);
    return DEFAULT_SETTINGS[key];
  }
}
