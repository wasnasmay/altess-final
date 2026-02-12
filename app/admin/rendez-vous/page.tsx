'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminNavigation from '@/components/AdminNavigation';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  Users,
  Euro,
  CheckCircle,
  Clock,
  Eye,
  Ticket,
  TrendingUp,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
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
  created_at: string;
};

type EventStats = {
  total_events: number;
  active_events: number;
  total_revenue: number;
  commission: number;
};

const COMMISSION_RATE = 0.10; // 10%

export default function AdminRendezVousPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    total_events: 0,
    active_events: 0,
    total_revenue: 0,
    commission: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('public_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;

      const events = data || [];
      setEvents(events);

      // Calculate stats
      const totalRevenue = events.reduce((sum, event) => {
        const eventRevenue = (event.ticket_categories || []).reduce((catSum: number, cat: any) => {
          return catSum + (cat.sold || 0) * (cat.price || 0);
        }, 0);
        return sum + eventRevenue;
      }, 0);

      setStats({
        total_events: events.length,
        active_events: events.filter(e => e.is_active).length,
        total_revenue: totalRevenue,
        commission: totalRevenue * COMMISSION_RATE
      });

    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function toggleEventStatus(eventId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('public_events')
        .update({ is_active: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;

      toast.success(currentStatus ? 'Événement désactivé' : 'Événement activé');
      loadEvents();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  const getStatusBadge = (event: Event) => {
    if (!event.is_active) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-500">Inactif</Badge>;
    }

    const eventDate = new Date(event.event_date);
    const now = new Date();

    if (eventDate < now) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-500">Terminé</Badge>;
    }

    if (event.tickets_sold >= event.total_quota) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-500">Complet</Badge>;
    }

    return <Badge variant="outline" className="bg-green-500/10 text-green-500">Disponible</Badge>;
  };

  const getApprovalBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approuvé
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
        <Clock className="w-3 h-3 mr-1" />
        En attente
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Gestion des Rendez-vous" />
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
      <AdminNavigation title="Gestion des Rendez-vous" />

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Événements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_events}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.active_events} actifs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Billets Vendus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {events.reduce((sum, e) => sum + (e.tickets_sold || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                sur {events.reduce((sum, e) => sum + (e.total_quota || 0), 0)} places
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Revenu Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_revenue.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground mt-1">
                Toutes ventes confondues
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ma Commission (10%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.commission.toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Commission plateforme
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Events Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Événements</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventRevenue = (event.ticket_categories || []).reduce((sum, cat) => {
              return sum + (cat.sold || 0) * (cat.price || 0);
            }, 0);
            const commission = eventRevenue * COMMISSION_RATE;

            return (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-gray-600" />
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {getStatusBadge(event)}
                    {getApprovalBadge(event.is_active)}
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.event_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Ticket Categories */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Catégories de billets :</div>
                    {(event.ticket_categories || []).map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                        <span className="font-medium">{cat.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            {cat.sold || 0}/{cat.quota} vendus
                          </span>
                          <span className="font-semibold text-primary">
                            {cat.price} €
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue & Commission */}
                  <div className="pt-3 border-t space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Revenu total :</span>
                      <span className="font-semibold">{eventRevenue.toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Commission (10%) :</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {commission.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/rendez-vous/${event.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                    </Link>
                    <Button
                      variant={event.is_active ? "destructive" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleEventStatus(event.id, event.is_active)}
                    >
                      {event.is_active ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activer
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {events.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">Aucun événement pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Les événements créés s'afficheront ici
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
