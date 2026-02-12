'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import MecenasCTAButton from '@/components/MecenasCTAButton';
import { useSiteSettings } from '@/hooks/use-site-settings';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const settings = useSiteSettings();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-black text-white mt-20">
      <div className="flex justify-center py-8 border-b border-slate-800/50">
        <MecenasCTAButton />
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {settings.site_name || 'Votre Altesse'}
            </h3>
            <p className="text-slate-300 mb-4">
              {settings.site_description || 'Le sens du partage - WebTV, WebRadio, Événementiel, Académie & Plus'}
            </p>
            <div className="flex gap-4">
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 p-2 rounded-full hover:bg-amber-500 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 p-2 rounded-full hover:bg-amber-500 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.social_youtube && (
                <a
                  href={settings.social_youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 p-2 rounded-full hover:bg-amber-500 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Nos Formules</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/orchestres/solo" className="text-slate-300 hover:text-amber-400 transition-colors">
                  Formule Solo
                </Link>
              </li>
              <li>
                <Link href="/orchestres/trio" className="text-slate-300 hover:text-amber-400 transition-colors">
                  Formule Trio
                </Link>
              </li>
              <li>
                <Link href="/orchestres/complet" className="text-slate-300 hover:text-amber-400 transition-colors">
                  Orchestre Complet
                </Link>
              </li>
              <li>
                <Link href="/composer-orchestre" className="text-slate-300 hover:text-amber-400 transition-colors">
                  Composer votre orchestre
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/academy" className="text-slate-300 hover:text-amber-400 transition-colors">
                  Académie de Musique
                </Link>
              </li>
              <li>
                <Link href="/" className="text-slate-300 hover:text-amber-400 transition-colors">
                  WebTV & WebRadio
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-300 hover:text-amber-400 transition-colors">
                  Espace Client
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-slate-300">
              {settings.contact_phone && (
                <li className="flex items-start gap-2">
                  <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{settings.contact_phone}</span>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex items-start gap-2">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{settings.contact_email}</span>
                </li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; {currentYear} {settings.copyright_text || 'Votre Altesse. Tous droits réservés.'}</p>
          <p className="mt-2 text-sm">
            {settings.footer_baseline || 'Le sens du partage - Média, Culture & Événementiel'}
          </p>
        </div>
      </div>
    </footer>
  );
}
