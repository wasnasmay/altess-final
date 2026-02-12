'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Check, X, Clock, Bookmark } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

type AvailabilityStatus = 'available' | 'partially_available' | 'unavailable' | 'booked';

type AvailabilityItem = {
  id: string;
  date: string;
  status: AvailabilityStatus;
};

const statusConfig = {
  available: {
    label: 'Disponible',
    color: 'bg-green-500',
    icon: Check,
  },
  partially_available: {
    label: 'Partiellement disponible',
    color: 'bg-orange-500',
    icon: Clock,
  },
  unavailable: {
    label: 'Indisponible',
    color: 'bg-red-500',
    icon: X,
  },
  booked: {
    label: 'Réservé',
    color: 'bg-blue-500',
    icon: Bookmark,
  },
};

export default function PartnerPublicAvailability({ partnerId }: { partnerId: string }) {
  const [availability, setAvailability] = useState<Record<string, AvailabilityItem>>({});
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadAvailability();
  }, [partnerId, currentMonth]);

  async function loadAvailability() {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('partner_availability')
        .select('id, date, status')
        .eq('partner_id', partnerId)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      const availabilityMap: Record<string, AvailabilityItem> = {};
      (data || []).forEach((item) => {
        availabilityMap[item.date] = item;
      });
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  const stats = {
    available: Object.values(availability).filter((a) => a.status === 'available').length,
    unavailable: Object.values(availability).filter((a) => a.status === 'unavailable').length,
  };

  if (stats.available === 0 && stats.unavailable === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 shadow-2xl shadow-amber-500/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-amber-400">
          <CalendarIcon className="w-6 h-6" />
          Disponibilités
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Consultez nos disponibilités en temps réel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const count = Object.values(availability).filter((a) => a.status === status).length;
            if (count === 0) return null;
            return (
              <div
                key={status}
                className={`flex items-center gap-2 p-3 bg-black/40 border border-amber-500/20 rounded-lg`}
              >
                <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 truncate">{config.label}</p>
                  <p className="text-lg font-bold text-white">{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-black/40 border border-amber-500/20 rounded-xl p-4">
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={fr}
            className="w-full"
            modifiers={{
              available: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'available';
              },
              unavailable: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'unavailable';
              },
              booked: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'booked';
              },
              partially: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'partially_available';
              },
            }}
            modifiersClassNames={{
              available: 'bg-green-500/20 text-green-400 font-bold',
              unavailable: 'bg-red-500/20 text-red-400 font-bold line-through',
              booked: 'bg-blue-500/20 text-blue-400 font-bold',
              partially: 'bg-orange-500/20 text-orange-400 font-bold',
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <div key={status} className="flex items-center gap-2 text-xs text-slate-400">
                <div className={`w-4 h-4 rounded ${config.color}`} />
                <span>{config.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
