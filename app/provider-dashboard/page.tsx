'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getRoleRedirectPath } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Home,
  LayoutDashboard,
  MessageCircle,
  Video,
  Calendar,
  Crown,
  TrendingUp,
  Clock,
  CheckCircle,
  Edit3,
  FileText,
  BarChart3,
  Scan
} from 'lucide-react';
import ProviderMessagingPanel from '@/components/ProviderMessagingPanel';
import QuoteEditorDialog from '@/components/QuoteEditorDialog';
import ProviderAnalyticsDashboard from '@/components/ProviderAnalyticsDashboard';
import ProviderMediaManager from '@/components/ProviderMediaManager';
import ProviderAvailabilityCalendar from '@/components/ProviderAvailabilityCalendar';
import ProviderImpactDashboard from '@/components/ProviderImpactDashboard';
import TicketScanner from '@/components/TicketScanner';
import { SubscriptionAlert } from '@/components/SubscriptionAlert';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';

interface Booking {
  id: string;
  event_date: string;
  event_time: string;
  event_type: string;
  event_location: string;
  guest_count: number;
  status: string;
  price_agreed: number;
  client: {
    full_name: string;
    email: string;
  };
}

export default function ProviderDashboardPrestige() {
  const { user } = useAuth();
  const router = useRouter();
  const { subscriptionData } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [socialVideos, setSocialVideos] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [quoteEditorOpen, setQuoteEditorOpen] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileData && profileData.role !== 'provider' && profileData.role !== 'partner') {
        const correctPath = getRoleRedirectPath(profileData.role);
        router.replace(correctPath);
        return;
      }

      const [bookingsRes, videosRes, subscriptionRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            client:profiles!bookings_client_id_fkey(full_name, email)
          `)
          .order('event_date', { ascending: true })
          .limit(10),
        supabase
          .from('provider_social_videos')
          .select('*')
          .eq('provider_id', user?.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_subscriptions')
          .select('*, plan:subscription_plans(*)')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .maybeSingle()
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data as any);
      if (videosRes.data) setSocialVideos(videosRes.data);
      if (subscriptionRes.data) setSubscription(subscriptionRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.price_agreed || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="border border-zinc-800 text-gray-400 hover:bg-zinc-900 hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour au Site
              </Button>
              <div className="h-6 w-px bg-zinc-800" />
              <div>
                <h1 className="text-lg font-light text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-600" />
                  Espace Prestige Business
                </h1>
              </div>
            </div>
            <Button
              onClick={() => setShowProfileEdit(true)}
              size="sm"
              className="bg-transparent border border-amber-600/30 text-amber-600 hover:bg-amber-600/10"
            >
              <Video className="w-4 h-4 mr-2" />
              Gérer mes Médias
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {subscriptionData && (
          <SubscriptionAlert
            status={subscriptionData.status}
            companyName={subscriptionData.companyName}
          />
        )}

        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-amber-600/30 transition-all">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Réservations</div>
                  <div className="text-xl font-bold text-white">{stats.totalBookings}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-amber-600/30 transition-all">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">En Attente</div>
                  <div className="text-xl font-bold text-amber-600">{stats.pendingBookings}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-amber-600/30 transition-all">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Confirmées</div>
                  <div className="text-xl font-bold text-green-400">{stats.confirmedBookings}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-600/20 to-transparent border-amber-600/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-amber-400 mb-1">Revenu Total</div>
                  <div className="text-xl font-bold text-white">{stats.totalRevenue}€</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 h-auto">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-gray-400"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tableau de Bord
            </TabsTrigger>
            <TabsTrigger
              value="impact"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-gray-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Mon Impact
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-gray-400"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Messagerie & Devis
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-gray-400"
            >
              <Video className="w-4 h-4 mr-2" />
              Régie Pub Sociale
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-gray-400"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agenda & Réservations
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-gray-400"
            >
              <Crown className="w-4 h-4 mr-2" />
              Mon Abonnement
            </TabsTrigger>
            <TabsTrigger
              value="scanner"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-gray-400"
            >
              <Scan className="w-4 h-4 mr-2" />
              Scanner de Billets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border-amber-600/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Bienvenue dans votre Centre de Commande Prestige
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Gérez votre activité, communiquez avec vos clients et développez votre visibilité
                      sur ALTESS avec des outils professionnels de pointe.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setQuoteEditorOpen(true)}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-black"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Créer un Devis
                      </Button>
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Compte Actif
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ProviderAnalyticsDashboard />

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <h3 className="text-base font-medium text-white mb-4">Dernières Réservations</h3>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune réservation pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-zinc-800 hover:border-amber-600/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {booking.client?.full_name || 'Client'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(booking.event_date).toLocaleDateString('fr-FR')}
                              {booking.event_location && ` • ${booking.event_location}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {booking.price_agreed && (
                            <div className="text-sm font-semibold text-amber-600">
                              {booking.price_agreed}€
                            </div>
                          )}
                          <Badge
                            variant={booking.status === 'pending' ? 'secondary' : 'default'}
                            className={
                              booking.status === 'confirmed' ? 'bg-green-500' :
                              booking.status === 'completed' ? 'bg-blue-500' : ''
                            }
                          >
                            {booking.status === 'pending' ? 'En attente' :
                             booking.status === 'confirmed' ? 'Confirmée' :
                             booking.status === 'completed' ? 'Terminée' : booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impact">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-light text-white mb-1">Mon Impact & Performance</h2>
                <p className="text-sm text-gray-400">
                  Analysez votre visibilité, optimisez votre profil et suivez vos performances commerciales
                </p>
              </div>
              {user?.id && <ProviderImpactDashboard providerId={user.id} />}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-light text-white">Messagerie & Devis</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Communiquez avec vos clients et créez des devis professionnels
                  </p>
                </div>
                <Button
                  onClick={() => setQuoteEditorOpen(true)}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nouveau Devis
                </Button>
              </div>
              <ProviderMessagingPanel />
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-light text-white mb-1">Régie Pub Sociale & Médias</h2>
                <p className="text-sm text-gray-400">
                  Gérez vos vidéos, photos et configuration WhatsApp pour votre présence sur ALTESS
                </p>
              </div>
              {user?.id && <ProviderMediaManager providerId={user.id} />}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-light text-white mb-1">Agenda & Réservations</h2>
                <p className="text-sm text-gray-400">
                  Gérez vos disponibilités et vos événements à venir
                </p>
              </div>
              {user?.id && <ProviderAvailabilityCalendar partnerId={user.id} />}
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border-amber-600/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-light text-white mb-2">
                      {subscription ? subscription.plan?.name : 'Plan Essentiel'}
                    </h3>
                    <p className="text-gray-400">
                      {subscription ? 'Votre abonnement actif' : 'Passez à un plan supérieur'}
                    </p>
                  </div>
                  <Badge className={subscription?.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
                    {subscription?.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                {subscription ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
                        <div className="text-xs text-gray-400 mb-2">Tarif</div>
                        <div className="text-2xl font-bold text-white">
                          {subscription.billing_cycle === 'monthly'
                            ? `${subscription.plan?.price_monthly}€`
                            : `${subscription.plan?.price_yearly}€`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {subscription.billing_cycle === 'monthly' ? 'par mois' : 'par an'}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
                        <div className="text-xs text-gray-400 mb-2">Prochain paiement</div>
                        <div className="text-lg font-semibold text-white">
                          {subscription.next_billing_date
                            ? new Date(subscription.next_billing_date).toLocaleDateString('fr-FR')
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
                        <div className="text-xs text-gray-400 mb-2">Renouvellement</div>
                        <div className="text-lg font-semibold text-green-400">
                          {subscription.auto_renew ? 'Automatique' : 'Désactivé'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-4 border border-zinc-800">
                      <div className="text-sm text-gray-400 mb-3">Fonctionnalités incluses:</div>
                      <div className="grid md:grid-cols-2 gap-2">
                        {subscription.plan?.features && Array.isArray(subscription.plan.features) &&
                          subscription.plan.features.map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-white">
                              <CheckCircle className="w-4 h-4 text-amber-600" />
                              <span>{feature}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Crown className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-6">
                      Aucun abonnement actif. Choisissez un plan pour accéder à toutes les fonctionnalités.
                    </p>
                    <Button className="bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600">
                      Voir les Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scanner">
            <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border-amber-600/30">
              <CardHeader>
                <CardTitle className="text-2xl font-light text-white">Scanner de Billets</CardTitle>
                <p className="text-gray-400">
                  Validez les billets de vos événements en scannant les QR codes
                </p>
              </CardHeader>
              <CardContent>
                <TicketScanner />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <QuoteEditorDialog open={quoteEditorOpen} onOpenChange={setQuoteEditorOpen} />
    </div>
  );
}
