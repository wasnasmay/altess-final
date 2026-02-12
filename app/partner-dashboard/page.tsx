'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getRoleRedirectPath } from '@/lib/auth-utils';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  TrendingUp,
  Star,
  Image as ImageIcon,
  FileText,
  BarChart3,
  Ticket,
  QrCode,
  Users,
  Eye,
  MessageSquare,
  Settings
} from 'lucide-react';
import ProviderMediaCarousel from '@/components/ProviderMediaCarousel';
import ProviderAvailabilityCalendar from '@/components/ProviderAvailabilityCalendar';
import ProviderQuoteRequests from '@/components/ProviderQuoteRequests';
import Footer from '@/components/Footer';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  can_create_events: boolean;
  can_create_places: boolean;
};

type EventStats = {
  total_events: number;
  active_events: number;
  pending_events: number;
  total_tickets_sold: number;
};

type PlaceStats = {
  total_places: number;
  approved_places: number;
  pending_places: number;
  total_views: number;
};

export default function PartnerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [placeStats, setPlaceStats] = useState<PlaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    if (!user?.id) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData || profileData.role !== 'partner') {
        if (profileData) {
          const correctPath = getRoleRedirectPath(profileData.role);
          router.replace(correctPath);
        } else {
          router.push('/login');
        }
        return;
      }

      setProfile(profileData);

      if (profileData.can_create_events) {
        await loadEventStats();
      }

      if (profileData.can_create_places) {
        await loadPlaceStats();
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function loadEventStats() {
    if (!user?.id) return;

    try {
      const { data: events, error } = await supabase
        .from('public_events')
        .select('*')
        .eq('organizer_id', user.id);

      if (error) throw error;

      const stats: EventStats = {
        total_events: events?.length || 0,
        active_events: events?.filter(e => e.is_active && e.approval_status === 'approved').length || 0,
        pending_events: events?.filter(e => e.approval_status === 'pending').length || 0,
        total_tickets_sold: events?.reduce((sum, e) => sum + (e.tickets_sold || 0), 0) || 0
      };

      setEventStats(stats);
    } catch (error) {
      console.error('Error loading event stats:', error);
    }
  }

  async function loadPlaceStats() {
    if (!user?.id) return;

    try {
      const { data: places, error } = await supabase
        .from('good_addresses')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;

      const stats: PlaceStats = {
        total_places: places?.length || 0,
        approved_places: places?.filter(p => p.approval_status === 'approved').length || 0,
        pending_places: places?.filter(p => p.approval_status === 'pending').length || 0,
        total_views: places?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0
      };

      setPlaceStats(stats);
    } catch (error) {
      console.error('Error loading place stats:', error);
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasEventAccess = profile.can_create_events;
  const hasPlaceAccess = profile.can_create_places;

  if (!hasEventAccess && !hasPlaceAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Configuration nécessaire</h2>
            <p className="text-muted-foreground mb-6">
              Votre compte professionnel n'a pas encore été configuré.
              <br />
              Contactez l'administration pour activer vos permissions.
            </p>
            <Button onClick={() => router.push('/')}>
              Retour à l'accueil
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const defaultTab = hasEventAccess ? 'events' : 'places';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Espace Partenaire</h1>
          <p className="text-muted-foreground">
            Bienvenue {profile.full_name || profile.email}
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            {hasEventAccess && (
              <TabsTrigger value="events">
                <Calendar className="w-4 h-4 mr-2" />
                Événements
              </TabsTrigger>
            )}
            {hasPlaceAccess && (
              <TabsTrigger value="places">
                <MapPin className="w-4 h-4 mr-2" />
                Mes Adresses
              </TabsTrigger>
            )}
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {hasEventAccess && eventStats && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Événements totaux</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{eventStats.total_events}</div>
                      <p className="text-xs text-muted-foreground">
                        {eventStats.active_events} actifs, {eventStats.pending_events} en attente
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Billets vendus</CardTitle>
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{eventStats.total_tickets_sold}</div>
                      <p className="text-xs text-muted-foreground">
                        Tous les événements confondus
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}

              {hasPlaceAccess && placeStats && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mes adresses</CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{placeStats.total_places}</div>
                      <p className="text-xs text-muted-foreground">
                        {placeStats.approved_places} approuvées, {placeStats.pending_places} en attente
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{placeStats.total_views}</div>
                      <p className="text-xs text-muted-foreground">
                        Sur toutes vos adresses
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {hasEventAccess && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      Organisateur d'événements
                    </CardTitle>
                    <CardDescription>
                      Créez et gérez vos événements, vendez des billets en ligne
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start bg-purple-500 hover:bg-purple-600"
                      onClick={() => setActiveTab('events')}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Gérer mes événements
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push('/admin/scanner')}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scanner des billets
                    </Button>
                  </CardContent>
                </Card>
              )}

              {hasPlaceAccess && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      Bonnes adresses & Services
                    </CardTitle>
                    <CardDescription>
                      Gérez vos établissements et prestations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start bg-blue-500 hover:bg-blue-600"
                      onClick={() => setActiveTab('places')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Gérer mes adresses
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push('/provider-dashboard')}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Statistiques détaillées
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Gestion des événements */}
          {hasEventAccess && (
            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mes événements</CardTitle>
                      <CardDescription>
                        Créez et gérez vos événements, consultez les statistiques de vente
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => router.push('/admin/events')}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Voir tous mes événements
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Gérez vos événements depuis l'interface d'administration
                    </p>
                    <Button onClick={() => router.push('/admin/events')}>
                      Accéder à la gestion des événements
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Gestion des adresses */}
          {hasPlaceAccess && (
            <TabsContent value="places" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mes bonnes adresses</CardTitle>
                      <CardDescription>
                        Gérez vos établissements et vitrines professionnelles
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProviderMediaCarousel partnerId={user?.id || ''} />
                  <ProviderAvailabilityCalendar partnerId={user?.id || ''} />
                  <ProviderQuoteRequests partnerId={user?.id || ''} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du compte</CardTitle>
                <CardDescription>
                  Gérez vos informations et préférences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Informations du profil</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Email: {profile.email}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Activités autorisées</h3>
                  <div className="space-y-2">
                    {hasEventAccess && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>Événements / Billetterie</span>
                      </div>
                    )}
                    {hasPlaceAccess && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span>Services / Bonnes Adresses</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Pour modifier vos activités ou obtenir des permissions supplémentaires,
                    contactez l'administration.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
