'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNavigation from '@/components/AdminNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  TrendingUp,
  DollarSign,
  Users,
  Crown,
  AlertCircle,
  Calendar,
  ShoppingCart,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RevenueSummary {
  ticketing_revenue: number;
  ticketing_count: number;
  subscription_revenue: number;
  subscription_count: number;
  advertising_revenue: number;
  advertising_count: number;
  total_revenue: number;
  total_transactions: number;
}

interface PendingItem {
  id: string;
  type: 'event' | 'partner' | 'address';
  title: string;
  created_at: string;
  thumbnail?: string;
}

export default function PremiumDashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [pendingModeration, setPendingModeration] = useState<PendingItem[]>([]);
  const [premiumCount, setPremiumCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'admin') {
        router.push('/admin');
      }
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadDashboardData();
    }
  }, [user, profile]);

  async function loadDashboardData() {
    try {
      setLoadingData(true);

      // Load revenue summary from platform_revenue table
      const { data: revenueData } = await supabase
        .from('platform_revenue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (revenueData && revenueData.length > 0) {
        const summary: RevenueSummary = {
          ticketing_revenue: revenueData.reduce((sum, r) => sum + (r.ticketing_revenue || 0), 0),
          ticketing_count: revenueData.filter(r => r.ticketing_revenue > 0).length,
          subscription_revenue: revenueData.reduce((sum, r) => sum + (r.subscription_revenue || 0), 0),
          subscription_count: revenueData.filter(r => r.subscription_revenue > 0).length,
          advertising_revenue: revenueData.reduce((sum, r) => sum + (r.advertising_revenue || 0), 0),
          advertising_count: revenueData.filter(r => r.advertising_revenue > 0).length,
          total_revenue: revenueData.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
          total_transactions: revenueData.length
        };
        setRevenue(summary);
      }

      // Load pending moderation items
      const [eventsRes, partnersRes, addressesRes] = await Promise.all([
        supabase
          .from('public_events')
          .select('id, title, created_at, image_url')
          .eq('moderation_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('partners')
          .select('id, name, created_at, logo_url')
          .eq('moderation_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('good_addresses')
          .select('id, name, created_at, image_url')
          .eq('moderation_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const pending: PendingItem[] = [
        ...(eventsRes.data || []).map(e => ({
          id: e.id,
          type: 'event' as const,
          title: e.title,
          created_at: e.created_at,
          thumbnail: e.image_url,
        })),
        ...(partnersRes.data || []).map(p => ({
          id: p.id,
          type: 'partner' as const,
          title: p.name,
          created_at: p.created_at,
          thumbnail: p.logo_url,
        })),
        ...(addressesRes.data || []).map(a => ({
          id: a.id,
          type: 'address' as const,
          title: a.name,
          created_at: a.created_at,
          thumbnail: a.image_url,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPendingModeration(pending);

      // Count premium accounts
      const { count: premiumProvidersCount } = await supabase
        .from('event_providers')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', 'premium');

      setPremiumCount(premiumProvidersCount || 0);

      // Count expiring soon
      const { count: expiringEventsCount } = await supabase
        .from('public_events')
        .select('*', { count: 'exact', head: true })
        .eq('expiration_status', 'expiring_soon');

      setExpiringCount(expiringEventsCount || 0);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoadingData(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
          <p className="mt-4 text-amber-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <AdminSidebar />
      <div className="ml-16">
        <div className="border-b border-amber-500/20 bg-black/40 backdrop-blur-sm p-4">
          <div className="container mx-auto">
            <AdminNavigation title="Centre de Gestion ALTESS" />
          </div>
        </div>

        <div className="container mx-auto p-6 space-y-6">
          {/* Revenue Statistics - Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-amber-400">
                  Revenu Total
                </CardTitle>
                <DollarSign className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {revenue ? formatCurrency(revenue.total_revenue) : '...'}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5%
                  </Badge>
                  <span className="text-xs text-zinc-400">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            {/* Ticketing Revenue */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-400">
                  Billetterie (10%)
                </CardTitle>
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {revenue ? formatCurrency(revenue.ticketing_revenue) : '...'}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  {revenue?.ticketing_count || 0} transactions
                </p>
              </CardContent>
            </Card>

            {/* Subscription Revenue */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-purple-400">
                  Abonnements Premium
                </CardTitle>
                <Crown className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {revenue ? formatCurrency(revenue.subscription_revenue) : '...'}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  {revenue?.subscription_count || 0} abonnés actifs
                </p>
              </CardContent>
            </Card>

            {/* Advertising Revenue */}
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-green-400">
                  Publicités Premium
                </CardTitle>
                <Star className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {revenue ? formatCurrency(revenue.advertising_revenue) : '...'}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  {revenue?.advertising_count || 0} publicités actives
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Moderation Queue */}
            <Card className="bg-black/40 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-400">À Valider</span>
                  {pendingModeration.length > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 ml-auto">
                      {pendingModeration.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingModeration.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    Aucun élément en attente
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingModeration.slice(0, 3).map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/${item.type === 'event' ? 'events' : item.type === 'partner' ? 'partners-moderation' : 'addresses-moderation'}`)}
                      >
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {item.type === 'event' ? 'Événement' : item.type === 'partner' ? 'Partenaire' : 'Bonne adresse'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {pendingModeration.length > 3 && (
                      <button
                        onClick={() => router.push('/admin/moderation-center')}
                        className="w-full text-center text-sm text-amber-500 hover:text-amber-400 py-2"
                      >
                        Voir tout ({pendingModeration.length})
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Premium Accounts */}
            <Card className="bg-black/40 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-400">Comptes Premium</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-4">
                  {premiumCount}
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-purple-500 to-amber-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-zinc-400">
                  Comptes premium actifs
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Actifs</span>
                    <span className="text-green-400">{premiumCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Expire bientôt</span>
                    <span className="text-orange-400">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expiring Content */}
            <Card className="bg-black/40 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-400">Expirations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-400 mb-4">
                  {expiringCount}
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Contenus expirant dans les 30 jours
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-zinc-400">Expirés aujourd'hui</span>
                    <span className="ml-auto text-red-400">3</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-zinc-400">Cette semaine</span>
                    <span className="ml-auto text-orange-400">7</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-zinc-400">Ce mois</span>
                    <span className="ml-auto text-yellow-400">{expiringCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-black/40 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-amber-400">
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/admin/moderation-center')}
                  className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 hover:border-amber-500/50 transition-all group"
                >
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white text-center">Modération</p>
                </button>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 hover:border-blue-500/50 transition-all group"
                >
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white text-center">Utilisateurs</p>
                </button>
                <button
                  onClick={() => router.push('/admin/events')}
                  className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
                >
                  <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white text-center">Événements</p>
                </button>
                <button
                  onClick={() => router.push('/admin/gestion-globale')}
                  className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 hover:border-green-500/50 transition-all group"
                >
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white text-center">Vue globale</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
