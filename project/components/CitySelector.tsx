'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { frenchCities, frenchCountries } from '@/lib/french-cities';

type CitySelectorProps = {
  value?: string;
  onChange: (location: string, isInternational: boolean) => void;
  internationalCity?: string;
  internationalCountry?: string;
  onInternationalCityChange?: (city: string) => void;
  onInternationalCountryChange?: (country: string) => void;
  label?: string;
  required?: boolean;
};

export function CitySelector({
  value,
  onChange,
  internationalCity = '',
  internationalCountry = '',
  onInternationalCityChange,
  onInternationalCountryChange,
  label = "Lieu de l'événement",
  required = false,
}: CitySelectorProps) {
  const [isInternational, setIsInternational] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = frenchCities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCountries = frenchCountries.filter(country =>
    country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleValueChange = (newValue: string) => {
    if (newValue === 'international') {
      setIsInternational(true);
      onChange('', true);
    } else {
      setIsInternational(false);
      onChange(newValue, false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label} {required && '*'}</Label>
      <Select
        value={isInternational ? 'international' : value}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="h-12 text-base">
          <SelectValue placeholder="Sélectionner une ville" />
        </SelectTrigger>
        <SelectContent>
          <div className="sticky top-0 z-50 bg-background p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <SelectItem value="international" className="font-semibold text-primary">
            À l&apos;étranger
          </SelectItem>

          <div className="max-h-[300px] overflow-y-auto">
            {searchQuery === '' ? (
              frenchCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))
            ) : filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground text-center">
                Aucune ville trouvée
              </div>
            )}
          </div>
        </SelectContent>
      </Select>

      {isInternational && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <Label htmlFor="event_country" className="text-sm">Pays *</Label>
            <Select
              value={internationalCountry}
              onValueChange={(value) => {
                onInternationalCountryChange?.(value);
                if (internationalCity) {
                  onChange(`${internationalCity}, ${value}`, true);
                }
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-50 bg-background p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un pays..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {searchQuery === '' ? (
                    frenchCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))
                  ) : filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucun pays trouvé
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="event_international_city" className="text-sm">Ville *</Label>
            <Input
              id="event_international_city"
              value={internationalCity}
              onChange={(e) => {
                const city = e.target.value;
                onInternationalCityChange?.(city);
                if (internationalCountry) {
                  onChange(`${city}, ${internationalCountry}`, true);
                }
              }}
              placeholder="Nom de la ville"
              className="h-11"
            />
          </div>
        </div>
      )}
    </div>
  );
}
