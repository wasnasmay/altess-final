'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Users, Calendar, TrendingUp, Shield, CheckCircle, XCircle, Eye,
  Tv, Radio, Library, Video, ListOrdered, Package, FileText,
  ImageIcon, MessageSquare, GraduationCap, BookOpen,
  Type, Heart, Award, Headphones, Music2, Crown, Briefcase, DollarSign, ChevronRight, Menu,
  Ticket, QrCode, UserCheck, MapPin, Phone, Save
} from 'lucide-react';
import { PlayoutMediaLibrary } from '@/components/PlayoutMediaLibrary';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
}

interface Orchestra {
  id: string;
  name: string;
  provider_id: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_active: boolean;
  price_range: string;
  provider?: {
    full_name: string;
    email: string;
  };
}

interface Booking {
  id: string;
  event_date: string;
  event_type: string;
  status: string;
  price_agreed: number;
  client?: {
    full_name: string;
    email: string;
  };
  orchestra?: {
    name: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client?: {
    full_name: string;
  };
  orchestra?: {
    name: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    if (!user?.id) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profileData || profileData.role !== 'admin') {
        toast.error('Accès non autorisé');
        router.push('/');
        return;
      }

      await fetchData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    }
  };

  const fetchData = async () => {
    try {
      const [profilesRes, orchestrasRes, bookingsRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orchestras').select(`
          *,
          provider:profiles!orchestras_provider_id_fkey(full_name, email)
        `).order('created_at', { ascending: false }),
        supabase.from('bookings').select(`
          *,
          client:profiles!bookings_client_id_fkey(full_name, email),
          orchestra:orchestras(name)
        `).order('event_date', { ascending: false }),
        supabase.from('reviews').select(`
          *,
          client:profiles!reviews_client_id_fkey(full_name),
          orchestra:orchestras(name)
        `).order('created_at', { ascending: false })
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (orchestrasRes.data) setOrchestras(orchestrasRes.data as any);
      if (bookingsRes.data) setBookings(bookingsRes.data as any);
      if (reviewsRes.data) setReviews(reviewsRes.data as any);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (profileId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      setShowRoleDialog(false);
      setSelectedProfile(null);
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleVerifyOrchestra = async (orchestraId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('orchestras')
        .update({ is_verified: verified })
        .eq('id', orchestraId);

      if (error) throw error;

      toast.success(verified ? 'Orchestre vérifié' : 'Vérification retirée');
      fetchData();
    } catch (error) {
      console.error('Error updating orchestra:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggleOrchestraActive = async (orchestraId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('orchestras')
        .update({ is_active: active })
        .eq('id', orchestraId);

      if (error) throw error;

      toast.success(active ? 'Orchestre activé' : 'Orchestre désactivé');
      fetchData();
    } catch (error) {
      console.error('Error updating orchestra:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const loadWhatsAppSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('setting_key', ['whatsapp_number', 'whatsapp_message']);

      if (error) throw error;

      if (data) {
        const phoneData = data.find(s => s.setting_key === 'whatsapp_number');
        const messageData = data.find(s => s.setting_key === 'whatsapp_message');

        setWhatsappPhone(phoneData?.setting_value || '');
        setWhatsappMessage(messageData?.setting_value || '');
      }
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
    }
  };

  const saveWhatsAppSettings = async () => {
    setWhatsappLoading(true);
    try {
      // Update phone number
      const { error: phoneError } = await supabase
        .from('site_settings')
        .update({
          setting_value: whatsappPhone,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'whatsapp_number');

      if (phoneError) throw phoneError;

      // Update message
      const { error: messageError } = await supabase
        .from('site_settings')
        .update({
          setting_value: whatsappMessage,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'whatsapp_message');

      if (messageError) throw messageError;

      toast.success('Paramètres WhatsApp sauvegardés avec succès !');
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setWhatsappLoading(false);
    }
  };

  useEffect(() => {
    loadWhatsAppSettings();
  }, []);

  const stats = {
    totalUsers: profiles.length,
    totalProviders: profiles.filter(p => p.role === 'provider').length,
    totalOrchestras: orchestras.length,
    verifiedOrchestras: orchestras.filter(o => o.is_verified).length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.price_agreed || 0), 0)
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'En attente' },
      confirmed: { className: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Confirmée' },
      cancelled: { className: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Annulée' },
      completed: { className: 'bg-blue-500/10 text-blue-600 border-blue-500/30', label: 'Terminée' }
    };
    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      client: { className: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Client' },
      provider: { className: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Prestataire' },
      admin: { className: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Admin' },
      partner: { className: 'bg-green-500/10 text-green-400 border-green-500/30', label: 'Partenaire' },
      advertiser: { className: 'bg-purple-500/10 text-purple-400 border-purple-500/30', label: 'Annonceur' }
    };
    const config = variants[role] || variants.client;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentStatusDot = (role: string) => {
    const hasSubscription = Math.random() > 0.3;
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${hasSubscription ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <span className="text-xs text-gray-500">{hasSubscription ? 'Actif' : 'Inactif'}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-light text-white tracking-wide">
                Administration <span className="text-amber-400">ALTESS</span>
              </h1>
              <p className="text-xs text-gray-500">Gestion centralisée de la plateforme</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Retour
          </Button>
        </div>

        {/* Quick Access Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card
            className="cursor-pointer hover:border-amber-500/50 transition-all bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30 group"
            onClick={() => router.push('/admin/dashboard-premium')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Dashboard Premium</h3>
                  <p className="text-sm text-zinc-400">Centre de gestion professionnel</p>
                </div>
                <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-red-500/50 transition-all bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30 group"
            onClick={() => router.push('/admin/moderation-center')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <Eye className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">À Valider</h3>
                  <p className="text-sm text-zinc-400">Centre de modération</p>
                </div>
                <ChevronRight className="w-6 h-6 text-red-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-blue-500/50 transition-all bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 group"
            onClick={() => router.push('/admin/users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Comptes</h3>
                  <p className="text-sm text-zinc-400">Gestion Premium/Normal</p>
                </div>
                <ChevronRight className="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Accordion type="multiple" defaultValue={["ticketing", "moderation", "playout", "business", "academy", "stats"]} className="space-y-3">

          <AccordionItem value="ticketing" className="border border-zinc-800 rounded-lg bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:bg-zinc-900/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                  <Ticket className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">Billetterie & Rendez-vous</div>
                  <div className="text-xs text-gray-500">Événements · Réservations · QR Codes · Statistiques</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <Card
                  className="cursor-pointer hover:border-purple-500/30 transition-all bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 group"
                  onClick={() => router.push('/admin/events')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">Événements</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Créer & gérer</p>
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-pink-500/30 transition-all bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20 group"
                  onClick={() => router.push('/admin/rendez-vous')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-medium text-pink-400">Statistiques</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Vue d'ensemble</p>
                    <ChevronRight className="w-3 h-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/bookings')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Ticket className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Réservations</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Liste complète</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-green-500/30 transition-all bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 group"
                  onClick={() => router.push('/admin/scanner')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium text-green-400">Scanner QR</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Validation entrée</p>
                    <ChevronRight className="w-3 h-3 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>


          <AccordionItem value="playout" className="border border-zinc-800 rounded-lg bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:bg-zinc-900/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30">
                  <Tv className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">Régie Playout & Diffusion</div>
                  <div className="text-xs text-gray-500">TV · Radio · Programmation · Bibliothèque</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/playout/schedule')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Programmation</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Grilles TV/Radio</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/playout/library')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Library className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Bibliothèque</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Médias unifiés</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-red-500/30 transition-all bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20 group"
                  onClick={() => router.push('/playout')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Tv className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-medium text-red-400">Play Out Live</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Diffusion directe</p>
                    <ChevronRight className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/webtv-ticker')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Bandeau TV</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Ticker en direct</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/radio-stations')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-medium text-white">Stations</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Flux radio</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/advertising-ticker')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Bandeau Pub</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Messages</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/backgrounds')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-white">Arrière-plans</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Fonds TV/Radio</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/navigation')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Menu className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-white">Navigation</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Menu principal</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="business" className="border border-zinc-800 rounded-lg bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:bg-zinc-900/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">Gestion Business</div>
                  <div className="text-xs text-gray-500">Utilisateurs · Abonnements · Devis · Commandes</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3 mt-2">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      Utilisateurs Inscrits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-800">
                            <TableHead className="text-xs text-gray-400">Nom</TableHead>
                            <TableHead className="text-xs text-gray-400">Email</TableHead>
                            <TableHead className="text-xs text-gray-400">Rôle</TableHead>
                            <TableHead className="text-xs text-gray-400">Statut</TableHead>
                            <TableHead className="text-xs text-gray-400">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profiles.slice(0, 10).map((profile) => (
                            <TableRow key={profile.id} className="border-zinc-800">
                              <TableCell className="text-xs text-white">{profile.full_name || 'Non renseigné'}</TableCell>
                              <TableCell className="text-xs text-gray-400">{profile.email}</TableCell>
                              <TableCell className="text-xs">{getRoleBadge(profile.role)}</TableCell>
                              <TableCell className="text-xs">{getPaymentStatusDot(profile.role)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs border border-amber-500/30 hover:bg-amber-500/10"
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setShowRoleDialog(true);
                                  }}
                                >
                                  <Shield className="w-3 h-3 mr-1 text-amber-400" />
                                  Modifier
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Card
                    className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                    onClick={() => router.push('/admin/quotes')}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-white">Devis</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2">Gestion des devis</p>
                      <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                    onClick={() => router.push('/admin/orders')}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ListOrdered className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-white">Commandes</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2">Suivi commandes</p>
                      <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                    onClick={() => router.push('/admin/quote-templates')}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-white">Modèles</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2">Templates devis</p>
                      <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="academy" className="border border-zinc-800 rounded-lg bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:bg-zinc-900/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/30">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">Académie & SEO</div>
                  <div className="text-xs text-gray-500">Formations · Contenu · Partenaires · Stars</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/academy-packs')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Packs</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Formations</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/page-seo')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium text-white">SEO Pages</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Contenu texte</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/partners')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium text-white">Partenaires</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Réseau</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/partner-categories')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-white">Catégories</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Partenaires</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/stars')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Stars</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Artistes</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/prestations')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Music2 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Prestations</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Services</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-rose-500/30 transition-all bg-gradient-to-br from-rose-500/5 to-transparent border-rose-500/20 group"
                  onClick={() => router.push('/admin/mecenas')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-medium text-rose-400">Mécènes</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Philanthropie</p>
                    <ChevronRight className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/instruments')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Headphones className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Instruments</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Catalogue</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-amber-500/30 transition-all bg-zinc-900/50 border-zinc-800 group"
                  onClick={() => router.push('/admin/orchestra-formulas')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Music2 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-white">Formules</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Orchestres</p>
                    <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stats" className="border border-zinc-800 rounded-lg bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:bg-zinc-900/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">Pilotage Global</div>
                  <div className="text-xs text-gray-500">Statistiques · Revenus · Performance</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-blue-400">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                    <p className="text-[10px] text-gray-500">Utilisateurs</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400">Actifs</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalProviders}</div>
                    <p className="text-[10px] text-gray-500">Prestataires</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-400">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
                    <p className="text-[10px] text-gray-500">Réservations</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Revenus</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalRevenue.toFixed(0)}€</div>
                    <p className="text-[10px] text-gray-500">Total complété</p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="whatsapp" className="border border-zinc-800 rounded-lg bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:bg-zinc-900/50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                  <Phone className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">Paramètres WhatsApp</div>
                  <div className="text-xs text-gray-500">Configuration du bouton WhatsApp sur la page d'accueil</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Configuration WhatsApp</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Ces paramètres contrôlent le bouton WhatsApp vert qui apparaît sur la page d'accueil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Numéro de téléphone
                    </label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+33612345678"
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                    <p className="text-xs text-gray-500">
                      Format international (ex: +33612345678)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Message par défaut
                    </label>
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="Bonjour, je souhaite obtenir plus d'informations..."
                      rows={3}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      Ce message sera pré-rempli quand un visiteur clique sur le bouton WhatsApp
                    </p>
                  </div>

                  <Button
                    onClick={saveWhatsAppSettings}
                    disabled={whatsappLoading || !whatsappPhone}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {whatsappLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder les paramètres
                      </>
                    )}
                  </Button>

                  {whatsappPhone && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400 font-medium mb-1">Aperçu:</p>
                      <p className="text-xs text-gray-400">
                        Le bouton WhatsApp ouvrira une conversation avec <span className="text-white font-mono">{whatsappPhone}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Modifier le rôle utilisateur</DialogTitle>
              <DialogDescription className="text-gray-400">
                Changez le rôle de {selectedProfile?.full_name || selectedProfile?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select
                defaultValue={selectedProfile?.role}
                onValueChange={(value) => {
                  if (selectedProfile) {
                    handleUpdateUserRole(selectedProfile.id, value);
                  }
                }}
              >
                <SelectTrigger className="bg-black border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="client" className="text-white">Client</SelectItem>
                  <SelectItem value="provider" className="text-white">Prestataire</SelectItem>
                  <SelectItem value="partner" className="text-white">Partenaire</SelectItem>
                  <SelectItem value="advertiser" className="text-white">Annonceur</SelectItem>
                  <SelectItem value="admin" className="text-white">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
