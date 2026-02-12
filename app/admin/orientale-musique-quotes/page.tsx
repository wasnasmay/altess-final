'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Mail, Phone, User, MapPin, Users, Clock, Music2, FileText, DollarSign, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

type QuoteRequest = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  event_date: string;
  event_city: string;
  event_type: string | null;
  guests_count: number;
  duration_hours: number;
  musicians_count: number;
  additional_notes: string | null;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'paid';
  source: string;
  quote_amount: number | null;
  stripe_payment_link: string | null;
  created_at: string;
};

export default function OrientaleMusiqueQuotesAdminPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    checkAuth();
    loadQuotes();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }
  }

  async function loadQuotes() {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  }

  async function updateQuoteStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Statut mis à jour');
      loadQuotes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function sendQuote() {
    if (!selectedQuote || !quoteAmount) return;

    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({
          status: 'quoted',
          quote_amount: parseFloat(quoteAmount),
          stripe_payment_link: paymentLink || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedQuote.id);

      if (error) throw error;
      toast.success('Devis envoyé');
      setSelectedQuote(null);
      setQuoteAmount('');
      setPaymentLink('');
      loadQuotes();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Erreur lors de l\'envoi du devis');
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'En attente' },
      quoted: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Devisé' },
      accepted: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Accepté' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Refusé' },
      paid: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Payé' },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={`${variant.color} border`}>{variant.label}</Badge>;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-amber-500" />
          Demandes de Devis - Orientale Musique
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérer les demandes de devis personnalisées
        </p>
      </div>

      {/* Liste des devis */}
      <div className="grid gap-4">
        {quotes.map((quote) => (
          <Card key={quote.id} className="border-amber-700/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-amber-200">{quote.client_name}</h3>
                    {getStatusBadge(quote.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Demandé {formatDistance(new Date(quote.created_at), new Date(), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {quote.status === 'pending' && (
                    <Button
                      onClick={() => {
                        setSelectedQuote(quote);
                        setQuoteAmount(quote.quote_amount?.toString() || '');
                        setPaymentLink(quote.stripe_payment_link || '');
                      }}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer Devis
                    </Button>
                  )}
                  {quote.status === 'quoted' && (
                    <Button
                      onClick={() => updateQuoteStatus(quote.id, 'accepted')}
                      variant="outline"
                      className="border-green-500 text-green-400"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marquer Accepté
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{quote.client_email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="text-sm">{quote.client_phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date événement</p>
                    <p className="text-sm">{new Date(quote.event_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ville</p>
                    <p className="text-sm">{quote.event_city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Invités</p>
                    <p className="text-sm">{quote.guests_count} personnes</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="text-sm">{quote.duration_hours}h</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Music2 className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Musiciens</p>
                    <p className="text-sm">{quote.musicians_count}</p>
                  </div>
                </div>

                {quote.quote_amount && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Montant</p>
                      <p className="text-sm font-bold text-amber-400">{quote.quote_amount}€</p>
                    </div>
                  </div>
                )}
              </div>

              {quote.additional_notes && (
                <div className="mt-4 p-3 bg-amber-950/20 rounded-lg border border-amber-700/20">
                  <p className="text-xs text-amber-500/70 mb-1">Notes complémentaires</p>
                  <p className="text-sm text-amber-200/80">{quote.additional_notes}</p>
                </div>
              )}

              {quote.stripe_payment_link && (
                <div className="mt-4">
                  <Button
                    onClick={() => window.open(quote.stripe_payment_link!, '_blank')}
                    variant="outline"
                    className="border-amber-600 text-amber-400"
                  >
                    Voir lien de paiement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {quotes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucune demande de devis pour le moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal d'envoi de devis */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Envoyer un devis à {selectedQuote.client_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Montant du devis (€)</Label>
                <Input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="2500"
                />
              </div>

              <div>
                <Label>Lien de paiement Stripe (optionnel)</Label>
                <Input
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://buy.stripe.com/..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={sendQuote}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600"
                  disabled={!quoteAmount}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le Devis
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedQuote(null);
                    setQuoteAmount('');
                    setPaymentLink('');
                  }}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
