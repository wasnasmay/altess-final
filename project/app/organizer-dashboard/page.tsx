'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getRoleRedirectPath } from '@/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, Calendar, Users, DollarSign, Ticket, Crown, Copy, ExternalLink,
  Instagram, Facebook, Globe, Sparkles, BarChart, Tag, Settings, Download,
  Share2, Code, Eye, Plus, Edit, Trash, CheckCircle, Store, Image, FileText, Phone, Mail
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
  facebook_pixel_id: string | null;
  google_analytics_id: string | null;
  total_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  verified: boolean;
  premium_tier: string;
  banner_image: string | null;
  about_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface SalesStats {
  today: { tickets: number; revenue: number };
  week: { tickets: number; revenue: number };
  month: { tickets: number; revenue: number };
}

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  valid_until: string;
}

interface Ticket {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string | null;
  ticket_number: string;
  ticket_type: string;
  quantity: number;
  final_amount: number;
  payment_status: string;
  ticket_status: string;
  created_at: string;
  event_title?: string;
}

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    today: { tickets: 0, revenue: 0 },
    week: { tickets: 0, revenue: 0 },
    month: { tickets: 0, revenue: 0 }
  });
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Formulaire nouveau code promo
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('20');
  const [newPromoType, setNewPromoType] = useState('percentage');

  // Pixels tracking
  const [fbPixel, setFbPixel] = useState('');
  const [gaId, setGaId] = useState('');

  useEffect(() => {
    loadOrganizerData();
  }, []);

  async function loadOrganizerData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, email, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileData || profileData.role !== 'organizer') {
        if (profileData) {
          const correctPath = getRoleRedirectPath(profileData.role);
          router.replace(correctPath);
        } else {
          router.push('/login');
        }
        return;
      }

      let organizerData = null;
      const { data: existingOrganizer, error: organizerError } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (organizerError || !existingOrganizer) {
        const companyName = profileData.full_name || 'Mon Organisation';
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substr(2, 6);

        const { data: newOrganizer, error: createError } = await supabase
          .from('event_organizers')
          .insert({
            user_id: user.id,
            company_name: companyName,
            slug: slug,
            email: profileData.email,
            brand_color: '#f59e0b',
            verified: false,
            premium_tier: 'free'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating organizer:', createError);
          toast.error('Erreur lors de la création du profil organisateur');
          return;
        }

        organizerData = newOrganizer;
        toast.success('Profil organisateur créé avec succès !');
      } else {
        organizerData = existingOrganizer;
      }

      if (!organizerData.onboarding_completed) {
        toast.info('Finalisez votre inscription', {
          description: 'Quelques informations supplémentaires sont nécessaires'
        });
        router.push('/organizer-onboarding');
        return;
      }

      setOrganizer(organizerData);
      setFbPixel(organizerData.facebook_pixel_id || '');
      setGaId(organizerData.google_analytics_id || '');

      // Charger les événements
      const { data: eventsData } = await supabase
        .from('public_events')
        .select('*')
        .eq('organizer_id', organizerData.id)
        .order('event_date', { ascending: false });

      setEvents(eventsData || []);

      // Charger les stats de ventes
      await loadSalesStats(organizerData.id);

      // Charger les codes promo
      await loadPromoCodes(organizerData.id);

      // Charger les billets
      await loadTickets(organizerData.id);

    } catch (err) {
      console.error('Error loading organizer:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSalesStats(organizerId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Stats du jour
      const { data: todayData } = await supabase
        .from('organizer_sales_stats')
        .select('tickets_sold, revenue')
        .eq('organizer_id', organizerId)
        .eq('stat_date', today)
        .single();

      // Stats de la semaine
      const { data: weekData } = await supabase
        .from('organizer_sales_stats')
        .select('tickets_sold, revenue')
        .eq('organizer_id', organizerId)
        .gte('stat_date', weekAgo);

      // Stats du mois
      const { data: monthData } = await supabase
        .from('organizer_sales_stats')
        .select('tickets_sold, revenue')
        .eq('organizer_id', organizerId)
        .gte('stat_date', monthAgo);

      setSalesStats({
        today: {
          tickets: todayData?.tickets_sold || 0,
          revenue: todayData?.revenue || 0
        },
        week: {
          tickets: weekData?.reduce((sum, s) => sum + (s.tickets_sold || 0), 0) || 0,
          revenue: weekData?.reduce((sum, s) => sum + (s.revenue || 0), 0) || 0
        },
        month: {
          tickets: monthData?.reduce((sum, s) => sum + (s.tickets_sold || 0), 0) || 0,
          revenue: monthData?.reduce((sum, s) => sum + (s.revenue || 0), 0) || 0
        }
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function loadPromoCodes(organizerId: string) {
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    setPromoCodes(data || []);
  }

  async function loadTickets(organizerId: string) {
    const { data } = await supabase
      .from('ticket_purchases')
      .select('*, public_events(title)')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    const ticketsWithEventTitle = (data || []).map((t: any) => ({
      ...t,
      event_title: t.public_events?.title
    }));

    setTickets(ticketsWithEventTitle);
  }

  async function createPromoCode() {
    if (!organizer || !newPromoCode.trim()) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          organizer_id: organizer.id,
          code: newPromoCode.toUpperCase(),
          description: `Réduction ${newPromoType === 'percentage' ? newPromoDiscount + '%' : newPromoDiscount + '€'}`,
          discount_type: newPromoType,
          discount_value: parseFloat(newPromoDiscount),
          max_uses: 100,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      alert('Code promo créé avec succès !');
      setNewPromoCode('');
      loadPromoCodes(organizer.id);
    } catch (err) {
      console.error('Error creating promo:', err);
      alert('Erreur lors de la création du code promo');
    }
  }

  async function updatePixelTracking() {
    if (!organizer) return;

    try {
      const { error } = await supabase
        .from('event_organizers')
        .update({
          facebook_pixel_id: fbPixel || null,
          google_analytics_id: gaId || null
        })
        .eq('id', organizer.id);

      if (error) throw error;

      alert('Pixels de tracking mis à jour !');
    } catch (err) {
      console.error('Error updating pixels:', err);
      alert('Erreur lors de la mise à jour');
    }
  }

  function copyStoreLink() {
    if (!organizer) return;
    const link = `${process.env.NEXT_PUBLIC_APP_URL || ''}/boutique/${organizer.slug}`;
    navigator.clipboard.writeText(link);
    alert('Lien copié dans le presse-papier !');
  }

  function exportParticipants() {
    // Générer un CSV des participants
    const csv = [
      ['Date', 'Nom', 'Prénom', 'Email', 'Téléphone', 'N° Billet', 'Type', 'Quantité', 'Montant', 'Statut'].join(','),
      ...tickets.map(t => [
        new Date(t.created_at).toLocaleDateString('fr-FR'),
        t.customer_last_name,
        t.customer_first_name,
        t.customer_email,
        t.customer_phone || '',
        t.ticket_number,
        t.ticket_type,
        t.quantity,
        t.final_amount.toFixed(2),
        t.payment_status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-${organizer?.slug}-${Date.now()}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Accès non autorisé</h1>
          <Button onClick={() => router.push('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const brandColor = organizer.brand_color || '#F59E0B';

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {organizer.logo_url && (
              <img
                src={organizer.logo_url}
                alt={organizer.company_name}
                className="w-16 h-16 rounded-lg object-contain bg-white p-2"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{organizer.company_name}</h1>
              <p className="text-slate-400">Dashboard Organisateur</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={copyStoreLink}
              variant="outline"
              className="border-amber-500/50 hover:bg-amber-500/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copier le lien
            </Button>
            <Link href={`/boutique/${organizer.slug}`} target="_blank">
              <Button style={{ backgroundColor: brandColor }} className="text-black">
                <Eye className="w-4 h-4 mr-2" />
                Voir ma boutique
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-900/30 to-green-950/30 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Aujourd'hui</span>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">
                {salesStats.today.tickets}
              </div>
              <p className="text-xs text-slate-500">Billets vendus</p>
              <p className="text-lg font-semibold text-green-300 mt-2">
                {salesStats.today.revenue.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">7 derniers jours</span>
                <BarChart className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {salesStats.week.tickets}
              </div>
              <p className="text-xs text-slate-500">Billets vendus</p>
              <p className="text-lg font-semibold text-blue-300 mt-2">
                {salesStats.week.revenue.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">30 derniers jours</span>
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {salesStats.month.tickets}
              </div>
              <p className="text-xs text-slate-500">Billets vendus</p>
              <p className="text-lg font-semibold text-purple-300 mt-2">
                {salesStats.month.revenue.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Total</span>
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {organizer.total_tickets_sold}
              </div>
              <p className="text-xs text-slate-500">Billets vendus</p>
              <p className="text-lg font-semibold text-amber-300 mt-2">
                {organizer.total_revenue.toFixed(2)}€
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="boutique" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="boutique"><Store className="w-4 h-4 mr-2" />Boutique</TabsTrigger>
            <TabsTrigger value="participants"><Users className="w-4 h-4 mr-2" />Participants</TabsTrigger>
            <TabsTrigger value="promos"><Tag className="w-4 h-4 mr-2" />Codes Promo</TabsTrigger>
            <TabsTrigger value="tracking"><Code className="w-4 h-4 mr-2" />Pixel Tracking</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-2" />Événements</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Paramètres</TabsTrigger>
          </TabsList>

          {/* Boutique - Personnalisation */}
          <TabsContent value="boutique">
            <div className="grid gap-6">
              {/* Aperçu */}
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-400" />
                    Aperçu de votre boutique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 mb-2">
                        Votre boutique est accessible à cette adresse :
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-2 bg-black rounded-lg text-amber-400 font-mono text-sm">
                          /boutique/{organizer.slug}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || ''}/boutique/${organizer.slug}`);
                            toast.success('Lien copié !');
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open(`/boutique/${organizer.slug}`, '_blank')}
                      style={{ background: `linear-gradient(135deg, ${organizer.brand_color} 0%, ${organizer.brand_color}dd 100%)` }}
                      className="text-black font-semibold"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir ma boutique
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bannière */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Bannière de fond
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="banner_image">URL de l'image de bannière</Label>
                    <Input
                      id="banner_image"
                      value={organizer.banner_image || ''}
                      onChange={(e) => setOrganizer({ ...organizer, banner_image: e.target.value })}
                      placeholder="https://votre-image.jpg"
                      className="bg-black border-gray-700"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Recommandé : 1920x400px - Formats : JPG, PNG, WebP
                    </p>
                  </div>

                  {organizer.banner_image && (
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={organizer.banner_image}
                        alt="Aperçu bannière"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 flex items-center justify-center">
                        <p className="text-white font-semibold">Aperçu de votre bannière</p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('event_organizers')
                        .update({ banner_image: organizer.banner_image })
                        .eq('id', organizer.id);

                      if (error) {
                        toast.error('Erreur lors de la mise à jour');
                      } else {
                        toast.success('Bannière mise à jour !');
                      }
                    }}
                    style={{ background: `linear-gradient(135deg, ${organizer.brand_color} 0%, ${organizer.brand_color}dd 100%)` }}
                    className="text-black font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enregistrer la bannière
                  </Button>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    À propos de votre organisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="about_text">Description</Label>
                    <textarea
                      id="about_text"
                      value={organizer.about_text || ''}
                      onChange={(e) => setOrganizer({ ...organizer, about_text: e.target.value })}
                      placeholder="Décrivez votre organisation en quelques phrases..."
                      className="w-full min-h-[120px] px-3 py-2 bg-black border border-gray-700 rounded-lg text-white resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Ce texte apparaît dans la popup "À propos"
                    </p>
                  </div>

                  <Button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('event_organizers')
                        .update({ about_text: organizer.about_text })
                        .eq('id', organizer.id);

                      if (error) {
                        toast.error('Erreur lors de la mise à jour');
                      } else {
                        toast.success('Description mise à jour !');
                      }
                    }}
                    style={{ background: `linear-gradient(135deg, ${organizer.brand_color} 0%, ${organizer.brand_color}dd 100%)` }}
                    className="text-black font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enregistrer la description
                  </Button>
                </CardContent>
              </Card>

              {/* Coordonnées publiques */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Coordonnées publiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_email">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email de contact
                      </Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={organizer.contact_email || ''}
                        onChange={(e) => setOrganizer({ ...organizer, contact_email: e.target.value })}
                        placeholder="contact@exemple.fr"
                        className="bg-black border-gray-700"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_phone">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Téléphone de contact
                      </Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={organizer.contact_phone || ''}
                        onChange={(e) => setOrganizer({ ...organizer, contact_phone: e.target.value })}
                        placeholder="+33 6 12 34 56 78"
                        className="bg-black border-gray-700"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Ces coordonnées apparaissent dans la popup "À propos" de votre boutique
                  </p>

                  <Button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('event_organizers')
                        .update({
                          contact_email: organizer.contact_email,
                          contact_phone: organizer.contact_phone
                        })
                        .eq('id', organizer.id);

                      if (error) {
                        toast.error('Erreur lors de la mise à jour');
                      } else {
                        toast.success('Coordonnées mises à jour !');
                      }
                    }}
                    style={{ background: `linear-gradient(135deg, ${organizer.brand_color} 0%, ${organizer.brand_color}dd 100%)` }}
                    className="text-black font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enregistrer les coordonnées
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Participants */}
          <TabsContent value="participants">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Liste des participants</CardTitle>
                <Button onClick={exportParticipants} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800 text-left text-xs text-slate-400">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Nom</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Téléphone</th>
                        <th className="pb-3">N° Billet</th>
                        <th className="pb-3">Qté</th>
                        <th className="pb-3">Montant</th>
                        <th className="pb-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 text-slate-400">
                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3">
                            {ticket.customer_first_name} {ticket.customer_last_name}
                          </td>
                          <td className="py-3 text-slate-400">{ticket.customer_email}</td>
                          <td className="py-3 text-slate-400">{ticket.customer_phone || '-'}</td>
                          <td className="py-3 font-mono text-xs">{ticket.ticket_number}</td>
                          <td className="py-3">{ticket.quantity}</td>
                          <td className="py-3 font-semibold" style={{ color: brandColor }}>
                            {ticket.final_amount.toFixed(2)}€
                          </td>
                          <td className="py-3">
                            <Badge
                              className={
                                ticket.payment_status === 'paid'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }
                            >
                              {ticket.payment_status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Codes Promo */}
          <TabsContent value="promos">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Gérer les codes promo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Créer nouveau code */}
                <div className="p-4 rounded-lg bg-black/50 border border-gray-800">
                  <h3 className="font-semibold mb-4">Créer un nouveau code</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      placeholder="CODE_PROMO"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                      className="bg-black border-gray-700"
                    />
                    <Input
                      type="number"
                      placeholder="Valeur"
                      value={newPromoDiscount}
                      onChange={(e) => setNewPromoDiscount(e.target.value)}
                      className="bg-black border-gray-700"
                    />
                    <select
                      value={newPromoType}
                      onChange={(e) => setNewPromoType(e.target.value)}
                      className="h-10 rounded-md bg-black border border-gray-700 text-white px-3"
                    >
                      <option value="percentage">Pourcentage</option>
                      <option value="fixed_amount">Montant fixe</option>
                    </select>
                    <Button onClick={createPromoCode} style={{ backgroundColor: brandColor }} className="text-black">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer
                    </Button>
                  </div>
                </div>

                {/* Liste des codes */}
                <div className="space-y-3">
                  {promoCodes.map((promo) => (
                    <div key={promo.id} className="p-4 rounded-lg border border-gray-800 bg-black/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-lg px-3 py-1">
                            {promo.code}
                          </Badge>
                          <div>
                            <p className="text-sm text-slate-300">{promo.description}</p>
                            <p className="text-xs text-slate-500">
                              Utilisé {promo.current_uses}/{promo.max_uses} fois
                              {promo.valid_until && ` • Valide jusqu'au ${new Date(promo.valid_until).toLocaleDateString('fr-FR')}`}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={promo.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                        >
                          {promo.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pixel Tracking */}
          <TabsContent value="tracking">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Configuration du tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Facebook Pixel ID</Label>
                  <Input
                    placeholder="123456789012345"
                    value={fbPixel}
                    onChange={(e) => setFbPixel(e.target.value)}
                    className="bg-black border-gray-700 mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Trouvez votre Pixel ID dans Facebook Business Manager
                  </p>
                </div>

                <div>
                  <Label>Google Analytics ID</Label>
                  <Input
                    placeholder="G-XXXXXXXXXX"
                    value={gaId}
                    onChange={(e) => setGaId(e.target.value)}
                    className="bg-black border-gray-700 mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Format: G-XXXXXXXXXX ou UA-XXXXXXXXX-X
                  </p>
                </div>

                <Button onClick={updatePixelTracking} style={{ backgroundColor: brandColor }} className="text-black">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Événements */}
          <TabsContent value="events">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mes événements</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel événement
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 rounded-lg border border-gray-800 bg-black/30 hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-slate-400">
                            {new Date(event.event_date).toLocaleDateString('fr-FR')} • {event.location}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Paramètres de la boutique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Lien de votre boutique</h3>
                  <div className="flex gap-2">
                    <Input
                      value={`${process.env.NEXT_PUBLIC_APP_URL || ''}/boutique/${organizer.slug}`}
                      readOnly
                      className="bg-black border-gray-700"
                    />
                    <Button onClick={copyStoreLink} variant="outline">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Réseaux sociaux</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Instagram</Label>
                      <Input
                        placeholder="https://instagram.com/..."
                        value={organizer.instagram_url || ''}
                        readOnly
                        className="bg-black border-gray-700 mt-2"
                      />
                    </div>
                    <div>
                      <Label>Facebook</Label>
                      <Input
                        placeholder="https://facebook.com/..."
                        value={organizer.facebook_url || ''}
                        readOnly
                        className="bg-black border-gray-700 mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-800">
                  <Button
                    variant="outline"
                    className="border-amber-500/50 hover:bg-amber-500/10"
                    onClick={() => window.open('/admin/advertising-ticker', '_blank')}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Promouvoir sur la Web TV ALTESS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
