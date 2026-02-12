'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, MousePointer, TrendingUp, CheckCircle, XCircle, Edit, DollarSign, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminNavigation from '@/components/AdminNavigation';

type Ad = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  placement: string;
  content_type: string;
  price: number;
  billing_period: string;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  status: string;
  is_paid: boolean;
  advertiser_id: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-orange-500',
  active: 'bg-green-500',
  paused: 'bg-gray-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    try {
      const { data, error } = await supabase
        .from('premium_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error loading ads:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(adId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('premium_ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;
      toast.success('Statut mis à jour');
      loadAds();
      if (selectedAd?.id === adId) {
        setSelectedAd({ ...selectedAd, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function handleTogglePaid(adId: string, isPaid: boolean) {
    try {
      const { error } = await supabase
        .from('premium_ads')
        .update({ is_paid: !isPaid })
        .eq('id', adId);

      if (error) throw error;
      toast.success(isPaid ? 'Marqué comme non payé' : 'Marqué comme payé');
      loadAds();
      if (selectedAd?.id === adId) {
        setSelectedAd({ ...selectedAd, is_paid: !isPaid });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  function openDetailDialog(ad: Ad) {
    setSelectedAd(ad);
    setShowDetailDialog(true);
  }

  const filteredAds = activeTab === 'all' ? ads : ads.filter(a => a.status === activeTab);

  const stats = {
    total: ads.length,
    pending: ads.filter(a => a.status === 'pending').length,
    active: ads.filter(a => a.status === 'active').length,
    totalImpressions: ads.reduce((sum, a) => sum + a.impressions, 0),
    totalClicks: ads.reduce((sum, a) => sum + a.clicks, 0),
    totalRevenue: ads.filter(a => a.is_paid).reduce((sum, a) => sum + a.price, 0),
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <AdminNavigation title="Publicités" />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-amber-400" />
            Gestion des Publicités
          </h1>
          <p className="text-slate-400">Administration des campagnes publicitaires premium</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <Sparkles className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-white">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Actives</p>
                  <p className="text-3xl font-bold text-white">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Impressions</p>
                  <p className="text-3xl font-bold text-white">{stats.totalImpressions.toLocaleString()}</p>
                </div>
                <Eye className="w-12 h-12 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Clics</p>
                  <p className="text-3xl font-bold text-white">{stats.totalClicks}</p>
                </div>
                <MousePointer className="w-12 h-12 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border-green-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Revenus</p>
                  <p className="text-3xl font-bold text-white">{stats.totalRevenue}€</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-400">Toutes les Publicités</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-6 bg-black/40">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="active">Actives</TabsTrigger>
                <TabsTrigger value="paused">Pause</TabsTrigger>
                <TabsTrigger value="completed">Terminées</TabsTrigger>
                <TabsTrigger value="cancelled">Annulées</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredAds.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">Aucune publicité dans cette catégorie</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAds.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0';
                  return (
                    <Card
                      key={ad.id}
                      className="bg-black/40 border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
                      onClick={() => openDetailDialog(ad)}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {ad.image_url && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-white mb-1">{ad.title}</h3>
                                <p className="text-sm text-slate-400">{ad.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={statusColors[ad.status]}>
                                  {ad.status === 'pending' ? 'En attente' : ad.status === 'active' ? 'Active' : ad.status === 'paused' ? 'Pause' : ad.status === 'completed' ? 'Terminée' : 'Annulée'}
                                </Badge>
                                {ad.is_paid && <Badge className="bg-green-600">Payée</Badge>}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500">Prix</p>
                                <p className="font-medium text-white">{ad.price}€</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Période</p>
                                <p className="font-medium text-white">
                                  {format(new Date(ad.start_date), 'dd/MM')} - {format(new Date(ad.end_date), 'dd/MM')}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Impressions</p>
                                <p className="font-medium text-white">{ad.impressions.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Clics</p>
                                <p className="font-medium text-white">{ad.clicks}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">CTR</p>
                                <p className="font-medium text-white">{ctr}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl bg-slate-900 border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="text-amber-400 text-2xl">{selectedAd?.title}</DialogTitle>
              <DialogDescription className="text-slate-400">Détails de la campagne publicitaire</DialogDescription>
            </DialogHeader>

            {selectedAd && (
              <div className="space-y-6 py-4">
                {selectedAd.image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img src={selectedAd.image_url} alt={selectedAd.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Description</Label>
                    <p className="text-white">{selectedAd.description}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Lien</Label>
                    <a href={selectedAd.link_url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 break-all">
                      {selectedAd.link_url}
                    </a>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Prix</Label>
                    <p className="text-white font-bold">{selectedAd.price}€</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Statut de paiement</Label>
                    <Badge className={selectedAd.is_paid ? 'bg-green-600' : 'bg-red-600'}>
                      {selectedAd.is_paid ? 'Payée' : 'Non payée'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 p-4 bg-black/40 rounded-lg">
                  <div className="text-center">
                    <Eye className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                    <p className="text-2xl font-bold text-white">{selectedAd.impressions.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Impressions</p>
                  </div>
                  <div className="text-center">
                    <MousePointer className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                    <p className="text-2xl font-bold text-white">{selectedAd.clicks}</p>
                    <p className="text-xs text-slate-400">Clics</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
                    <p className="text-2xl font-bold text-white">
                      {selectedAd.impressions > 0 ? ((selectedAd.clicks / selectedAd.impressions) * 100).toFixed(2) : '0'}%
                    </p>
                    <p className="text-xs text-slate-400">CTR</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-2xl font-bold text-white">{selectedAd.price}€</p>
                    <p className="text-xs text-slate-400">Valeur</p>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Changer le statut</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleUpdateStatus(selectedAd.id, 'active')}
                      disabled={selectedAd.status === 'active'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedAd.id, 'paused')}
                      disabled={selectedAd.status === 'paused'}
                      variant="outline"
                      className="border-amber-500/30"
                    >
                      Mettre en pause
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedAd.id, 'cancelled')}
                      disabled={selectedAd.status === 'cancelled'}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>

                <div>
                  <Button
                    onClick={() => handleTogglePaid(selectedAd.id, selectedAd.is_paid)}
                    variant="outline"
                    className="w-full border-amber-500/30"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {selectedAd.is_paid ? 'Marquer comme non payée' : 'Marquer comme payée'}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="border-amber-500/30">
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
