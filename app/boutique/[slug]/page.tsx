'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, MapPin, Clock, Users, Instagram, Facebook, Globe, Twitter, Linkedin, ExternalLink, Ticket, Crown, Search, Filter, AlertCircle, Info, Phone, Mail, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Organizer {
  id: string;
  company_name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  email: string;
  phone: string | null;
  website: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  show_altess_branding: boolean;
  verified: boolean;
  premium_tier: string;
  banner_image: string | null;
  about_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface Event {
  id: string;
  title: string;
  short_description: string;
  event_date: string;
  venue_name: string | null;
  city: string;
  main_image: string | null;
  ticket_categories: any[];
  total_quota: number;
  tickets_sold: number;
}

export default function OrganizerStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');

  useEffect(() => {
    if (slug) {
      loadOrganizerData();
    }
  }, [slug]);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, cityFilter, priceFilter]);

  function filterEvents() {
    let filtered = [...events];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.short_description.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query)
      );
    }

    if (cityFilter !== 'all') {
      filtered = filtered.filter((event) => event.city === cityFilter);
    }

    if (priceFilter !== 'all') {
      filtered = filtered.filter((event) => {
        const prices = event.ticket_categories?.map((cat: any) => cat.price) || [];
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

        if (priceFilter === 'free') return minPrice === 0;
        if (priceFilter === 'under-50') return minPrice > 0 && minPrice < 50;
        if (priceFilter === '50-100') return minPrice >= 50 && minPrice <= 100;
        if (priceFilter === 'over-100') return minPrice > 100;
        return true;
      });
    }

    setFilteredEvents(filtered);
  }

  const uniqueCities = Array.from(new Set(events.map((e) => e.city))).sort();

  async function loadOrganizerData() {
    try {
      // Charger l'organisateur
      const { data: organizerData, error: organizerError } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (organizerError) throw organizerError;
      if (!organizerData) {
        setError('Organisateur introuvable');
        setLoading(false);
        return;
      }

      setOrganizer(organizerData);

      // Charger UNIQUEMENT les événements de cet organisateur
      const { data: eventsData, error: eventsError } = await supabase
        .from('public_events')
        .select('*')
        .eq('organizer_id', organizerData.user_id)
        .eq('is_active', true)
        .eq('is_visible', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      setEvents(eventsData || []);
    } catch (err) {
      console.error('Error loading organizer:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Page introuvable</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const brandColor = organizer.brand_color || '#F59E0B';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Pixel Tracking - Chargé côté client */}
      {/* Facebook Pixel & Google Analytics seraient injectés ici */}

      {/* Header de l'organisateur avec bannière */}
      <header className="relative overflow-hidden">
        {/* Bannière de fond */}
        {organizer.banner_image && (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={organizer.banner_image}
              alt="Bannière"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black"></div>
          </div>
        )}

        {/* Si pas de bannière, fond dégradé */}
        {!organizer.banner_image && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${brandColor}15 0%, transparent 100%)`
            }}
          />
        )}

        <div className="relative container mx-auto max-w-6xl py-16 px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Logo */}
            {organizer.logo_url && (
              <div className="w-32 h-32 rounded-2xl bg-white p-4 shadow-2xl">
                <img
                  src={organizer.logo_url}
                  alt={organizer.company_name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Infos */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold">
                  {organizer.company_name}
                </h1>
                {organizer.verified && (
                  <Badge className="bg-blue-500 text-white border-none">
                    <Crown className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </div>

              <p className="text-slate-300 mb-6">
                {organizer.about_text || 'Découvrez tous nos événements en exclusivité'}
              </p>

              <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                {/* Bouton À propos - POPUP */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-2 font-semibold"
                      style={{
                        borderColor: brandColor,
                        color: brandColor,
                      }}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      À propos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3 text-2xl">
                        {organizer.logo_url && (
                          <img
                            src={organizer.logo_url}
                            alt={organizer.company_name}
                            className="w-12 h-12 object-contain bg-white rounded-lg p-1"
                          />
                        )}
                        {organizer.company_name}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                      {/* À propos */}
                      {organizer.about_text && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: brandColor }}>
                            <Building2 className="w-5 h-5 inline mr-2" />
                            À propos
                          </h3>
                          <p className="text-slate-300 leading-relaxed">
                            {organizer.about_text}
                          </p>
                        </div>
                      )}

                      {/* Coordonnées */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: brandColor }}>
                          Nous contacter
                        </h3>
                        <div className="space-y-3">
                          {organizer.contact_email && (
                            <a
                              href={`mailto:${organizer.contact_email}`}
                              className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                            >
                              <Mail className="w-5 h-5" style={{ color: brandColor }} />
                              {organizer.contact_email}
                            </a>
                          )}
                          {organizer.contact_phone && (
                            <a
                              href={`tel:${organizer.contact_phone}`}
                              className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                            >
                              <Phone className="w-5 h-5" style={{ color: brandColor }} />
                              {organizer.contact_phone}
                            </a>
                          )}
                          {organizer.website && (
                            <a
                              href={organizer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                            >
                              <Globe className="w-5 h-5" style={{ color: brandColor }} />
                              {organizer.website.replace('https://', '').replace('http://', '')}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Réseaux sociaux */}
                      {(organizer.instagram_url || organizer.facebook_url || organizer.twitter_url || organizer.linkedin_url) && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3" style={{ color: brandColor }}>
                            Suivez-nous
                          </h3>
                          <div className="flex gap-3 flex-wrap">
                            {organizer.instagram_url && (
                              <a
                                href={organizer.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all text-white text-sm font-semibold"
                              >
                                <Instagram className="w-4 h-4" />
                                Instagram
                              </a>
                            )}
                            {organizer.facebook_url && (
                              <a
                                href={organizer.facebook_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all text-white text-sm font-semibold"
                              >
                                <Facebook className="w-4 h-4" />
                                Facebook
                              </a>
                            )}
                            {organizer.twitter_url && (
                              <a
                                href={organizer.twitter_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 transition-all text-white text-sm font-semibold"
                              >
                                <Twitter className="w-4 h-4" />
                                Twitter
                              </a>
                            )}
                            {organizer.linkedin_url && (
                              <a
                                href={organizer.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition-all text-white text-sm font-semibold"
                              >
                                <Linkedin className="w-4 h-4" />
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Liste des événements */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {events.length === 0 ? (
            <Card className="bg-gray-900 border-amber-500/20">
              <CardContent className="p-12 text-center">
                <Ticket className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Aucun événement à venir
                </h3>
                <p className="text-slate-400">
                  Revenez bientôt ou suivez-nous sur les réseaux sociaux !
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-center mb-8">
                Nos <span style={{ color: brandColor }}>Événements</span>
              </h2>

              {/* Barre de recherche et filtres premium */}
              <Card className="bg-gray-900 border-gray-800 mb-8">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recherche */}
                    <div className="md:col-span-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                          placeholder="Rechercher un événement..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-black border-gray-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    {/* Filtre par ville */}
                    <div>
                      <Select value={cityFilter} onValueChange={setCityFilter}>
                        <SelectTrigger className="bg-black border-gray-700 text-white">
                          <SelectValue placeholder="Toutes les villes" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="all" className="text-white hover:bg-gray-800">
                            Toutes les villes
                          </SelectItem>
                          {uniqueCities.map((city) => (
                            <SelectItem key={city} value={city} className="text-white hover:bg-gray-800">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtre par prix */}
                    <div>
                      <Select value={priceFilter} onValueChange={setPriceFilter}>
                        <SelectTrigger className="bg-black border-gray-700 text-white">
                          <SelectValue placeholder="Tous les prix" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="all" className="text-white hover:bg-gray-800">
                            Tous les prix
                          </SelectItem>
                          <SelectItem value="free" className="text-white hover:bg-gray-800">
                            Gratuit
                          </SelectItem>
                          <SelectItem value="under-50" className="text-white hover:bg-gray-800">
                            Moins de 50€
                          </SelectItem>
                          <SelectItem value="50-100" className="text-white hover:bg-gray-800">
                            50€ - 100€
                          </SelectItem>
                          <SelectItem value="over-100" className="text-white hover:bg-gray-800">
                            Plus de 100€
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Compteur de résultats */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <p className="text-slate-400">
                      {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
                    </p>
                    {(searchQuery || cityFilter !== 'all' || priceFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setCityFilter('all');
                          setPriceFilter('all');
                        }}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Message si aucun résultat */}
              {filteredEvents.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Aucun événement trouvé
                    </h3>
                    <p className="text-slate-400">
                      Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => {
                  const availableTickets = event.total_quota - event.tickets_sold;
                  const prices = event.ticket_categories?.map((cat: any) => cat.price) || [];
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                  return (
                    <Card
                      key={event.id}
                      className="group overflow-hidden bg-gray-900 border-gray-800 hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      onClick={() => router.push(`/boutique/${slug}/event/${event.id}`)}
                    >
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden bg-black">
                        {event.main_image ? (
                          <>
                            <img
                              src={event.main_image}
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-amber-400/30" />
                          </div>
                        )}

                        {/* Badge disponibilité dynamique avec urgence */}
                        {availableTickets > 0 && (
                          <Badge
                            className={`absolute top-3 right-3 border-none shadow-xl font-bold animate-pulse ${
                              availableTickets <= 10
                                ? 'bg-red-500 text-white'
                                : availableTickets <= 50
                                ? 'bg-amber-500 text-black'
                                : 'bg-green-500 text-white'
                            }`}
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {availableTickets <= 10
                              ? `Plus que ${availableTickets} places !`
                              : availableTickets <= 50
                              ? `${availableTickets} places restantes`
                              : `${availableTickets} places disponibles`}
                          </Badge>
                        )}
                        {availableTickets === 0 && (
                          <Badge className="absolute top-3 right-3 bg-gray-800 text-gray-300 border-none shadow-xl font-bold">
                            COMPLET
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-5">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                          {event.title}
                        </h3>

                        <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                          {event.short_description}
                        </p>

                        <div className="space-y-2 text-xs text-slate-400 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            {new Date(event.event_date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                          {event.venue_name && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-amber-400" />
                              {event.venue_name}, {event.city}
                            </div>
                          )}
                        </div>

                        {minPrice > 0 && (
                          <div className="mb-4">
                            <span className="text-sm text-slate-400">À partir de</span>
                            <div className="text-2xl font-bold" style={{ color: brandColor }}>
                              {minPrice.toFixed(2)}€
                            </div>
                          </div>
                        )}

                        <Button
                          className="w-full font-semibold text-black hover:scale-105 transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/boutique/${slug}/event/${event.id}`);
                          }}
                        >
                          <Ticket className="w-4 h-4 mr-2" />
                          Acheter des billets
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer ALTESS Branding */}
      {organizer.show_altess_branding && (
        <footer className="py-8 border-t border-gray-800">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-slate-400">
              Billetterie propulsée par{' '}
              <Link
                href="/"
                className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
              >
                ALTESS.fr
                <ExternalLink className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
