'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Check,
  ArrowLeft,
  Share2,
  Globe,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music2,
  ExternalLink,
  Eye,
  Star,
  Award,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import PartnerContactForm from '@/components/PartnerContactForm';
import PartnerGoogleMap from '@/components/PartnerGoogleMap';
import PartnerPublicAvailability from '@/components/PartnerPublicAvailability';
import Image from 'next/image';
import ReactPlayer from 'react-player';

type Partner = {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  full_description: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  main_image: string | null;
  gallery_images: string[];
  gallery_videos: string[];
  services: string[];
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  logo_url: string | null;
  tagline: string | null;
};

const categoryLabels: Record<string, string> = {
  salle: 'Salle de réception',
  traiteur: 'Traiteur',
  photo: 'Photographe',
  decoration: 'Décorateur',
  autre: 'Autre',
};

type MediaItem = {
  type: 'image' | 'video';
  url: string;
};

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [carouselMedia, setCarouselMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    loadPartnerData();
  }, [slug]);

  useEffect(() => {
    if (partner) {
      document.title = partner.seo_title || `${partner.name} | Orientale Musique`;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', partner.seo_description || partner.short_description);
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', partner.seo_title || partner.name);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', partner.seo_description || partner.short_description);
      }

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && (partner.og_image || partner.main_image)) {
        ogImage.setAttribute('content', partner.og_image || partner.main_image || '');
      }

      incrementViews();
    }
  }, [partner]);

  async function loadPartnerData() {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.push('/partenaires');
        return;
      }

      setPartner(data);

      const { data: mediaData } = await supabase
        .from('partner_media_carousel')
        .select('*')
        .eq('partner_id', data.id)
        .eq('is_active', true)
        .order('display_order');

      if (mediaData && mediaData.length > 0) {
        const media: MediaItem[] = mediaData.map(item => ({
          type: item.media_type as 'image' | 'video',
          url: item.media_url
        }));
        setCarouselMedia(media);
      }

      const { data: stats } = await supabase
        .from('partner_stats')
        .select('views')
        .eq('partner_id', data.id)
        .maybeSingle();

      if (stats) {
        setViewCount(stats.views || 0);
      }
    } catch (error) {
      console.error('Error loading partner:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function incrementViews() {
    if (!partner) return;
    try {
      const { error } = await supabase.rpc('increment_partner_views', {
        partner_uuid: partner.id
      });
      if (error) console.error('Error incrementing views:', error);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async function trackClick(clickType: string) {
    if (!partner) return;
    try {
      const { error } = await supabase.rpc('increment_partner_clicks', {
        partner_uuid: partner.id,
        click_type: clickType
      });
      if (error) console.error('Error tracking click:', error);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: partner?.name,
          text: partner?.short_description,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  const allMedia: MediaItem[] = carouselMedia.length > 0
    ? carouselMedia
    : [
        ...(partner.main_image ? [{ type: 'image' as const, url: partner.main_image }] : []),
        ...partner.gallery_images.map(url => ({ type: 'image' as const, url })),
        ...(partner.gallery_videos || []).map(url => ({ type: 'video' as const, url }))
      ];

  const currentMedia = allMedia[currentMediaIndex];
  const isCurrentVideo = currentMedia?.type === 'video';

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
    setIsPlaying(false);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    setIsPlaying(false);
  };

  const socialLinks = [
    { icon: Facebook, url: partner.facebook_url, name: 'Facebook', color: 'hover:text-blue-500' },
    { icon: Instagram, url: partner.instagram_url, name: 'Instagram', color: 'hover:text-pink-500' },
    { icon: Twitter, url: partner.twitter_url, name: 'Twitter', color: 'hover:text-sky-500' },
    { icon: Linkedin, url: partner.linkedin_url, name: 'LinkedIn', color: 'hover:text-blue-600' },
    { icon: Youtube, url: partner.youtube_url, name: 'YouTube', color: 'hover:text-red-500' },
    { icon: Music2, url: partner.tiktok_url, name: 'TikTok', color: 'hover:text-slate-100' },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <Navigation />
      {/* <WhatsAppChat /> */}

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/partenaires')}
          className="text-white hover:text-amber-400 hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux partenaires
        </Button>
      </div>

      {allMedia.length > 0 && (
        <section className="relative w-full h-[60vh] md:h-[75vh] bg-black overflow-hidden mb-8">
          <div className="absolute inset-0">
            {isCurrentVideo ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <ReactPlayer
                  url={currentMedia.url}
                  playing={isPlaying}
                  controls
                  width="100%"
                  height="100%"
                  style={{ maxHeight: '100%' }}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            ) : (
              <>
                <Image
                  src={currentMedia.url}
                  alt={`${partner.name} - Media ${currentMediaIndex + 1}`}
                  fill
                  className="object-cover"
                  priority={currentMediaIndex === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950" />
              </>
            )}
          </div>

          {allMedia.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 backdrop-blur-md p-4 rounded-full transition-all group shadow-2xl border border-white/10"
                aria-label="Media précédent"
              >
                <ChevronLeft className="w-6 h-6 text-white group-hover:text-amber-400 transition-colors" />
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 backdrop-blur-md p-4 rounded-full transition-all group shadow-2xl border border-white/10"
                aria-label="Media suivant"
              >
                <ChevronRight className="w-6 h-6 text-white group-hover:text-amber-400 transition-colors" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/40 backdrop-blur-md px-4 py-3 rounded-full border border-white/10">
                {allMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentMediaIndex(index);
                      setIsPlaying(false);
                    }}
                    className={`relative transition-all ${
                      index === currentMediaIndex
                        ? 'w-10 h-3'
                        : 'w-3 h-3 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Aller au media ${index + 1}`}
                  >
                    <div className={`w-full h-full rounded-full ${
                      index === currentMediaIndex
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-white'
                    }`} />
                    {media.type === 'video' && (
                      <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2" />
                    )}
                  </button>
                ))}
              </div>

              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 text-xs text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <ImageIcon className="w-3 h-3 inline" />
                <span>{allMedia.filter(m => m.type === 'image').length} photos</span>
                <span className="text-white/40">|</span>
                <Play className="w-3 h-3 inline" />
                <span>{allMedia.filter(m => m.type === 'video').length} vidéos</span>
              </div>
            </>
          )}

          <div className="absolute top-6 right-6 z-20 flex gap-3">
            {partner.logo_url && (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/95 backdrop-blur-sm p-2 shadow-2xl border border-white/20 overflow-hidden">
                <img
                  src={partner.logo_url}
                  alt={`${partner.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleShare}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white hover:text-amber-400 border border-white/10 shadow-2xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>

          <div className="absolute bottom-12 left-0 right-0 z-10 px-4 md:px-8">
            <div className="container mx-auto max-w-5xl">
              <Badge className="inline-block mb-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 text-xs md:text-sm font-bold shadow-2xl">
                {categoryLabels[partner.category]}
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-3 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent drop-shadow-2xl [text-shadow:_0_4px_20px_rgb(251_191_36_/_40%)]">
                {partner.name}
              </h1>
              {partner.tagline && (
                <p className="text-xl md:text-2xl text-amber-200 italic mb-2 drop-shadow-lg font-light">
                  "{partner.tagline}"
                </p>
              )}
              <p className="text-base md:text-xl text-slate-200 drop-shadow-lg max-w-3xl leading-relaxed">
                {partner.short_description}
              </p>
            </div>
          </div>
        </section>
      )}

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
          <article className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                Présentation Détaillée
              </h2>
              <div className="prose prose-invert prose-lg max-w-none">
                <div className="text-slate-300 leading-relaxed text-base md:text-lg space-y-4 whitespace-pre-line bg-gradient-to-br from-black/40 to-gray-900/40 border border-amber-500/20 rounded-xl p-6 md:p-8">
                  <div className={showFullDescription ? '' : 'line-clamp-[8]'}>
                    {partner.full_description}
                  </div>
                  {partner.full_description.length > 500 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-amber-400 hover:text-amber-300 font-medium text-sm mt-4 flex items-center gap-2 transition-colors"
                    >
                      {showFullDescription ? 'Voir moins' : 'Lire la suite'}
                      <ChevronRight className={`w-4 h-4 transition-transform ${showFullDescription ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 md:p-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <Award className="w-8 h-8 text-amber-400" />
                Points Forts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-black/60 to-gray-900/60 border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-all group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Qualité Premium</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Des prestations de haute qualité pour vos événements d'exception
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-black/60 to-gray-900/60 border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-all group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Réactivité</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Une équipe professionnelle à votre écoute 7j/7
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-black/60 to-gray-900/60 border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-all group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Fiabilité</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Un partenaire de confiance vérifié par ALTESS
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-black/60 to-gray-900/60 border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-all group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Innovation</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Des solutions créatives et innovantes pour vos projets
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {partner.services.length > 0 && (
              <section>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Services Proposés
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partner.services.map((service, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-3 p-5 bg-gradient-to-br from-black/60 to-gray-900/60 border border-amber-500/20 rounded-xl hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-slate-300 text-sm md:text-base group-hover:text-white transition-colors">
                        {service}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {socialLinks.length > 0 && (
              <section>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Suivez-nous sur les Réseaux
                </h2>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-black/60 to-gray-900/60 border border-white/10 rounded-xl hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl ${social.color}`}
                      >
                        <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                        <span className="font-medium">{social.name}</span>
                        <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {partner.address && (
              <section className="lg:hidden">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Localisation
                </h2>
                <PartnerGoogleMap
                  address={partner.address}
                  latitude={partner.latitude}
                  longitude={partner.longitude}
                />
              </section>
            )}

            <section className="lg:hidden space-y-6">
              <PartnerContactForm
                partnerName={partner.name}
                partnerEmail={partner.email || undefined}
                partnerId={partner.id}
              />
              <PartnerPublicAvailability partnerId={partner.id} />
            </section>
          </article>

          <aside className="space-y-8">
            {viewCount > 0 && (
              <Card className="bg-gradient-to-br from-amber-500/10 via-black/60 to-orange-500/10 border border-amber-500/30 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-3 text-amber-400">
                    <Eye className="w-5 h-5" />
                    <div className="text-center">
                      <p className="text-2xl font-bold">{viewCount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Vues sur ce profil</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20 hover:border-amber-500/50 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                  <Phone className="w-6 h-6 text-amber-400" />
                  Contact Rapide
                </h3>

                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40 rounded-xl p-5 mb-4">
                  <p className="text-center text-white font-bold text-lg mb-2">
                    Demandez un devis gratuit
                  </p>
                  <p className="text-center text-slate-400 text-sm">
                    Réponse sous 24h
                  </p>
                </div>

                {partner.phone && (
                  <a
                    href={`tel:${partner.phone}`}
                    onClick={() => trackClick('phone')}
                    className="flex items-center justify-center gap-3 p-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-2 border-green-400/30 rounded-xl text-white hover:text-white font-bold transition-all duration-300 group shadow-lg hover:shadow-2xl hover:shadow-green-500/30 hover:scale-105"
                  >
                    <Phone className="w-6 h-6 flex-shrink-0 group-hover:rotate-12 transition-transform" />
                    <div className="text-left flex-1">
                      <div className="text-xs text-green-200 mb-0.5">Appeler maintenant</div>
                      <div className="text-base">{partner.phone}</div>
                    </div>
                  </a>
                )}

                {partner.email && (
                  <a
                    href={`mailto:${partner.email}`}
                    onClick={() => trackClick('email')}
                    className="flex items-center justify-center gap-3 p-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-2 border-blue-400/30 rounded-xl text-white hover:text-white font-bold transition-all duration-300 group shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-105"
                  >
                    <Mail className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="text-left flex-1">
                      <div className="text-xs text-blue-200 mb-0.5">Envoyer un email</div>
                      <div className="text-sm break-all">{partner.email}</div>
                    </div>
                  </a>
                )}

                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('website')}
                    className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 border-2 border-amber-400/30 rounded-xl text-white hover:text-white font-semibold transition-all duration-300 group shadow-lg hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
                  >
                    <Globe className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm flex-1 text-center">Visiter le site web</span>
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {partner.address && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-black/40 to-gray-900/40 border border-amber-500/30 rounded-lg text-slate-300">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                    <span className="text-sm font-medium">{partner.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="hidden lg:block">
              <PartnerContactForm
                partnerName={partner.name}
                partnerEmail={partner.email || undefined}
                partnerId={partner.id}
              />
            </div>

            <div className="hidden lg:block">
              <PartnerPublicAvailability partnerId={partner.id} />
            </div>

            {partner.address && (
              <div className="hidden lg:block">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Localisation
                </h3>
                <PartnerGoogleMap
                  address={partner.address}
                  latitude={partner.latitude}
                  longitude={partner.longitude}
                />
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
