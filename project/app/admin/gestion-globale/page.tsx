'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminNavigation from '@/components/AdminNavigation';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  TrendingUp,
  AlertTriangle,
  Store,
  Users,
  Eye,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

type Event = {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  venue_name: string;
  main_image: string;
  ticket_categories: Array<{
    name: string;
    price: number;
    quota: number;
    sold: number;
  }>;
  total_quota: number;
  tickets_sold: number;
  status: string;
  is_active: boolean;
  expires_at?: string;
  payment_transferred?: boolean;
};

type GoodAddress = {
  id: string;
  name: string;
  slug: string;
  city: string;
  category: string;
  logo_url: string;
  is_active: boolean;
  status: string;
  expires_at?: string;
  payment_transferred?: boolean;
};

type Partner = {
  id: string;
  name: string;
  slug: string;
  city: string;
  logo_url: string;
  is_active: boolean;
  is_featured: boolean;
  status: string;
  expires_at?: string;
  payment_transferred?: boolean;
};

type FinancialStats = {
  total_revenue: number;
  commission: number;
  net_to_transfer: number;
  pending_transfers: number;
};

const COMMISSION_RATE = 0.10;

export default function AdminGestionGlobalePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [addresses, setAddresses] = useState<GoodAddress[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    total_revenue: 0,
    commission: 0,
    net_to_transfer: 0,
    pending_transfers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eventsRes, addressesRes, partnersRes] = await Promise.all([
        supabase
          .from('public_events')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('good_addresses')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('partners')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      const eventData = eventsRes.data || [];
      const addressData = addressesRes.data || [];
      const partnerData = partnersRes.data || [];

      setEvents(eventData);
      setAddresses(addressData);
      setPartners(partnerData);

      // Calculate financial stats
      const totalRevenue = eventData.reduce((sum, event) => {
        const eventRevenue = (event.ticket_categories || []).reduce((catSum: number, cat: any) => {
          return catSum + (cat.sold || 0) * (cat.price || 0);
        }, 0);
        return sum + eventRevenue;
      }, 0);

      const commission = totalRevenue * COMMISSION_RATE;
      const netToTransfer = totalRevenue - commission;
      const pendingTransfers = eventData.filter(e => !e.payment_transferred && e.tickets_sold > 0).length;

      setStats({
        total_revenue: totalRevenue,
        commission,
        net_to_transfer: netToTransfer,
        pending_transfers: pendingTransfers
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(table: string, id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from(table)
        .update({
          is_active: !isActive,
          status: !isActive ? 'approved' : 'pending'
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(!isActive ? 'Approuvé' : 'Mis en attente');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function markTransferred(eventId: string) {
    try {
      const { error } = await supabase
        .from('public_events')
        .update({ payment_transferred: true })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Virement marqué comme effectué');
      loadData();
    } catch (error) {
      console.error('Error marking transfer:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  const getCountdown = (expiresAt?: string) => {
    if (!expiresAt) return null;

    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: 'Expiré', color: 'text-red-500' };
    if (daysLeft <= 7) return { text: `${daysLeft}j restants`, color: 'text-red-500' };
    if (daysLeft <= 30) return { text: `${daysLeft}j restants`, color: 'text-amber-500' };
    return { text: `${daysLeft}j restants`, color: 'text-green-500' };
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive || status === 'pending') {
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      );
    }
    if (status === 'approved') {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approuvé
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
        Inactif
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Gestion Globale" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation title="Gestion Globale - ALTESS" />

      <div className="container mx-auto px-4 py-8">
        {/* Financial Overview */}
        <Card className="mb-8 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Vue Financière Globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                <div className="text-sm text-muted-foreground mb-2">Total Brut</div>
                <div className="text-3xl font-bold">{stats.total_revenue.toFixed(2)} €</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                <div className="text-sm text-purple-400 mb-2">Ma Commission (10%)</div>
                <div className="text-3xl font-bold text-purple-400">
                  {stats.commission.toFixed(2)} €
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <div className="text-sm text-green-400 mb-2">Net à Reverser</div>
                <div className="text-3xl font-bold text-green-400">
                  {stats.net_to_transfer.toFixed(2)} €
                </div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <div className="text-sm text-amber-400 mb-2">Virements en Attente</div>
                <div className="text-3xl font-bold text-amber-400">
                  {stats.pending_transfers}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Interface */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-black py-4"
            >
              <Calendar className="w-5 h-5 mr-2" />
              <div>
                <div className="font-bold">ÉVÉNEMENTS</div>
                <div className="text-xs">Billetterie Rendez-vous</div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white py-4"
            >
              <Store className="w-5 h-5 mr-2" />
              <div>
                <div className="font-bold">BONNES ADRESSES</div>
                <div className="text-xs">Prestataires Locaux</div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="partners"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white py-4"
            >
              <Users className="w-5 h-5 mr-2" />
              <div>
                <div className="font-bold">PARTENAIRES</div>
                <div className="text-xs">Réseau Premium</div>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* EVENTS TAB */}
          <TabsContent value="events" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventRevenue = (event.ticket_categories || []).reduce((sum, cat) => {
                  return sum + (cat.sold || 0) * (cat.price || 0);
                }, 0);
                const commission = eventRevenue * COMMISSION_RATE;
                const netAmount = eventRevenue - commission;
                const countdown = getCountdown(event.expires_at);

                return (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow border-amber-500/20">
                    <div className="relative h-48 bg-gradient-to-br from-amber-900 to-amber-950 overflow-hidden">
                      {event.main_image ? (
                        <img src={event.main_image} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-amber-600" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {getStatusBadge(event.status, event.is_active)}
                        {countdown && (
                          <Badge className={`bg-black/80 ${countdown.color}`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {countdown.text}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.event_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.venue_name}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {(event.ticket_categories || []).map((cat, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
                            <span>{cat.name}</span>
                            <span>{cat.sold || 0}/{cat.quota}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Brut :</span>
                          <span className="font-semibold">{eventRevenue.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Commission (10%) :</span>
                          <span className="font-semibold text-purple-500">{commission.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Net à reverser :</span>
                          <span className="font-bold text-green-500">{netAmount.toFixed(2)} €</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/rendez-vous/${event.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={event.is_active ? "destructive" : "default"}
                          onClick={() => updateStatus('public_events', event.id, event.is_active)}
                          className="flex-1"
                        >
                          {event.is_active ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          {event.is_active ? 'Refuser' : 'Approuver'}
                        </Button>
                      </div>

                      {eventRevenue > 0 && !event.payment_transferred && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                          onClick={() => markTransferred(event.id)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Virement Effectué
                        </Button>
                      )}

                      {event.payment_transferred && (
                        <Badge className="w-full justify-center bg-green-500/10 text-green-500 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Virement effectué
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {events.length === 0 && (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun événement pour le moment</p>
              </Card>
            )}
          </TabsContent>

          {/* ADDRESSES TAB */}
          <TabsContent value="addresses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((address) => {
                const countdown = getCountdown(address.expires_at);

                return (
                  <Card key={address.id} className="overflow-hidden hover:shadow-lg transition-shadow border-blue-500/20">
                    <div className="relative h-48 bg-gradient-to-br from-blue-900 to-blue-950 overflow-hidden flex items-center justify-center">
                      {address.logo_url ? (
                        <img src={address.logo_url} alt={address.name} className="max-w-full max-h-full object-contain p-4" />
                      ) : (
                        <Store className="w-16 h-16 text-blue-600" />
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {getStatusBadge(address.status, address.is_active)}
                        {countdown && (
                          <Badge className={`bg-black/80 ${countdown.color}`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {countdown.text}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-2">{address.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {address.city}
                      </div>
                      <Badge variant="outline" className="w-fit">{address.category}</Badge>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Link href={`/bonnes-adresses/${address.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={address.is_active ? "destructive" : "default"}
                          onClick={() => updateStatus('good_addresses', address.id, address.is_active)}
                          className="flex-1"
                        >
                          {address.is_active ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          {address.is_active ? 'Refuser' : 'Approuver'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {addresses.length === 0 && (
              <Card className="p-12 text-center">
                <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucune bonne adresse pour le moment</p>
              </Card>
            )}
          </TabsContent>

          {/* PARTNERS TAB */}
          <TabsContent value="partners" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => {
                const countdown = getCountdown(partner.expires_at);

                return (
                  <Card key={partner.id} className="overflow-hidden hover:shadow-lg transition-shadow border-green-500/20">
                    <div className="relative h-48 bg-gradient-to-br from-green-900 to-green-950 overflow-hidden flex items-center justify-center">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="max-w-full max-h-full object-contain p-4" />
                      ) : (
                        <Users className="w-16 h-16 text-green-600" />
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {getStatusBadge(partner.status, partner.is_active)}
                        {partner.is_featured && (
                          <Badge className="bg-amber-500 text-black">
                            Premium
                          </Badge>
                        )}
                        {countdown && (
                          <Badge className={`bg-black/80 ${countdown.color}`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {countdown.text}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-2">{partner.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {partner.city}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Link href={`/partenaires/${partner.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={partner.is_active ? "destructive" : "default"}
                          onClick={() => updateStatus('partners', partner.id, partner.is_active)}
                          className="flex-1"
                        >
                          {partner.is_active ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          {partner.is_active ? 'Refuser' : 'Approuver'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {partners.length === 0 && (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun partenaire pour le moment</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
