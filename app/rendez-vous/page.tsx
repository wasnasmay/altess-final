'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles, MapPin, Clock, Users, Euro, Ticket } from 'lucide-react';

type Event = {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  short_description: string;
  event_date: string;
  event_time: string;
  city: string;
  venue_name: string;
  main_image: string;
  ticket_categories: any[];
  total_quota: number;
  tickets_sold: number;
  is_free: boolean;
};

export default function RendezVousPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('public_events')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.event_type === filter);

  const eventTypes = [
    { value: 'all', label: 'Tous' },
    { value: 'concert', label: 'Concerts' },
    { value: 'festival', label: 'Festivals' },
    { value: 'soiree', label: 'Soirées' },
    { value: 'spectacle', label: 'Spectacles' },
    { value: 'conference', label: 'Conférences' },
    { value: 'atelier', label: 'Ateliers' },
  ];

  function getMinPrice(event: Event) {
    if (event.is_free || !event.ticket_categories || event.ticket_categories.length === 0) {
      return 0;
    }
    return Math.min(...event.ticket_categories.map((c: any) => c.price));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">ALTESS Rendez-vous</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 text-transparent bg-clip-text">
              Agenda des Événements
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Découvrez tous les concerts, festivals, spectacles et événements culturels à venir.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {eventTypes.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  variant={filter === type.value ? 'default' : 'outline'}
                  className={filter === type.value
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black'
                    : 'border-amber-500/30 text-gray-300 hover:bg-amber-500/10'
                  }
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {filteredEvents.map((event) => {
                const availableTickets = event.total_quota - event.tickets_sold;
                const minPrice = getMinPrice(event);

                return (
                  <Card
                    key={event.id}
                    className="group cursor-pointer bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700 hover:border-amber-500/50 transition-all overflow-hidden"
                    onClick={() => router.push(`/rendez-vous/${event.slug}`)}
                  >
                    {event.main_image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.main_image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold">
                            {event.event_type}
                          </Badge>
                        </div>
                        {availableTickets <= 10 && availableTickets > 0 && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-red-600 text-white">
                              Plus que {availableTickets} places
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-2 mb-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-400" />
                          <span>{new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          {event.event_time && (
                            <>
                              <Clock className="w-4 h-4 text-amber-400 ml-2" />
                              <span>{event.event_time}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          <span className="line-clamp-1">{event.venue_name || event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-400" />
                          <span>{availableTickets} places disponibles</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                        {event.short_description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                          {event.is_free ? (
                            <span className="text-lg font-bold text-green-400">Gratuit</span>
                          ) : (
                            <>
                              <Euro className="w-5 h-5 text-amber-400" />
                              <span className="text-lg font-bold text-amber-400">
                                À partir de {minPrice}€
                              </span>
                            </>
                          )}
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:from-amber-600 hover:to-orange-700">
                          <Ticket className="w-4 h-4 mr-1" />
                          Réserver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700 p-12 text-center max-w-2xl mx-auto">
              <Calendar className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Aucun événement pour le moment</h2>
              <p className="text-gray-300">
                Revenez bientôt pour découvrir de nouveaux événements !
              </p>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
