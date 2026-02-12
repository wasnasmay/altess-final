'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, Calendar, MapPin, Clock, Music, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminNavigation from '@/components/AdminNavigation';

type OrderItem = {
  id: string;
  instrument: {
    name: string;
    category: string;
  };
  quantity: number;
  price_per_hour: number;
  subtotal: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_date: string;
  event_location: string;
  event_type: string;
  duration_hours: number;
  total_price: number;
  status: string;
  notes: string;
  created_at: string;
  items?: OrderItem[];
};

const statusColors: Record<string, string> = {
  draft: 'secondary',
  pending: 'default',
  confirmed: 'default',
  paid: 'default',
  completed: 'default',
  cancelled: 'destructive',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  confirmed: 'Confirmé',
  paid: 'Payé',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price_per_hour,
            subtotal,
            instrument:instrument_id (
              name,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedOrders = data?.map(order => ({
        ...order,
        items: order.order_items
      })) || [];

      setOrders(mappedOrders);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des commandes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('custom_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Statut mis à jour');
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  }

  function viewOrderDetails(order: Order) {
    setSelectedOrder(order);
    setDetailsOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AdminNavigation title="Gestion des Commandes" />

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-2">
                    {order.customer_name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusColors[order.status] as any}>
                      {statusLabels[order.status]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Commande du {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{order.total_price}€</p>
                  <p className="text-sm text-muted-foreground">{order.items?.length || 0} instruments</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{format(new Date(order.event_date), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{order.event_location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{order.duration_hours} heures</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewOrderDetails(order)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Détails
                </Button>
                <Select
                  value={order.status}
                  onValueChange={(value) => updateOrderStatus(order.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmé</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">Informations client</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Nom:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && <p><strong>Téléphone:</strong> {selectedOrder.customer_phone}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Événement
                </h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Type:</strong> {selectedOrder.event_type}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedOrder.event_date), 'dd MMMM yyyy', { locale: fr })}</p>
                  <p><strong>Lieu:</strong> {selectedOrder.event_location}</p>
                  <p><strong>Durée:</strong> {selectedOrder.duration_hours} heures</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  Instruments sélectionnés
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-secondary/20 rounded">
                      <div>
                        <p className="font-medium">{item.quantity}x {item.instrument.name}</p>
                        <p className="text-muted-foreground text-xs">{item.instrument.category}</p>
                      </div>
                      <span className="font-bold">{item.subtotal}€</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-xl font-bold text-primary">
                  <span>Total:</span>
                  <span>{selectedOrder.total_price}€</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-bold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground p-3 bg-secondary/20 rounded">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-bold mb-2">Statut</h3>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmé</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
