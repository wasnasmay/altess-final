'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  city: string;
  venueName?: string;
}

export default function GoogleMapsLocationPicker({
  onLocationSelect,
  initialAddress = ''
}: {
  onLocationSelect: (location: LocationData) => void;
  initialAddress?: string;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=5`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching address:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (address) {
        searchAddress(address);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [address, searchAddress]);

  const handleSelectSuggestion = (suggestion: any) => {
    const locationData: LocationData = {
      address: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || ''
    };

    setAddress(suggestion.display_name);
    setSelectedLocation(locationData);
    setShowSuggestions(false);
    onLocationSelect(locationData);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Label className="text-white font-semibold mb-2 block">
          <MapPin className="w-4 h-4 inline mr-2" />
          Rechercher une adresse
        </Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Tapez une adresse..."
          className="bg-black border-gray-700 text-white"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      {suggestion.address?.road || suggestion.address?.suburb || 'Adresse'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {suggestion.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border-2 border-amber-500/30 shadow-xl">
            <iframe
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.lng - 0.01},${selectedLocation.lat - 0.01},${selectedLocation.lng + 0.01},${selectedLocation.lat + 0.01}&layer=mapnik&marker=${selectedLocation.lat},${selectedLocation.lng}`}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`, '_blank')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Ouvrir dans Maps
            </Button>
            <Button
              onClick={() => {
                setSelectedLocation(null);
                setAddress('');
              }}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:bg-gray-800"
            >
              Effacer
            </Button>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Coordonnées GPS</p>
            <p className="text-sm text-amber-400 font-mono">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
