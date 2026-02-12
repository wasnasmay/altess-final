'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface PartnerGoogleMapProps {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function PartnerGoogleMap({ address, latitude, longitude }: PartnerGoogleMapProps) {
  const hasCoordinates = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  const googleMapsLink = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-amber-400">
          <MapPin className="w-6 h-6" />
          Localisation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full h-[400px] bg-gradient-to-br from-slate-900 to-black">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <MapPin className="w-16 h-16 text-amber-500/50 mb-4" />
            <p className="text-white text-lg font-semibold mb-2">{address}</p>
            <p className="text-slate-400 text-sm mb-6">
              Cliquez ci-dessous pour voir l'itinéraire sur Google Maps
            </p>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all"
            >
              <MapPin className="w-5 h-5" />
              Voir sur Google Maps
            </a>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]" />
            <div className="absolute inset-0 border-2 border-amber-500/20" />
          </div>
        </div>

        <div className="bg-black/60 border-t border-amber-500/20 p-4">
          <p className="text-xs text-slate-500 text-center">
            <strong className="text-amber-400">Note:</strong> Pour afficher une carte interactive, une clé API Google Maps doit être configurée.
            En attendant, utilisez le bouton ci-dessus pour accéder à Google Maps.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
