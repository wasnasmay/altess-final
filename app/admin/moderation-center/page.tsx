'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNavigation from '@/components/AdminNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Check, X, Clock, Image as ImageIcon, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ModerationItem {
  id: string;
  type: 'event' | 'partner' | 'address';
  title: string;
  description?: string;
  created_at: string;
  thumbnail?: string;
  location?: string;
  category?: string;
  expires_at?: string;
}

export default function ModerationCenterPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'admin') {
        router.push('/admin');
      }
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadModerationItems();
    }
  }, [user, profile]);

  async function loadModerationItems() {
    try {
      setLoadingData(true);

      const [eventsRes, partnersRes, addressesRes] = await Promise.all([
        supabase
          .from('public_events')
          .select('id, title, description, created_at, image_url, location, event_date, expires_at')
          .eq('moderation_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('partners')
          .select('id, name, description, created_at, logo_url, city, category, expires_at')
          .eq('moderation_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('good_addresses')
          .select('id, name, description, created_at, image_url, city, category, expires_at')
          .eq('moderation_status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      const allItems: ModerationItem[] = [
        ...(eventsRes.data || []).map(e => ({
          id: e.id,
          type: 'event' as const,
          title: e.title,
          description: e.description,
          created_at: e.created_at,
          thumbnail: e.image_url,
          location: e.location,
          expires_at: e.expires_at,
        })),
        ...(partnersRes.data || []).map(p => ({
          id: p.id,
          type: 'partner' as const,
          title: p.name,
          description: p.description,
          created_at: p.created_at,
          thumbnail: p.logo_url,
          location: p.city,
          category: p.category,
          expires_at: p.expires_at,
        })),
        ...(addressesRes.data || []).map(a => ({
          id: a.id,
          type: 'address' as const,
          title: a.name,
          description: a.description,
          created_at: a.created_at,
          thumbnail: a.image_url,
          location: a.city,
          category: a.category,
          expires_at: a.expires_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(allItems);
    } catch (error) {
      console.error('Error loading moderation items:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoadingData(false);
    }
  }

  async function handleApprove(item: ModerationItem) {
    try {
      setProcessing(true);
      const tableName = item.type === 'event' ? 'public_events' : item.type === 'partner' ? 'partners' : 'good_addresses';

      const { error } = await supabase
        .from(tableName)
        .update({
          moderation_status: 'approved',
          moderated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`${item.title} approuvé avec succès`);
      loadModerationItems();
    } catch (error) {
      console.error('Error approving item:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!selectedItem || !rejectReason.trim()) {
      toast.error('Veuillez indiquer un motif de refus');
      return;
    }

    try {
      setProcessing(true);
      const tableName = selectedItem.type === 'event' ? 'public_events' : selectedItem.type === 'partner' ? 'partners' : 'good_addresses';

      const { error } = await supabase
        .from(tableName)
        .update({
          moderation_status: 'rejected',
          moderation_notes: rejectReason,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success(`${selectedItem.title} refusé`);
      setShowRejectDialog(false);
      setSelectedItem(null);
      setRejectReason('');
      loadModerationItems();
    } catch (error) {
      console.error('Error rejecting item:', error);
      toast.error('Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'event':
        return <ImageIcon className="w-5 h-5" />;
      case 'partner':
        return <Users className="w-5 h-5" />;
      case 'address':
        return <MapPin className="w-5 h-5" />;
      default:
        return null;
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'event':
        return 'Événement';
      case 'partner':
        return 'Partenaire';
      case 'address':
        return 'Bonne Adresse';
      default:
        return type;
    }
  }

  function getTypeBadgeColor(type: string) {
    switch (type) {
      case 'event':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'partner':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'address':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  }

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
          <p className="mt-4 text-amber-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <AdminSidebar />
      <div className="ml-16">
        <div className="border-b border-amber-500/20 bg-black/40 backdrop-blur-sm p-4">
          <div className="container mx-auto">
            <AdminNavigation title="Centre de Modération - À Valider" />
          </div>
        </div>

        <div className="container mx-auto p-6">
          {/* Stats Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-400">Total en attente</p>
                    <p className="text-2xl font-bold text-white">{items.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400">Événements</p>
                    <p className="text-2xl font-bold text-white">
                      {items.filter(i => i.type === 'event').length}
                    </p>
                  </div>
                  <ImageIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-400">Partenaires</p>
                    <p className="text-2xl font-bold text-white">
                      {items.filter(i => i.type === 'partner').length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-400">Bonnes Adresses</p>
                    <p className="text-2xl font-bold text-white">
                      {items.filter(i => i.type === 'address').length}
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Moderation Queue */}
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
              <p className="text-zinc-400">Chargement des éléments...</p>
            </div>
          ) : items.length === 0 ? (
            <Card className="bg-black/40 border-amber-500/20">
              <CardContent className="p-12 text-center">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Tout est validé !
                </h3>
                <p className="text-zinc-400">
                  Aucun élément en attente de modération
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {items.map((item) => (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="bg-black/40 border-amber-500/20 hover:border-amber-500/40 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-24 h-24 rounded-lg object-cover border-2 border-amber-500/20"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-zinc-800 flex items-center justify-center border-2 border-amber-500/20">
                            {getTypeIcon(item.type)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-white text-lg">
                            {item.title}
                          </h3>
                          <Badge className={`${getTypeBadgeColor(item.type)} flex items-center gap-1`}>
                            {getTypeIcon(item.type)}
                            {getTypeLabel(item.type)}
                          </Badge>
                        </div>

                        {item.description && (
                          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4 text-xs text-zinc-500">
                          {item.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                            </div>
                          )}
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(item)}
                            disabled={processing}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowRejectDialog(true);
                            }}
                            disabled={processing}
                            variant="outline"
                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-zinc-900 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">
              Refuser {selectedItem?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Motif du refus (sera envoyé au créateur)
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Contenu inapproprié, informations manquantes, qualité insuffisante..."
                className="min-h-[100px] bg-black border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedItem(null);
                setRejectReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
