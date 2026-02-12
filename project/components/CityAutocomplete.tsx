'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, X } from 'lucide-react';
import { frenchCities } from '@/lib/french-cities';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Rechercher une ville...',
  className = '',
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    onChange(query);

    if (query.length >= 2) {
      const filtered = frenchCities
        .filter((city) =>
          city.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10);
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setInputValue(city);
    onChange(city);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue) {
        onChange(inputValue);
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (inputValue) {
          onChange(inputValue);
          setShowSuggestions(false);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectCity(suggestions[selectedIndex]);
        } else if (inputValue) {
          onChange(inputValue);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600" />
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="pl-10 pr-10 bg-black/50 border-zinc-800 text-white placeholder:text-gray-600 text-sm rounded-lg focus:ring-1 focus:ring-amber-600/50 focus:border-amber-600/50"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl shadow-black/50 max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelectCity(city)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                index === selectedIndex
                  ? 'bg-amber-600/20 text-amber-400'
                  : 'text-gray-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
              <span>{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
