'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Upload, TrendingUp, DollarSign, Download, AlertCircle, Clock, History, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FinancialData {
  legalName: string;
  headquarters: string;
  vatNumber: string;
  ribFile: string | null;
  vatEnabled: boolean;
  vatRate: number;
  pendingBalance: number;
  lastPayoutDate: string | null;
}

interface Transaction {
  id: string;
  created_at: string;
  transaction_type: string;
  amount: number;
  net_amount: number;
  status: string;
  description: string;
  ticket_purchase: any;
}

export default function OrganizerFinancialModule({ organizerId, organizerIdDb }: { organizerId: string; organizerIdDb: string }) {
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData>({
    legalName: '',
    headquarters: '',
    vatNumber: '',
    ribFile: null,
    vatEnabled: false,
    vatRate: 20,
    pendingBalance: 0,
    lastPayoutDate: null
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    stripeFees: 0,
    netAmount: 0,
    ticketsSold: 0,
    pendingPayouts: 0
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextEventDate, setNextEventDate] = useState<Date | null>(null);
  const [canRequestPayout, setCanRequestPayout] = useState(false);

  useEffect(() => {
    loadFinancialData();
    loadStats();
    loadTransactions();
    checkNextEvent();
  }, [organizerId, organizerIdDb]);

  const checkNextEvent = async () => {
    const { data } = await supabase
      .from('public_events')
      .select('event_date')
      .eq('organizer_id', organizerId)
      .eq('status', 'active')
      .order('event_date', { ascending: true })
      .limit(1)
      .single();

    if (data) {
      const eventDate = new Date(data.event_date);
      setNextEventDate(eventDate);

      const payoutAvailableDate = new Date(eventDate);
      payoutAvailableDate.setHours(payoutAvailableDate.getHours() + 48);

      setCanRequestPayout(new Date() >= payoutAvailableDate);
    }
  };

  const getTimeUntilPayout = () => {
    if (!nextEventDate) return null;

    const payoutDate = new Date(nextEventDate);
    payoutDate.setHours(payoutDate.getHours() + 48);

    const now = new Date();
    const diff = payoutDate.getTime() - now.getTime();

    if (diff <= 0) return 'Disponible maintenant';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}j ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const loadFinancialData = async () => {
    try {
      const { data, error } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('user_id', organizerId)
        .single();

      if (data) {
        setFinancialData({
          legalName: data.legal_name || '',
          headquarters: data.headquarters_address || '',
          vatNumber: data.vat_number || '',
          ribFile: data.rib_url || null,
          vatEnabled: data.vat_enabled || false,
          vatRate: data.vat_rate || 20,
          pendingBalance: data.pending_balance || 0,
          lastPayoutDate: data.last_payout_date
        });
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select('final_amount, service_fee, quantity, customer_first_name, customer_last_name')
        .eq('organizer_id', organizerIdDb)
        .eq('payment_status', 'completed');

      if (data) {
        const totalRevenue = data.reduce((sum, t) => sum + parseFloat(t.final_amount.toString()), 0);
        const stripeFees = totalRevenue * 0.014 + (data.length * 0.25);
        const serviceFees = data.reduce((sum, t) => sum + parseFloat(t.service_fee?.toString() || '0'), 0);
        const ticketsSold = data.reduce((sum, t) => sum + t.quantity, 0);

        setStats({
          totalRevenue,
          stripeFees,
          netAmount: totalRevenue - stripeFees,
          ticketsSold,
          pendingPayouts: 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transaction_history')
        .select(`
          *,
          ticket_purchase:ticket_purchases(customer_first_name, customer_last_name, ticket_tier_name)
        `)
        .eq('organizer_id', organizerIdDb)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const saveFinancialData = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('event_organizers')
        .update({
          legal_name: financialData.legalName,
          headquarters_address: financialData.headquarters,
          vat_number: financialData.vatNumber,
          vat_enabled: financialData.vatEnabled,
          vat_rate: financialData.vatRate
        })
        .eq('user_id', organizerId);

      if (error) throw error;
      alert('Données sauvegardées avec succès');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (!canRequestPayout) {
      alert('Le virement ne sera disponible que 48h après votre événement');
      return;
    }

    if (!financialData.ribFile) {
      alert('Veuillez d\'abord importer votre RIB');
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('transaction_history')
        .insert({
          organizer_id: organizerIdDb,
          transaction_type: 'payout',
          amount: financialData.pendingBalance,
          net_amount: financialData.pendingBalance,
          status: 'pending',
          description: 'Demande de virement bancaire'
        });

      await supabase
        .from('event_organizers')
        .update({
          last_payout_date: new Date().toISOString(),
          pending_balance: 0
        })
        .eq('user_id', organizerId);

      alert('Votre demande de virement a été enregistrée. Vous recevrez les fonds sous 3 à 5 jours ouvrés.');
      loadFinancialData();
      loadTransactions();
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Erreur lors de la demande de virement');
    } finally {
      setLoading(false);
    }
  };

  const handleRibUpload = async (file: File) => {
    try {
      const fileName = `${organizerId}/rib_${Date.now()}.pdf`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      setFinancialData({ ...financialData, ribFile: urlData.publicUrl });

      await supabase
        .from('event_organizers')
        .update({ rib_url: urlData.publicUrl })
        .eq('user_id', organizerId);

      alert('RIB importé avec succès');
    } catch (error) {
      console.error('Error uploading RIB:', error);
      alert('Erreur lors de l\'import du RIB');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800">
          <TabsTrigger value="info" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Building2 className="w-4 h-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Bilan
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <History className="w-4 h-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Informations administratives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white font-semibold flex items-center gap-2">
                  Raison sociale *
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                        <p className="text-sm">Le nom légal de votre entreprise tel qu'il apparaît sur vos documents officiels (Kbis, statuts...)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  value={financialData.legalName}
                  onChange={(e) => setFinancialData({ ...financialData, legalName: e.target.value })}
                  placeholder="SAS EVENT MANAGEMENT"
                  className="bg-black border-gray-700 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-white font-semibold">Adresse du siège social *</Label>
                <Input
                  value={financialData.headquarters}
                  onChange={(e) => setFinancialData({ ...financialData, headquarters: e.target.value })}
                  placeholder="123 Avenue des Entreprises, 75001 Paris"
                  className="bg-black border-gray-700 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-white font-semibold flex items-center gap-2">
                  Numéro de TVA
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                        <p className="text-sm">Votre numéro de TVA intracommunautaire. Format : FR suivi de 11 chiffres. Laissez vide si vous n'êtes pas assujetti à la TVA.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  value={financialData.vatNumber}
                  onChange={(e) => setFinancialData({ ...financialData, vatNumber: e.target.value })}
                  placeholder="FR12345678901"
                  className="bg-black border-gray-700 text-white mt-2"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                <div>
                  <p className="text-white font-semibold flex items-center gap-2">
                    Activer la TVA sur les billets
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="w-4 h-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                          <p className="text-sm">Si activé, la TVA sera automatiquement ajoutée au prix de vente de vos billets. Désactivez si vous n'êtes pas assujetti ou si vos prix incluent déjà la TVA.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-sm text-gray-400">La TVA sera ajoutée au prix de vente</p>
                </div>
                <Switch
                  checked={financialData.vatEnabled}
                  onCheckedChange={(checked) => setFinancialData({ ...financialData, vatEnabled: checked })}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              {financialData.vatEnabled && (
                <div className="animate-in fade-in duration-300">
                  <Label className="text-white font-semibold">Taux de TVA (%)</Label>
                  <Input
                    type="number"
                    value={financialData.vatRate}
                    onChange={(e) => setFinancialData({ ...financialData, vatRate: parseFloat(e.target.value) })}
                    className="bg-black border-gray-700 text-white mt-2"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}

              <div>
                <Label className="text-white font-semibold mb-2 block flex items-center gap-2">
                  RIB (Relevé d'Identité Bancaire)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                        <p className="text-sm">Document bancaire contenant votre IBAN et BIC. Obligatoire pour recevoir vos virements. Formats acceptés : PDF, JPG, PNG.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                {financialData.ribFile ? (
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">RIB importé</p>
                      <p className="text-sm text-gray-400">Cliquez pour télécharger</p>
                    </div>
                    <Button
                      onClick={() => window.open(financialData.ribFile!, '_blank')}
                      variant="outline"
                      size="sm"
                      className="border-green-500/30 text-green-400"
                    >
                      Voir
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRibUpload(file);
                      }}
                      className="hidden"
                      id="rib-upload"
                    />
                    <label htmlFor="rib-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-white font-semibold mb-1">Importez votre RIB</p>
                      <p className="text-sm text-gray-400">PDF, JPG ou PNG (max 5MB)</p>
                    </label>
                  </div>
                )}
              </div>

              <Button
                onClick={saveFinancialData}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:from-amber-500 hover:to-amber-700"
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder les informations'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Recettes brutes</p>
                    <p className="text-2xl font-bold text-white">{stats.totalRevenue.toFixed(2)}€</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{stats.ticketsSold} billets vendus</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Frais Stripe</p>
                    <p className="text-2xl font-bold text-white">-{stats.stripeFees.toFixed(2)}€</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">1.4% + 0.25€ par transaction</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Montant net</p>
                    <p className="text-2xl font-bold text-green-400">{stats.netAmount.toFixed(2)}€</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Disponible
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Demande de virement
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {canRequestPayout
                      ? 'Vos fonds sont disponibles pour retrait'
                      : `Fonds disponibles 48h après l'événement`
                    }
                  </p>
                </div>
                {!canRequestPayout && getTimeUntilPayout() && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-400">{getTimeUntilPayout()}</div>
                    <p className="text-xs text-gray-500">restantes</p>
                  </div>
                )}
              </div>

              <Button
                onClick={requestPayout}
                disabled={!canRequestPayout || loading}
                className={`w-full ${
                  canRequestPayout
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canRequestPayout ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Demander mon virement ({financialData.pendingBalance.toFixed(2)}€)
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Virement différé - En attente
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Détail du calcul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Recettes totales</span>
                  <span className="text-white font-bold">{stats.totalRevenue.toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Frais de paiement Stripe</span>
                  <span className="text-red-400 font-bold">-{stats.stripeFees.toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between py-3 pt-4 border-t-2 border-amber-500/30">
                  <span className="text-white font-bold text-lg">Montant à reverser</span>
                  <span className="text-2xl font-bold text-amber-400">{stats.netAmount.toFixed(2)}€</span>
                </div>
              </div>

              <Button className="w-full mt-6 bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:from-amber-500 hover:to-amber-700">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le rapport financier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="animate-in fade-in duration-500">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                Historique des transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">Aucune transaction enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="bg-black border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.transaction_type === 'sale'
                                  ? 'bg-green-500/20'
                                  : transaction.transaction_type === 'refund'
                                  ? 'bg-red-500/20'
                                  : 'bg-blue-500/20'
                              }`}>
                                {transaction.transaction_type === 'sale' ? (
                                  <TrendingUp className="w-5 h-5 text-green-400" />
                                ) : transaction.transaction_type === 'refund' ? (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                ) : (
                                  <DollarSign className="w-5 h-5 text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-semibold">
                                  {transaction.ticket_purchase
                                    ? `${transaction.ticket_purchase.customer_first_name} ${transaction.ticket_purchase.customer_last_name}`
                                    : transaction.description
                                  }
                                </p>
                                <p className="text-sm text-gray-400">
                                  {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              transaction.transaction_type === 'sale'
                                ? 'text-green-400'
                                : transaction.transaction_type === 'refund'
                                ? 'text-red-400'
                                : 'text-blue-400'
                            }`}>
                              {transaction.transaction_type === 'refund' ? '-' : '+'}
                              {transaction.net_amount.toFixed(2)}€
                            </p>
                            <Badge className={
                              transaction.status === 'completed'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : transaction.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }>
                              {transaction.status === 'completed' ? 'Payé' :
                               transaction.status === 'pending' ? 'En cours' : 'Remboursé'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
