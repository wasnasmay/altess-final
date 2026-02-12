'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AdminNavigation from '@/components/AdminNavigation';
import EventThumbnail from '@/components/EventThumbnail';
import { toast } from 'sonner';
import {
  Ticket,
  Search,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Euro,
  QrCode,
  TrendingUp
} from 'lucide-react';

type Booking = {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_tickets: number;
  total_amount: number;
  status: string;
  payment_status: string;
  tickets: any[];
  created_at: string;
  confirmed_at: string;
  qr_code_data: string;
  checked_in: boolean;
  checked_in_at: string;
  event: {
    title: string;
    event_date: string;
    event_time: string;
    city: string;
    venue_name: string;
    main_image: string;
    organizer_name: string;
  };
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = bookings.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.event?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBookings(filtered);
    } else {
      setFilteredBookings(bookings);
    }
  }, [searchTerm, bookings]);

  async function loadBookings() {
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:public_events(title, event_date, event_time, city, venue_name, main_image, organizer_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      setFilteredBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      pending: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'En attente' },
      confirmed: { className: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Confirmée' },
      cancelled: { className: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Annulée' },
    };
    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  function getPaymentBadge(status: string) {
    const variants: Record<string, any> = {
      pending: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'En attente' },
      succeeded: { className: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Payé' },
      failed: { className: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Échoué' },
    };
    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  function viewDetails(booking: Booking) {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  }

  async function exportBookings() {
    try {
      const csv = [
        ['Référence', 'Client', 'Email', 'Téléphone', 'Événement', 'Date', 'Billets', 'Montant', 'Statut', 'Paiement', 'Check-in'].join(','),
        ...filteredBookings.map(b => [
          b.booking_reference,
          b.customer_name,
          b.customer_email,
          b.customer_phone || '',
          b.event?.title || '',
          new Date(b.created_at).toLocaleDateString('fr-FR'),
          b.total_tickets,
          b.total_amount,
          b.status,
          b.payment_status,
          b.checked_in ? 'Oui' : 'Non'
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast.success('Export réussi');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erreur lors de l\'export');
    }
  }

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    checkedIn: bookings.filter(b => b.checked_in).length,
    revenue: bookings
      .filter(b => b.payment_status === 'succeeded')
      .reduce((sum, b) => sum + parseFloat(b.total_amount as any), 0),
    commission: bookings
      .filter(b => b.payment_status === 'succeeded')
      .reduce((sum, b) => sum + (parseFloat(b.total_amount as any) * 0.10), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Gestion des Réservations" />
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
      <AdminNavigation title="Gestion des Réservations" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-500" />
                Total Réservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Toutes réservations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Confirmées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground mt-1">Paiement réussi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <QrCode className="w-4 h-4 text-purple-500" />
                Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.checkedIn}</div>
              <p className="text-xs text-muted-foreground mt-1">Billets validés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Euro className="w-4 h-4 text-amber-500" />
                Revenu Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.revenue.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground mt-1">Paiements confirmés</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Commission 10%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">{stats.commission.toFixed(2)} €</div>
              <p className="text-xs text-amber-600/70 mt-1 font-medium">Vos gains ALTESS</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Liste des Réservations
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportBookings}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email, référence ou événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Référence</TableHead>
                    <TableHead className="w-[200px]">Client</TableHead>
                    <TableHead className="w-[280px]">Événement</TableHead>
                    <TableHead>Date Rés.</TableHead>
                    <TableHead className="text-center">Billets</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const commission = parseFloat(booking.total_amount as any) * 0.10;
                    return (
                      <TableRow key={booking.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{booking.booking_reference}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{booking.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <EventThumbnail
                              imageUrl={booking.event?.main_image}
                              eventTitle={booking.event?.title}
                              size="sm"
                              shape="square"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{booking.event?.title || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {booking.event?.organizer_name && (
                                  <span className="font-medium text-amber-600">
                                    {booking.event.organizer_name}
                                  </span>
                                )}
                                {booking.event?.organizer_name && booking.event?.event_date && ' • '}
                                {booking.event?.event_date &&
                                  new Date(booking.event.event_date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short'
                                  })
                                }
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(booking.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-center font-medium">{booking.total_tickets}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">{booking.total_amount} €</TableCell>
                        <TableCell>
                          <div className="font-semibold text-amber-600 whitespace-nowrap">
                            {commission.toFixed(2)} €
                          </div>
                          <div className="text-xs text-muted-foreground">10%</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                        <TableCell>
                          {booking.checked_in ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Validé
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <XCircle className="w-3 h-3 mr-1" />
                              Non validé
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDetails(booking)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredBookings.length === 0 && (
                <div className="p-12 text-center">
                  <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Aucune réservation trouvée' : 'Aucune réservation pour le moment'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Détails de la Réservation
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Référence</div>
                  <div className="font-mono font-semibold">{selectedBooking.booking_reference}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Date de Réservation</div>
                  <div>{new Date(selectedBooking.created_at).toLocaleString('fr-FR')}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informations Client
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.customer_email}</span>
                  </div>
                  {selectedBooking.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Événement
                </h3>
                <div className="flex items-start gap-4">
                  <EventThumbnail
                    imageUrl={selectedBooking.event?.main_image}
                    eventTitle={selectedBooking.event?.title}
                    size="lg"
                    shape="square"
                  />
                  <div className="flex-1 space-y-2 text-sm">
                    <div className="font-medium text-lg">{selectedBooking.event?.title}</div>
                    {selectedBooking.event?.organizer_name && (
                      <div className="text-amber-600 font-medium">
                        Organisateur : {selectedBooking.event.organizer_name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {selectedBooking.event?.event_date &&
                        new Date(selectedBooking.event.event_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      }
                      {selectedBooking.event?.event_time && ` à ${selectedBooking.event.event_time}`}
                    </div>
                    {selectedBooking.event?.venue_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {selectedBooking.event.venue_name} - {selectedBooking.event.city}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Billets</h3>
                <div className="space-y-2">
                  {selectedBooking.tickets?.map((ticket: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                      <div>
                        <div className="font-medium">{ticket.category}</div>
                        <div className="text-sm text-muted-foreground">Quantité: {ticket.quantity}</div>
                      </div>
                      <div className="font-semibold">{ticket.price} € x {ticket.quantity}</div>
                    </div>
                  ))}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <div className="font-bold">Total</div>
                      <div className="text-2xl font-bold text-primary">{selectedBooking.total_amount} €</div>
                    </div>
                    <div className="flex justify-between items-center bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-amber-700">Commission ALTESS (10%)</span>
                      </div>
                      <div className="text-xl font-bold text-amber-700">
                        {(parseFloat(selectedBooking.total_amount as any) * 0.10).toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </h3>
                {selectedBooking.qr_code_data ? (
                  <div className="text-center bg-white p-4 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedBooking.qr_code_data)}&bgcolor=FFFFFF&color=000000&margin=20`}
                      alt="QR Code"
                      className="mx-auto border-4 border-amber-500 rounded-lg"
                    />
                    <p className="mt-3 text-sm text-muted-foreground font-mono">{selectedBooking.qr_code_data}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">QR Code non généré</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Statut</div>
                  <div>{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Paiement</div>
                  <div>{getPaymentBadge(selectedBooking.payment_status)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Check-in</div>
                  <div>
                    {selectedBooking.checked_in ? (
                      <div>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validé
                        </Badge>
                        {selectedBooking.checked_in_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(selectedBooking.checked_in_at).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="w-3 h-3 mr-1" />
                        Non validé
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
