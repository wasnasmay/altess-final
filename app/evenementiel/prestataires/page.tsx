'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import SocialHourShowcase from '@/components/SocialHourShowcase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Search, MapPin, Star, Crown, Phone, Mail, ExternalLink, Award, TrendingUp } from 'lucide-react';

interface EventProvider {
  id: string;
  company_name: string;
  slug: string;
  category: string;
  short_description: string;
  main_image: string | null;
  logo_url: string | null;
  city: string | null;
  rating: number | null;
  total_reviews: number;
  is_featured: boolean;
  is_verified: boolean;
  pricing_range: string | null;
  services: string[];
}

const categories = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'traiteur', label: 'Traiteurs' },
  { value: 'photographe', label: 'Photographes' },
  { value: 'videaste', label: 'Vidéastes' },
  { value: 'decorateur', label: 'Décorateurs' },
  { value: 'dj', label: 'DJ & Musiciens' },
  { value: 'autre', label: 'Autres Services' },
];

const DEMO_PROVIDERS: EventProvider[] = [
  {
    id: '0',
    company_name: 'Orientale Musique - Orchestre Prestige',
    slug: 'notre-orchestre',
    category: 'dj',
    short_description: 'Orchestre professionnel de musique orientale pour mariages et événements d\'exception. Formules personnalisables avec musiciens traditionnels.',
    main_image: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg',
    logo_url: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?w=100',
    city: 'Paris',
    rating: 5.0,
    total_reviews: 245,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Premium',
    services: ['Orchestre complet', 'Musique tunisienne', 'Formation intimiste', 'Compositeur orchestre', 'Oud, Darbuka & Violon'],
  },
  {
    id: '1',
    company_name: 'Délices d\'Orient Traiteur',
    slug: 'delices-orient-traiteur',
    category: 'traiteur',
    short_description: 'Spécialiste de la cuisine orientale authentique pour vos événements prestigieux',
    main_image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    logo_url: 'https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg?w=100',
    city: 'Paris',
    rating: 4.9,
    total_reviews: 87,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Premium',
    services: ['Cuisine marocaine', 'Buffet oriental', 'Service traiteur', 'Pâtisserie orientale'],
  },
  {
    id: '2',
    company_name: 'Studio Vision Mariage',
    slug: 'studio-vision-mariage',
    category: 'photographe',
    short_description: 'Photographe professionnel spécialisé dans les mariages orientaux',
    main_image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg',
    logo_url: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?w=100',
    city: 'Lyon',
    rating: 4.8,
    total_reviews: 124,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Modéré',
    services: ['Mariage oriental', 'Portrait', 'Reportage', 'Drone'],
  },
  {
    id: '3',
    company_name: 'Ambiance Décor Premium',
    slug: 'ambiance-decor-premium',
    category: 'decorateur',
    short_description: 'Décoration florale et mise en scène pour événements d\'exception',
    main_image: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg',
    logo_url: 'https://images.pexels.com/photos/931162/pexels-photo-931162.jpeg?w=100',
    city: 'Marseille',
    rating: 4.7,
    total_reviews: 95,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Luxe',
    services: ['Décoration florale', 'Mise en scène', 'Design événementiel', 'Location mobilier'],
  },
  {
    id: '4',
    company_name: 'DJ Sofiane Events',
    slug: 'dj-sofiane-events',
    category: 'dj',
    short_description: 'Animation musicale orientale et internationale pour tous vos événements',
    main_image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
    logo_url: 'https://images.pexels.com/photos/811838/pexels-photo-811838.jpeg?w=100',
    city: 'Paris',
    rating: 4.9,
    total_reviews: 156,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Modéré',
    services: ['DJ mariage', 'Musique orientale', 'Son & lumière', 'Animation'],
  },
  {
    id: '5',
    company_name: 'Saveurs du Maghreb',
    slug: 'saveurs-du-maghreb',
    category: 'traiteur',
    short_description: 'Cuisine traditionnelle et moderne du Maghreb pour vos réceptions',
    main_image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg',
    logo_url: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?w=100',
    city: 'Toulouse',
    rating: 4.6,
    total_reviews: 67,
    is_featured: false,
    is_verified: true,
    pricing_range: 'Modéré',
    services: ['Couscous royal', 'Tajines', 'Méchoui', 'Pâtisserie'],
  },
  {
    id: '6',
    company_name: 'Lens & Light Photography',
    slug: 'lens-light-photography',
    category: 'photographe',
    short_description: 'Photographie artistique pour mariages, événements et portraits',
    main_image: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg',
    logo_url: 'https://images.pexels.com/photos/192136/pexels-photo-192136.jpeg?w=100',
    city: 'Paris',
    rating: 4.8,
    total_reviews: 143,
    is_featured: false,
    is_verified: true,
    pricing_range: 'Premium',
    services: ['Mariage', 'Portrait studio', 'Événement corporate', 'Photo artistique'],
  },
  {
    id: '7',
    company_name: 'Royal Palace Décoration',
    slug: 'royal-palace-decoration',
    category: 'decorateur',
    short_description: 'Décoration luxe pour mariages orientaux et événements prestigieux',
    main_image: 'https://images.pexels.com/photos/1679619/pexels-photo-1679619.jpeg',
    logo_url: 'https://images.pexels.com/photos/1444416/pexels-photo-1444416.jpeg?w=100',
    city: 'Bordeaux',
    rating: 4.9,
    total_reviews: 78,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Luxe',
    services: ['Décoration mariage', 'Kosha orientale', 'Éclairage LED', 'Fleurs premium'],
  },
  {
    id: '8',
    company_name: 'Beats & Oriental Music',
    slug: 'beats-oriental-music',
    category: 'dj',
    short_description: 'DJ et musiciens live pour une ambiance orientale inoubliable',
    main_image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
    logo_url: 'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?w=100',
    city: 'Lyon',
    rating: 4.8,
    total_reviews: 134,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Premium',
    services: ['DJ + Percussions', 'Orchestre oriental', 'Système son pro', 'Éclairage scénique'],
  },
  {
    id: '9',
    company_name: 'La Belle Patisserie Orientale',
    slug: 'belle-patisserie-orientale',
    category: 'autre',
    short_description: 'Pâtisserie orientale fine pour vos événements raffinés',
    main_image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg',
    logo_url: 'https://images.pexels.com/photos/1030899/pexels-photo-1030899.jpeg?w=100',
    city: 'Paris',
    rating: 4.9,
    total_reviews: 201,
    is_featured: true,
    is_verified: true,
    pricing_range: 'Modéré',
    services: ['Pâtisserie orientale', 'Wedding cake', 'Macarons orientaux', 'Buffet sucré'],
  },
];

export default function PrestatairesPage() {
  const [providers, setProviders] = useState<EventProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<EventProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [providers, searchQuery, selectedCategory, selectedCity, selectedBudget]);

  async function loadProviders() {
    try {
      const { data, error } = await supabase
        .from('event_providers')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) throw error;

      let providersData = data || [];

      if (providersData.length === 0) {
        providersData = DEMO_PROVIDERS;
      }

      setProviders(providersData);

      const citySet = new Set(providersData.map((p) => p.city).filter(Boolean));
      const uniqueCities = Array.from(citySet).sort();
      setCities(uniqueCities as string[]);
    } catch (error) {
      console.error('Error loading providers:', error);
      setProviders(DEMO_PROVIDERS);
      const citySet = new Set(DEMO_PROVIDERS.map((p) => p.city).filter(Boolean));
      const uniqueCities = Array.from(citySet).sort();
      setCities(uniqueCities as string[]);
    } finally {
      setLoading(false);
    }
  }

  function filterProviders() {
    let filtered = [...providers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.company_name.toLowerCase().includes(query) ||
          p.short_description.toLowerCase().includes(query) ||
          p.services?.some((s) => s.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter((p) => p.city === selectedCity);
    }

    if (selectedBudget !== 'all') {
      filtered = filtered.filter((p) => p.pricing_range === selectedBudget);
    }

    setFilteredProviders(filtered);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* BLOC 1: En-tête Compact Above-the-Fold */}
      <section className="pt-20 pb-4 bg-gradient-to-b from-black via-gray-900/50 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 mb-3">
              <Award className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400 tracking-wider uppercase">
                Réseau de Professionnels
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent leading-tight">
              Prestataires d'Excellence
            </h1>

            <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-snug mb-4">
              Trouvez votre prestataire idéal pour sublimer votre événement
            </p>
          </div>

          {/* Filtres Compacts */}
          <Card className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-amber-500/20 shadow-xl shadow-amber-500/10">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-10 bg-black/60 border-amber-500/30 focus:border-amber-500 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>

                {/* Catégorie */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 bg-black/60 border-amber-500/30 focus:border-amber-500 text-white text-sm">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Ville */}
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="h-10 bg-black/60 border-amber-500/30 focus:border-amber-500 text-white text-sm">
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Budget */}
                <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                  <SelectTrigger className="h-10 bg-black/60 border-amber-500/30 focus:border-amber-500 text-white text-sm">
                    <SelectValue placeholder="Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous budgets</SelectItem>
                    <SelectItem value="Modéré">Modéré</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Luxe">Luxe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  <span className="text-amber-400 font-semibold">{filteredProviders.length}</span> prestataire
                  {filteredProviders.length > 1 ? 's' : ''}
                </p>
                {(searchQuery || selectedCategory !== 'all' || selectedCity !== 'all' || selectedBudget !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedCity('all');
                      setSelectedBudget('all');
                    }}
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 text-xs px-3"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* BLOC 2: Grille des Prestataires */}
      <section className="py-8 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="container mx-auto px-4">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-amber-400/50" />
              </div>
              <p className="text-lg text-slate-400 mb-1">Aucun prestataire trouvé</p>
              <p className="text-sm text-slate-500">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className="group relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-amber-500/20 hover:border-amber-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02]"
                >
                  {/* Image de couverture */}
                  <div className="relative h-40 overflow-hidden bg-black">
                    {provider.main_image ? (
                      <>
                        <img
                          src={provider.main_image}
                          alt={provider.company_name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                        <TrendingUp className="w-16 h-16 text-amber-400/30" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {provider.is_featured && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-black border-none shadow-lg text-xs py-0.5">
                          <Crown className="w-2.5 h-2.5 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {provider.is_verified && (
                        <Badge className="bg-blue-500/90 text-white border-none shadow-lg text-xs py-0.5">
                          <Award className="w-2.5 h-2.5 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>

                    {/* Logo */}
                    {provider.logo_url && (
                      <div className="absolute bottom-2 left-2 w-12 h-12 rounded-lg bg-white/95 p-1.5 border border-amber-500/30 shadow-xl">
                        <img
                          src={provider.logo_url}
                          alt={`Logo ${provider.company_name}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {provider.company_name}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-snug mb-2">
                        {provider.short_description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                        {provider.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {provider.city}
                          </span>
                        )}
                        {provider.rating && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {provider.rating.toFixed(1)}
                            {provider.total_reviews > 0 && (
                              <span className="text-[10px]">({provider.total_reviews})</span>
                            )}
                          </span>
                        )}
                      </div>

                      {provider.pricing_range && (
                        <div className="text-xs text-amber-400 font-semibold mb-2">
                          {provider.pricing_range}
                        </div>
                      )}

                      {provider.services && provider.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {provider.services.slice(0, 3).map((service, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-amber-500/30 text-amber-400/90 text-[10px] py-0 px-1.5"
                            >
                              {service}
                            </Badge>
                          ))}
                          {provider.services.length > 3 && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-400/70 text-[10px] py-0 px-1.5"
                            >
                              +{provider.services.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold shadow-lg hover:shadow-amber-500/50 transition-all text-xs h-8"
                      onClick={() => {
                        if (provider.slug === 'notre-orchestre') {
                          window.location.href = '/evenementiel/notre-orchestre';
                        } else {
                          window.location.href = `/evenementiel/prestataires/${provider.slug}`;
                        }
                      }}
                    >
                      Voir le profil
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </CardContent>

                  {/* Effet lumineux hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-transparent group-hover:to-amber-500/5 transition-all duration-500 pointer-events-none"></div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BLOC 3: L'Heure des Réseaux Sociaux - Déplacé en bas */}
      <div className="py-12 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 px-4 py-2">
              📱 Réseaux Sociaux
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
              L'Heure des Réseaux Sociaux
            </h2>
          </div>
          <SocialHourShowcase />
        </div>
      </div>

      <Footer />
    </div>
  );
}
