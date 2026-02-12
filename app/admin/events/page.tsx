'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import AdminSidebar from '@/components/AdminSidebar';
import EventThumbnail from '@/components/EventThumbnail';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Calendar, Users, TrendingUp, Eye, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type TicketCategory = {
  name: string;
  price: number;
  quota: number;
  sold: number;
};

type Event = {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  short_description: string;
  event_date: string;
  event_time: string;
  city: string;
  venue_name: string;
  main_image: string;
  ticket_categories: TicketCategory[];
  total_quota: number;
  tickets_sold: number;
  is_active: boolean;
  is_free: boolean;
  cancellation_policy: string;
  approval_status: string;
  expires_at: string;
  approved_at: string;
  organizer_id: string;
  organizer: {
    full_name: string;
    email: string;
  };
};

const eventTypes = [
  { value: 'concert', label: 'Concert' },
  { value: 'festival', label: 'Festival' },
  { value: 'soiree', label: 'Soirée' },
  { value: 'spectacle', label: 'Spectacle' },
  { value: 'conference', label: 'Conférence' },
  { value: 'atelier', label: 'Atelier' },
  { value: 'autre', label: 'Autre' },
];

export default function AdminEventsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile?.role !== 'admin') {
      toast.error('Accès refusé');
      router.push('/');
      return;
    }

    loadEvents();
  }, [user, profile]);

  async function loadEvents() {
    try {
      const { data: eventsData, error } = await supabase
        .from('public_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedEvents = await Promise.all(
        (eventsData || []).map(async (event) => {
          if (event.organizer_id) {
            const { data: organizerData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', event.organizer_id)
              .maybeSingle();

            return {
              ...event,
              organizer: organizerData || { full_name: 'Inconnu', email: '' }
            };
          }
          return {
            ...event,
            organizer: { full_name: 'Inconnu', email: '' }
          };
        })
      );

      setEvents(enrichedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(eventId: string) {
    try {
      const { error } = await supabase
        .from('public_events')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          is_active: true
        })
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Événement approuvé');
      loadEvents();
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  }

  async function handleReject(eventId: string) {
    const reason = prompt('Raison du rejet (optionnelle):');

    try {
      const { error } = await supabase
        .from('public_events')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          is_active: false
        })
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Événement rejeté');
      loadEvents();
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Erreur lors du rejet');
    }
  }

  function viewDetails(event: Event) {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  }

  function getApprovalBadge(status: string) {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
    }
  }

  function getTimeRemaining(expiresAt: string) {
    if (!expiresAt) return null;

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expiré
        </Badge>
      );
    } else if (diffDays <= 7) {
      return (
        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Expire dans {diffDays}j
        </Badge>
      );
    } else if (diffDays <= 30) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Expire dans {diffDays}j
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Valide {diffDays}j
        </Badge>
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const { error } = await supabase
        .from('public_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Événement supprimé');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function downloadParticipants(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('*')
        .eq('event_id', eventId)
        .eq('payment_status', 'succeeded');

      if (error) throw error;

      const csv = [
        ['Référence', 'Nom', 'Email', 'Téléphone', 'Billets', 'Montant', 'Date'].join(','),
        ...data.map(b => [
          b.booking_reference,
          b.customer_name,
          b.customer_email,
          b.customer_phone || '',
          b.total_tickets,
          b.total_amount,
          new Date(b.created_at).toLocaleDateString('fr-FR')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${eventId}.csv`;
      a.click();

      toast.success('Liste téléchargée');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Erreur lors du téléchargement');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <AdminSidebar />
        <div className="lg:ml-64 p-4 md:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminSidebar />

      <div className="lg:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Modération des Événements</h1>
              <p className="text-slate-400 text-sm md:text-base">Approuvez ou rejetez les événements soumis par les organisateurs</p>
            </div>
          </div>

          <div className="grid gap-6">
            {events.map((event) => {
              const availableTickets = event.total_quota - event.tickets_sold;
              const progressPercent = event.total_quota > 0
                ? (event.tickets_sold / event.total_quota) * 100
                : 0;

              return (
                <Card key={event.id} className="bg-slate-900/50 border-slate-800 overflow-hidden border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <EventThumbnail
                      imageUrl={event.main_image}
                      eventTitle={event.title}
                      size="md"
                      shape="square"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 flex items-start justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="flex items-center gap-2 text-white">
                            <Calendar className="w-5 h-5 text-purple-400" />
                            <span className="truncate">{event.title}</span>
                          </CardTitle>
                          {getApprovalBadge(event.approval_status || 'pending')}
                          {event.expires_at && getTimeRemaining(event.expires_at)}
                        </div>
                        <p className="text-sm text-slate-400">
                          {new Date(event.event_date).toLocaleDateString('fr-FR')}
                          {event.event_time && ` à ${event.event_time}`} • {event.city}
                        </p>
                        {event.organizer && (
                          <p className="text-sm font-medium text-amber-400 mt-1">
                            Organisateur: {event.organizer.full_name} ({event.organizer.email})
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => viewDetails(event)}
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => downloadParticipants(event.id)}
                        title="Télécharger la liste"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {event.approval_status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="icon"
                            onClick={() => handleApprove(event.id)}
                            className="bg-green-500 hover:bg-green-600"
                            title="Approuver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleReject(event.id)}
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {event.approval_status === 'rejected' && (
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => handleApprove(event.id)}
                          className="bg-green-500 hover:bg-green-600"
                          title="Réapprouver"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-slate-400">Billets vendus</p>
                        <p className="font-semibold text-white">{event.tickets_sold} / {event.total_quota}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-xs text-slate-400">Disponibles</p>
                        <p className="font-semibold text-green-400">{availableTickets}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-slate-400">Taux de remplissage</p>
                        <p className="font-semibold text-white">{progressPercent.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>

                  {event.ticket_categories && event.ticket_categories.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.ticket_categories.map((cat, idx) => (
                        <div key={idx} className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full">
                          {cat.name}: {cat.quota - cat.sold} / {cat.quota} ({cat.price}€)
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>

          {events.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400 text-lg">Aucun événement à modérer</p>
              <p className="text-sm text-slate-500 mt-2">Les événements soumis apparaîtront ici</p>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-2 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              Détails de l'événement
              {selectedEvent && getApprovalBadge(selectedEvent.approval_status || 'pending')}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-white">{selectedEvent.title}</h3>
                {selectedEvent.short_description && (
                  <p className="text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                    {selectedEvent.short_description}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Type</p>
                  <p className="capitalize text-white font-medium">{selectedEvent.event_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Ville</p>
                  <p className="text-white font-medium">{selectedEvent.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Date</p>
                  <p className="text-white font-medium">{new Date(selectedEvent.event_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Heure</p>
                  <p className="text-white font-medium">{selectedEvent.event_time || 'Non définie'}</p>
                </div>
                {selectedEvent.venue_name && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-400 mb-1">Lieu</p>
                    <p className="text-white font-medium">{selectedEvent.venue_name}</p>
                  </div>
                )}
              </div>

              {selectedEvent.organizer && (
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <p className="text-sm font-medium text-amber-400 mb-2">Organisateur</p>
                  <p className="font-semibold text-white">{selectedEvent.organizer.full_name}</p>
                  <p className="text-sm text-amber-300/80">{selectedEvent.organizer.email}</p>
                </div>
              )}

              {selectedEvent.ticket_categories && selectedEvent.ticket_categories.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-2">Catégories de billets</p>
                  <div className="space-y-2">
                    {selectedEvent.ticket_categories.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <div>
                          <p className="font-medium text-white">{cat.name}</p>
                          <p className="text-sm text-slate-400">Prix: {cat.price}€</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">{cat.sold} / {cat.quota}</p>
                          <p className="text-xs text-slate-400">vendus</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.cancellation_policy && (
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <p className="text-sm font-medium text-slate-400 mb-2">Politique d'annulation</p>
                  <p className="text-sm text-slate-200">{selectedEvent.cancellation_policy}</p>
                </div>
              )}

              {selectedEvent.expires_at && (
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <p className="text-sm font-medium text-slate-400 mb-2">Validité</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTimeRemaining(selectedEvent.expires_at)}
                    <span className="text-sm text-slate-300">
                      expire le {new Date(selectedEvent.expires_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-700">
                {selectedEvent.approval_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        handleApprove(selectedEvent.id);
                        setDetailsDialogOpen(false);
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleReject(selectedEvent.id);
                        setDetailsDialogOpen(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
                {selectedEvent.approval_status === 'rejected' && (
                  <Button
                    onClick={() => {
                      handleApprove(selectedEvent.id);
                      setDetailsDialogOpen(false);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Réapprouver
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
