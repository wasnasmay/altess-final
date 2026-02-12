'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Send, Check, X, Eye, DollarSign, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminNavigation from '@/components/AdminNavigation';

interface CustomOrder {
  id: string;
  user_id: string;
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
}

interface QuoteDocument {
  id: string;
  quote_number: string;
  user_id: string;
  custom_order_id: string;
  items: any[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  valid_until: string;
  notes: string;
  sent_at: string;
  viewed_at: string;
  accepted_at: string;
  rejected_at: string;
  created_at: string;
  custom_order?: CustomOrder;
  profile?: {
    full_name: string;
    email: string;
  };
}

interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  base_price: number;
  items: any[];
  validity_days: number;
  terms_conditions: string;
}

export default function QuotesManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [quoteDocuments, setQuoteDocuments] = useState<QuoteDocument[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDocument | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  async function loadData() {
    try {
      const [ordersRes, quotesRes, templatesRes] = await Promise.all([
        supabase
          .from('custom_orders')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('quote_documents')
          .select(`
            *,
            custom_order:custom_orders(*),
            profile:profiles(full_name, email)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('quote_templates')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      if (ordersRes.data) setCustomOrders(ordersRes.data);
      if (quotesRes.data) setQuoteDocuments(quotesRes.data as any);
      if (templatesRes.data) setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQuote() {
    if (!selectedOrder || !selectedTemplate) {
      toast.error('Veuillez sélectionner un modèle');
      return;
    }

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) return;

      const subtotal = customPrice ? parseFloat(customPrice) : selectedOrder.total_price || template.base_price;
      const taxRate = 20.00;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + template.validity_days);

      const { data: quoteNumberData } = await supabase.rpc('generate_quote_number');
      const quoteNumber = quoteNumberData || `DEV-${Date.now()}`;

      const { data, error } = await supabase
        .from('quote_documents')
        .insert({
          quote_number: quoteNumber,
          user_id: selectedOrder.user_id,
          custom_order_id: selectedOrder.id,
          template_id: template.id,
          items: template.items,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'sent',
          valid_until: format(validUntil, 'yyyy-MM-dd'),
          notes: quoteNotes || template.terms_conditions,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('custom_orders')
        .update({ status: 'quote_sent' })
        .eq('id', selectedOrder.id);

      await sendQuoteEmail(selectedOrder.id, template.id);

      toast.success('Devis créé et envoyé avec succès !');
      setShowCreateDialog(false);
      setSelectedOrder(null);
      setSelectedTemplate('');
      setQuoteNotes('');
      setCustomPrice('');
      loadData();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Erreur lors de la création du devis');
    }
  }

  async function sendQuoteEmail(orderId: string, templateId?: string) {
    try {
      const order = customOrders.find(o => o.id === orderId);
      if (!order) return;

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-quote-email`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          templateId,
          formulaName: order.event_type
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Email de devis envoyé à ${order.customer_name}`);
        console.log('Quote sent:', result);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending quote email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    }
  }

  async function handleQuoteAction(quoteId: string, action: 'accept' | 'reject', reason?: string) {
    try {
      const updates: any = {
        status: action === 'accept' ? 'accepted' : 'rejected'
      };

      if (action === 'accept') {
        updates.accepted_at = new Date().toISOString();
      } else {
        updates.rejected_at = new Date().toISOString();
        updates.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('quote_documents')
        .update(updates)
        .eq('id', quoteId);

      if (error) throw error;

      toast.success(action === 'accept' ? 'Devis accepté' : 'Devis rejeté');
      loadData();
      setShowViewDialog(false);
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function handleInitiatePayment(quoteId: string) {
    try {
      const quote = quoteDocuments.find(q => q.id === quoteId);
      if (!quote) return;

      const { data, error } = await supabase
        .from('quote_payments')
        .insert({
          quote_document_id: quoteId,
          amount: quote.total_amount,
          payment_status: 'pending',
          notes: 'Paiement initié par l\'administrateur'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Demande de paiement créée ! Envoyez le lien de paiement au client.');
      loadData();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Erreur lors de la création du paiement');
    }
  }

  function getStatusBadge(status: string) {
    const configs: Record<string, any> = {
      pending: { variant: 'secondary', label: 'En attente', icon: Clock },
      quote_sent: { variant: 'default', label: 'Devis envoyé', icon: Send },
      draft: { variant: 'outline', label: 'Brouillon', icon: FileText },
      sent: { variant: 'default', label: 'Envoyé', icon: Send },
      viewed: { variant: 'secondary', label: 'Vu', icon: Eye },
      accepted: { variant: 'default', label: 'Accepté', icon: CheckCircle },
      rejected: { variant: 'destructive', label: 'Rejeté', icon: XCircle },
      expired: { variant: 'outline', label: 'Expiré', icon: Clock }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <AdminNavigation title="Gestion des Devis" />
        <p className="text-muted-foreground mb-6">Gérez les demandes et les devis clients</p>
        <div className="flex items-center justify-between mb-8">
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-2">
            <TabsTrigger value="orders">
              Demandes de devis ({customOrders.filter(o => o.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="quotes">
              Devis envoyés ({quoteDocuments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de composition d'orchestre</CardTitle>
                <CardDescription>Clients en attente d'un devis personnalisé</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Événement</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Prix estimé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.event_type}</div>
                            <div className="text-xs text-muted-foreground">{order.event_location}</div>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(order.event_date), 'dd MMM yyyy', { locale: fr })}</TableCell>
                        <TableCell>{order.duration_hours}h</TableCell>
                        <TableCell className="font-semibold">{order.total_price?.toFixed(0) || 0}€</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setCustomPrice(order.total_price?.toString() || '');
                                setShowCreateDialog(true);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Créer un devis
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {customOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucune demande de devis
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <CardTitle>Devis envoyés aux clients</CardTitle>
                <CardDescription>Suivi de tous les devis générés</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Devis</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Valide jusqu'au</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteDocuments.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-mono font-semibold">{quote.quote_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{quote.custom_order?.customer_name || quote.profile?.full_name}</div>
                            <div className="text-xs text-muted-foreground">{quote.custom_order?.customer_email || quote.profile?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{quote.total_amount.toFixed(2)}€</TableCell>
                        <TableCell>
                          {quote.valid_until ? format(new Date(quote.valid_until), 'dd MMM yyyy', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(quote.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedQuote(quote);
                                setShowViewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                            {quote.status === 'accepted' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleInitiatePayment(quote.id)}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Paiement
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {quoteDocuments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Aucun devis créé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un devis pour {selectedOrder?.customer_name}</DialogTitle>
              <DialogDescription>
                Sélectionnez un modèle de devis et ajustez les détails
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Modèle de devis</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.base_price}€ (base)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <>
                  <div>
                    <Label>Prix personnalisé (HT)</Label>
                    <Input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="Prix en euros"
                    />
                    {customPrice && (
                      <p className="text-sm text-muted-foreground mt-1">
                        TTC: {(parseFloat(customPrice) * 1.2).toFixed(2)}€
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Notes / Conditions particulières</Label>
                    <Textarea
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="Notes additionnelles pour ce devis..."
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateQuote} disabled={!selectedTemplate}>
                <Send className="w-4 h-4 mr-2" />
                Créer et envoyer le devis
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Devis {selectedQuote?.quote_number}</DialogTitle>
              <DialogDescription>
                Détails du devis pour {selectedQuote?.custom_order?.customer_name || selectedQuote?.profile?.full_name}
              </DialogDescription>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <p className="font-medium">{selectedQuote.custom_order?.customer_name || selectedQuote.profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedQuote.custom_order?.customer_email || selectedQuote.profile?.email}</p>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <div className="mt-1">{getStatusBadge(selectedQuote.status)}</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sous-total HT</p>
                      <p className="font-semibold">{selectedQuote.subtotal.toFixed(2)}€</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">TVA ({selectedQuote.tax_rate}%)</p>
                      <p className="font-semibold">{selectedQuote.tax_amount.toFixed(2)}€</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total TTC</p>
                      <p className="text-xl font-bold text-primary">{selectedQuote.total_amount.toFixed(2)}€</p>
                    </div>
                  </div>
                </div>

                {selectedQuote.notes && (
                  <div>
                    <Label>Conditions</Label>
                    <p className="text-sm whitespace-pre-wrap mt-1">{selectedQuote.notes}</p>
                  </div>
                )}

                {selectedQuote.status === 'sent' && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleQuoteAction(selectedQuote.id, 'accept')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Marquer comme accepté
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleQuoteAction(selectedQuote.id, 'reject', 'Rejeté par l\'administrateur')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Marquer comme rejeté
                    </Button>
                  </div>
                )}

                {selectedQuote.status === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 mb-2">✅ Devis accepté le {format(new Date(selectedQuote.accepted_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</p>
                    <Button onClick={() => handleInitiatePayment(selectedQuote.id)}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Initier le paiement
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
