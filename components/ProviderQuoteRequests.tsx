'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Phone, Calendar, Users, MessageSquare, CheckCircle, XCircle, Clock, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type QuoteStatus = 'pending' | 'contacted' | 'quoted' | 'converted' | 'declined';

type QuoteRequest = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  message: string;
  status: QuoteStatus;
  created_at: string;
};

const statusConfig = {
  pending: {
    label: 'En attente',
    color: 'bg-orange-500',
    variant: 'secondary' as const,
    icon: Clock,
  },
  contacted: {
    label: 'Contacté',
    color: 'bg-blue-500',
    variant: 'default' as const,
    icon: Phone,
  },
  quoted: {
    label: 'Devis envoyé',
    color: 'bg-purple-500',
    variant: 'default' as const,
    icon: FileText,
  },
  converted: {
    label: 'Converti',
    color: 'bg-green-500',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  declined: {
    label: 'Refusé',
    color: 'bg-red-500',
    variant: 'destructive' as const,
    icon: XCircle,
  },
};

export default function ProviderQuoteRequests({ partnerId }: { partnerId: string }) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadQuotes();
  }, [partnerId]);

  async function loadQuotes() {
    try {
      const { data, error } = await supabase
        .from('partner_quote_requests')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(quoteId: string, newStatus: QuoteStatus) {
    try {
      const { error } = await supabase
        .from('partner_quote_requests')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;
      toast.success('Statut mis à jour');
      loadQuotes();
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  function openDetailDialog(quote: QuoteRequest) {
    setSelectedQuote(quote);
    setShowDetailDialog(true);
  }

  const stats = {
    total: quotes.length,
    pending: quotes.filter((q) => q.status === 'pending').length,
    contacted: quotes.filter((q) => q.status === 'contacted').length,
    quoted: quotes.filter((q) => q.status === 'quoted').length,
    converted: quotes.filter((q) => q.status === 'converted').length,
    declined: quotes.filter((q) => q.status === 'declined').length,
    conversionRate: quotes.length > 0
      ? ((quotes.filter((q) => q.status === 'converted').length / quotes.length) * 100).toFixed(1)
      : '0',
  };

  const filteredQuotes = activeTab === 'all'
    ? quotes
    : quotes.filter((q) => q.status === activeTab);

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/20">
      <CardHeader>
        <CardTitle className="text-2xl text-amber-400">Demandes de Devis</CardTitle>
        <CardDescription className="text-slate-400">
          Gérez les demandes de vos clients potentiels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-400" />
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-slate-400">En attente</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <Phone className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold text-white">{stats.contacted}</p>
              <p className="text-xs text-slate-400">Contactés</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold text-white">{stats.quoted}</p>
              <p className="text-xs text-slate-400">Devis envoyés</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-white">{stats.converted}</p>
              <p className="text-xs text-slate-400">Convertis</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/40">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
              <p className="text-xs text-slate-400">Taux conversion</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-black/40">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="contacted">Contactées</TabsTrigger>
            <TabsTrigger value="quoted">Devis</TabsTrigger>
            <TabsTrigger value="converted">Converti</TabsTrigger>
            <TabsTrigger value="declined">Refusées</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucune demande dans cette catégorie</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredQuotes.map((quote) => {
                  const config = statusConfig[quote.status];
                  const Icon = config.icon;
                  return (
                    <Card
                      key={quote.id}
                      className="bg-black/40 border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
                      onClick={() => openDetailDialog(quote)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{quote.client_name}</h3>
                              <Badge variant={config.variant} className="flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">
                              Reçu le {format(new Date(quote.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4 text-amber-400" />
                            <span className="truncate">{quote.client_email}</span>
                          </div>
                          {quote.client_phone && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <Phone className="w-4 h-4 text-amber-400" />
                              <span>{quote.client_phone}</span>
                            </div>
                          )}
                          {quote.event_date && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <Calendar className="w-4 h-4 text-amber-400" />
                              <span>{format(new Date(quote.event_date), 'dd/MM/yyyy')}</span>
                            </div>
                          )}
                          {quote.guest_count && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <Users className="w-4 h-4 text-amber-400" />
                              <span>{quote.guest_count} invités</span>
                            </div>
                          )}
                        </div>

                        {quote.event_type && (
                          <div className="mt-3">
                            <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                              {quote.event_type}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl bg-slate-900 border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="text-amber-400">
                Demande de {selectedQuote?.client_name}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Détails complets de la demande de devis
              </DialogDescription>
            </DialogHeader>

            {selectedQuote && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Email</Label>
                    <p className="text-white font-medium">{selectedQuote.client_email}</p>
                  </div>
                  {selectedQuote.client_phone && (
                    <div>
                      <Label className="text-slate-400 text-xs">Téléphone</Label>
                      <p className="text-white font-medium">{selectedQuote.client_phone}</p>
                    </div>
                  )}
                  {selectedQuote.event_date && (
                    <div>
                      <Label className="text-slate-400 text-xs">Date événement</Label>
                      <p className="text-white font-medium">
                        {format(new Date(selectedQuote.event_date), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}
                  {selectedQuote.guest_count && (
                    <div>
                      <Label className="text-slate-400 text-xs">Nombre d'invités</Label>
                      <p className="text-white font-medium">{selectedQuote.guest_count}</p>
                    </div>
                  )}
                  {selectedQuote.event_type && (
                    <div className="col-span-2">
                      <Label className="text-slate-400 text-xs">Type d'événement</Label>
                      <p className="text-white font-medium">{selectedQuote.event_type}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-slate-400 text-xs">Message</Label>
                  <div className="mt-2 p-4 bg-black/40 border border-amber-500/20 rounded-lg">
                    <p className="text-white whitespace-pre-wrap">{selectedQuote.message}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="text-white">Changer le statut</Label>
                  <Select
                    value={selectedQuote.status}
                    onValueChange={(value: QuoteStatus) => handleStatusUpdate(selectedQuote.id, value)}
                  >
                    <SelectTrigger className="bg-black/40 border-amber-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([status, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    asChild
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                  >
                    <a href={`mailto:${selectedQuote.client_email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer un email
                    </a>
                  </Button>
                  {selectedQuote.client_phone && (
                    <Button
                      asChild
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    >
                      <a href={`tel:${selectedQuote.client_phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailDialog(false)}
                className="border-amber-500/30"
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
