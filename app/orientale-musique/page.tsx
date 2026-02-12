'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Music2, Users, Calendar, Award, Sparkles, Star, ArrowLeft, Phone, Mail, MapPin, ExternalLink, Menu, X, ChevronDown, CheckCircle, Music, Globe, Heart, Video, Tv, Crown, TrendingUp, ArrowRight, Home as HomeIcon, Info as InfoIcon } from 'lucide-react';
import NetflixCarousel from '@/components/NetflixCarousel';
import OrientaleMusiquelogo from '@/components/OrientaleMusiquelogo';
import OrientaleMusiqueIllustration from '@/components/OrientaleMusiqueIllustration';
import PremiumAudioPlayer from '@/components/PremiumAudioPlayer';
import OrientaleMusiqueQuoteForm from '@/components/OrientaleMusiqueQuoteForm';

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  price_from: number;
  duration_hours: number;
  musicians_count: number;
  features: any;
  is_popular: boolean;
  stripe_payment_link?: string;
};

type CarouselMediaItem = {
  id: string;
  title: string;
  description: string | null;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  category: string;
  order_position: number;
};

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
};

export default function OrientaleMusiqueWhiteLabelPage() {
  const router = useRouter();
  const [formulas, setFormulas] = useState<OrchestraFormula[]>([]);
  const [carouselMedia, setCarouselMedia] = useState<CarouselMediaItem[]>([]);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<string>('');

  useEffect(() => {
    loadData();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ['accueil', 'demo', 'galerie', 'formules', 'apropos', 'contact'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 150 && rect.bottom >= 150;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function loadData() {
    try {
      const [formulasRes, carouselRes, demoRes] = await Promise.all([
        supabase
          .from('orchestra_formulas')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('carousel_media')
          .select('*')
          .eq('is_active', true)
          .eq('category', 'home')
          .order('order_position', { ascending: true }),
        supabase
          .from('demo_videos')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
      ]);

      console.log('[Orientale Musique] Carousel loaded:', carouselRes.data?.length || 0, 'items');
      console.log('[Orientale Musique] Formulas loaded:', formulasRes.data?.length || 0, 'items');

      if (formulasRes.data) setFormulas(formulasRes.data);
      if (carouselRes.data) {
        console.log('[Orientale Musique] Setting carousel media:', carouselRes.data);
        setCarouselMedia(carouselRes.data);
      }
      if (demoRes.data) setDemoVideos(demoRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getYouTubeEmbedUrl(url: string): string {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (videoIdMatch) {
      return `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}?autoplay=1&controls=1&rel=0`;
    }
    return url;
  }

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  }

  const menuItems = [
    { id: 'accueil', label: 'Accueil', icon: HomeIcon },
    { id: 'demo', label: 'Démos', icon: Video },
    { id: 'galerie', label: 'Galerie', icon: Tv },
    { id: 'formules', label: 'Formules', icon: Award },
    { id: 'apropos', label: 'À Propos', icon: InfoIcon },
  ];

  function openQuoteForm(formulaName: string = '') {
    setSelectedFormula(formulaName);
    setIsQuoteFormOpen(true);
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Quote Form Modal */}
      <OrientaleMusiqueQuoteForm
        isOpen={isQuoteFormOpen}
        onClose={() => setIsQuoteFormOpen(false)}
        formulaName={selectedFormula}
      />

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="relative w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={getYouTubeEmbedUrl(selectedVideo)}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <Button
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section - Version Ultra Premium avec Vidéo */}
      <section id="accueil" className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Vidéo de fond cinématographique */}
        <div className="absolute inset-0 z-0">
          {/* Vidéo Background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1920"
          >
            <source src="https://cdn.pixabay.com/video/2020/09/05/49308-456097473_large.mp4" type="video/mp4" />
          </video>

          {/* Overlay sombre pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

          {/* Cercles lumineux subtils par-dessus */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-600/30 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-yellow-600/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Grille dorée subtile */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }} />
        </div>

        <div className="relative z-20 container mx-auto px-4 text-center">
          {/* Badge Premium avec Animation */}
          <div className="mb-8 inline-flex items-center gap-3 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-2 border-amber-600/50 rounded-full px-8 py-3 backdrop-blur-md shadow-2xl shadow-amber-600/30 animate-pulse">
            <Crown className="w-5 h-5 text-amber-400 animate-bounce" style={{ animationDuration: '2s' }} />
            <span className="text-base md:text-lg text-amber-300 font-semibold tracking-wide">Orchestre Oriental de Prestige</span>
            <Badge className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black border-0 font-bold px-3 py-1 text-sm shadow-lg shadow-amber-600/50">EXCELLENCE</Badge>
          </div>

          {/* Titre Principal Impressionnant */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in break-words overflow-wrap-anywhere px-2">
            <span className="block mb-2">Orientale</span>
            <span className="block bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">Musique</span>
          </h1>

          {/* Sous-titre avec plus d'Impact */}
          <p className="text-base md:text-xl lg:text-2xl text-amber-100/80 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
            L'excellence de la <span className="text-amber-400 font-semibold">musique orientale</span> pour sublimer vos soirées de luxe et événements prestigieux
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Card className="bg-gradient-to-br from-amber-950/50 to-black border-amber-700/30 backdrop-blur-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-900/50">
                  <Users className="w-6 h-6 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-amber-500">Musiciens</p>
                  <p className="text-base font-bold text-amber-200">Professionnels</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-950/50 to-black border-amber-700/30 backdrop-blur-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/50">
                  <Award className="w-6 h-6 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-amber-500">Expérience</p>
                  <p className="text-base font-bold text-amber-200">15+ Ans</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-950/50 to-black border-amber-700/30 backdrop-blur-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-yellow-700 flex items-center justify-center shadow-lg shadow-amber-900/50">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-amber-500">Événements</p>
                  <p className="text-base font-bold text-amber-200">500+ Réalisés</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold shadow-xl shadow-amber-900/50"
            >
              <Phone className="w-5 h-5 mr-2" />
              Demander un Devis
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('demo')}
              className="border-2 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black transition-all backdrop-blur-sm"
            >
              <Play className="w-5 h-5 mr-2" />
              Voir nos Performances
            </Button>
          </div>
        </div>
      </section>

      {/* Nos Formules Section - Ultra Premium - DÉPLACÉ EN PREMIER */}
      <section id="formules" className="py-20 relative bg-gradient-to-b from-zinc-950 via-amber-950/10 to-black">
        {/* Effet de fond */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-5 bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-0 px-6 py-2 text-base shadow-lg shadow-amber-600/30">
              <Award className="w-4 h-4 mr-2" />
              Nos Offres Exclusives
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent break-words overflow-wrap-anywhere px-2">
              Formules Premium
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-amber-200/70 max-w-3xl mx-auto leading-relaxed px-4">
              Des prestations sur mesure adaptées à vos événements de prestige.
              <span className="block mt-2 text-amber-400 font-semibold">Choisissez l'excellence qui vous ressemble</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {formulas.map((formula, index) => {
              const formulaImages: Record<string, string> = {
                'essentielle': 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
                'prestige': 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=800',
                'royale': 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800',
              };
              const formulaImage = formulaImages[formula.slug?.toLowerCase()] || 'https://images.pexels.com/photos/1682699/pexels-photo-1682699.jpeg?auto=compress&cs=tinysrgb&w=800';

              return (
                <Card
                  key={formula.id}
                  className={`bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-black border-2 backdrop-blur-md overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                    formula.is_popular
                      ? 'border-amber-500 shadow-2xl shadow-amber-900/60 transform scale-105'
                      : 'border-amber-700/30 hover:border-amber-600/60'
                  }`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {formula.is_popular && (
                    <div className="relative bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black text-center py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg">
                      <Crown className="w-4 h-4 animate-pulse" />
                      <span className="tracking-wide">FORMULE POPULAIRE</span>
                      <Star className="w-4 h-4 fill-black animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                  )}

                  {/* Image d'illustration de la formule */}
                  <div className="relative aspect-video overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                    <img
                      src={formulaImage}
                      alt={formula.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 z-20">
                      <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-0 font-bold shadow-lg">
                        <Music2 className="w-3 h-3 mr-1" />
                        {formula.musicians_count} musiciens
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-amber-200 mb-2">{formula.name}</h3>
                    <p className="text-sm text-amber-300/60 mb-4 line-clamp-2">{formula.description}</p>

                    <div className="mb-5">
                      <div className="text-xs text-amber-500/70">
                        {formula.duration_hours}h • {formula.musicians_count} musiciens
                      </div>
                    </div>

                    <ul className="space-y-2 mb-5">
                      {(Array.isArray(formula.features) ? formula.features : []).slice(0, 4).map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-amber-200/80">
                          <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {Array.isArray(formula.features) && formula.features.length > 4 && (
                        <li className="text-xs text-amber-500/60 italic">
                          +{formula.features.length - 4} autres avantages...
                        </li>
                      )}
                    </ul>

                    <Link href={`/orientale-musique/formules/${formula.slug || formula.id}`}>
                      <Button
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold shadow-lg mb-2"
                      >
                        En Savoir Plus
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>

                    {formula.stripe_payment_link && (
                      <Button
                        variant="outline"
                        className="w-full border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black text-xs"
                        onClick={() => window.open(formula.stripe_payment_link, '_blank')}
                      >
                        Réserver Maintenant
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Fiche "Composez votre Orchestre" */}
            <Card
              className="bg-gradient-to-br from-amber-950/40 via-yellow-900/20 to-black border-2 border-amber-600/50 backdrop-blur-md overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-amber-500 shadow-xl shadow-amber-900/40"
            >
              {/* Image d'illustration */}
              <div className="relative aspect-video overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                <img
                  src="https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Composez votre Orchestre"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute top-4 right-4 z-20">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-0 font-bold shadow-lg animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Sur Mesure
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold text-amber-200">Composez votre Orchestre</h3>
                </div>
                <p className="text-sm text-amber-300/60 mb-4">
                  Créez une formation personnalisée adaptée à vos besoins et votre budget
                </p>

                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2 text-xs text-amber-200/80">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Choix du nombre de musiciens</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-amber-200/80">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Répertoire sur mesure</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-amber-200/80">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Durée flexible</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-amber-200/80">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Devis personnalisé gratuit</span>
                  </li>
                </ul>

                <Button
                  onClick={() => openQuoteForm('Personnalisée')}
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold shadow-lg"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Demander un Devis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lecteur Audio Premium */}
      <PremiumAudioPlayer />

      {/* Vidéos Démo Section */}
      {demoVideos.length > 0 && (
        <section id="demo" className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-0">
                <Video className="w-3 h-3 mr-1" />
                Vidéos Démo
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Nos Vidéos de Démonstration
              </h2>
              <p className="text-base text-amber-200/60 max-w-2xl mx-auto">
                Découvrez la qualité exceptionnelle de nos prestations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {demoVideos.map((video) => (
                <Card
                  key={video.id}
                  className="bg-gradient-to-br from-amber-950/30 to-black border-amber-700/20 overflow-hidden cursor-pointer group hover:border-amber-600/50 transition-all hover:scale-105"
                  onClick={() => setSelectedVideo(video.video_url)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={video.thumbnail_url || '/image_(4).png'}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl shadow-amber-900/50">
                        <Play className="w-7 h-7 text-black ml-1" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-amber-200 text-base mb-1">{video.title}</h3>
                    <p className="text-sm text-amber-300/50 line-clamp-2">{video.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Galerie Section - Version Premium */}
      <section id="galerie" className="py-20 relative bg-gradient-to-b from-amber-950/20 via-black to-zinc-950">
        <div className="container mx-auto px-4">
          {/* En-tête Section Galerie */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-600 to-amber-600 text-black border-0 px-6 py-2 text-base shadow-lg shadow-amber-600/30">
              <Tv className="w-4 h-4 mr-2" />
              Galerie Premium
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Nos Performances en Images
            </h2>
            <p className="text-lg md:text-xl text-amber-200/70 max-w-3xl mx-auto leading-relaxed">
              Découvrez l'ambiance exceptionnelle de nos prestations à travers cette sélection exclusive
            </p>
          </div>

          {/* Carousel ou Message */}
          <div className="max-w-7xl mx-auto">
            {carouselMedia.length > 0 ? (
              <NetflixCarousel
                title=""
                items={carouselMedia.map((media) => ({
                  type: media.type,
                  url: media.url,
                  thumbnail: media.thumbnail_url || media.url,
                  title: media.title
                }))}
              />
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-600/20 to-yellow-600/20 flex items-center justify-center border-2 border-amber-600/30">
                  <Tv className="w-12 h-12 text-amber-400" />
                </div>
                <p className="text-xl text-amber-400/80">Galerie en cours de chargement...</p>
                <p className="text-sm text-amber-600/60 mt-2">Nos plus belles images arrivent bientôt</p>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Section Témoignages Clients */}
      <section className="py-20 relative bg-gradient-to-b from-black via-amber-950/5 to-black overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-5 bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-0 px-6 py-2 text-base shadow-lg shadow-amber-600/30">
              <Heart className="w-4 h-4 mr-2" />
              Témoignages
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
              Ils Nous Font Confiance
            </h2>
            <p className="text-lg md:text-xl text-amber-200/70 max-w-3xl mx-auto">
              Découvrez les avis de nos clients satisfaits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Témoignage 1 */}
            <Card className="bg-gradient-to-br from-amber-950/40 to-black border-2 border-amber-700/30 backdrop-blur-md hover:border-amber-600/60 transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-amber-200/80 mb-6 leading-relaxed italic">
                  "Un orchestre exceptionnel qui a sublimé notre mariage. Les musiciens sont talentueux et l'ambiance était magique. Nos invités en parlent encore !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center">
                    <span className="text-black font-bold">SM</span>
                  </div>
                  <div>
                    <p className="text-amber-300 font-semibold">Sarah & Mohamed</p>
                    <p className="text-amber-600/70 text-sm">Mariage - Paris</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Témoignage 2 */}
            <Card className="bg-gradient-to-br from-amber-950/40 to-black border-2 border-amber-700/30 backdrop-blur-md hover:border-amber-600/60 transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-amber-200/80 mb-6 leading-relaxed italic">
                  "Professionnalisme et qualité au rendez-vous. L'orchestre a su créer une ambiance authentique et festive. Je recommande vivement !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center">
                    <span className="text-black font-bold">KA</span>
                  </div>
                  <div>
                    <p className="text-amber-300 font-semibold">Karim A.</p>
                    <p className="text-amber-600/70 text-sm">Événement d'entreprise - Lyon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Témoignage 3 */}
            <Card className="bg-gradient-to-br from-amber-950/40 to-black border-2 border-amber-700/30 backdrop-blur-md hover:border-amber-600/60 transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-amber-200/80 mb-6 leading-relaxed italic">
                  "Une prestation de très haut niveau. Les musiciens sont passionnés et cela se ressent. Notre soirée était inoubliable grâce à eux !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center">
                    <span className="text-black font-bold">LN</span>
                  </div>
                  <div>
                    <p className="text-amber-300 font-semibold">Leila N.</p>
                    <p className="text-amber-600/70 text-sm">Soirée privée - Marseille</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section À Propos */}
      <section id="apropos" className="py-10 relative bg-gradient-to-b from-amber-950/10 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-black border-0">
                <Heart className="w-3 h-3 mr-1" />
                Notre Histoire
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
                À Propos d'Orientale Musique
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <OrientaleMusiqueIllustration />
              </div>
              <div className="space-y-4 text-amber-200/80 text-sm leading-relaxed">
                <p>
                  Orientale Musique incarne l'excellence de la musique orientale depuis plus de 15 ans.
                  Nos orchestres professionnels subliment vos mariages de luxe, galas et événements prestigieux.
                </p>
                <p>
                  Notre équipe de musiciens d'exception met son talent au service de vos soirées les plus raffinées.
                  Du répertoire oriental traditionnel aux créations modernes, nous créons une ambiance inoubliable.
                </p>
                <div className="grid grid-cols-3 gap-4 my-6">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-900/20 to-black border border-amber-700/20">
                    <div className="text-3xl font-black text-amber-400 mb-1">500+</div>
                    <div className="text-xs text-amber-500/70">Événements</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-900/20 to-black border border-amber-700/20">
                    <div className="text-3xl font-black text-amber-400 mb-1">15+</div>
                    <div className="text-xs text-amber-500/70">Années</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-900/20 to-black border border-amber-700/20">
                    <div className="text-3xl font-black text-amber-400 mb-1">98%</div>
                    <div className="text-xs text-amber-500/70">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Contact */}
      <section id="contact" className="py-10 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-0">
                <Phone className="w-3 h-3 mr-1" />
                Contactez-nous
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Parlons de Votre Événement
              </h2>
              <p className="text-base text-amber-200/60">
                Notre équipe est à votre écoute pour réaliser vos projets de prestige
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-700/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-900/50">
                      <Phone className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-200 mb-2 text-sm">Téléphone</h3>
                      <p className="text-amber-300/60 text-xs mb-2">
                        Disponible 7j/7
                      </p>
                      <a href="tel:+33123456789" className="text-amber-400 hover:text-amber-300 font-medium text-sm">
                        +33 1 23 45 67 89
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-700/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-900/50">
                      <Mail className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-200 mb-2 text-sm">Email</h3>
                      <p className="text-amber-300/60 text-xs mb-2">
                        Réponse sous 24h
                      </p>
                      <a href="mailto:contact@orientale-musique.fr" className="text-amber-400 hover:text-amber-300 font-medium text-sm">
                        contact@orientale-musique.fr
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold shadow-xl shadow-amber-900/50"
                onClick={() => scrollToSection('formules')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Découvrir Nos Formules
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-900/30 py-6 bg-black/80">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-900/50">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Orientale Musique
            </span>
          </div>
          <p className="text-amber-600/50 text-xs">
            © 2024 Orientale Musique - Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}

function Home(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
