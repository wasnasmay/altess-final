'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TickerMessage = {
  id: string;
  message: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  display_duration_seconds: number;
  created_at: string;
};

export default function AdvertisingTickerAdmin() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickers, setTickers] = useState<TickerMessage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState<TickerMessage | null>(null);
  const [formData, setFormData] = useState({
    message: '',
    background_color: 'rgba(0, 0, 0, 0.9)',
    text_color: '#FFFFFF',
    is_active: true,
    priority: 5,
    start_date: '',
    end_date: '',
    display_duration_seconds: 30,
  });

  useEffect(() => {
    checkAuth();
    loadTickers();
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
    }
  }

  async function loadTickers() {
    try {
      const { data, error } = await supabase
        .from('advertising_tickers')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setTickers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tickers:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    console.log('📋 HANDLESUBMIT APPELÉ!', {
      event: e.type,
      submitting,
      formData
    });

    e.preventDefault();
    e.stopPropagation();

    if (submitting) {
      console.log('⏸️ Déjà en cours de soumission');
      return;
    }

    setSubmitting(true);
    console.log('🚀 Début du submit, formData:', formData);

    try {
      // Vérifier l'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Pas de session');
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Session OK:', session.user.id);

      // Vérifier le rôle admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      console.log('👤 Profil:', profile);

      if (profile?.role !== 'admin') {
        console.error('❌ Pas admin');
        toast({
          title: 'Erreur',
          description: 'Vous devez être administrateur',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Admin confirmé');

      if (editingTicker) {
        console.log('📝 Mise à jour du ticker:', editingTicker.id);
        const { error } = await supabase
          .from('advertising_tickers')
          .update(formData)
          .eq('id', editingTicker.id);

        if (error) {
          console.error('❌ Erreur update:', error);
          throw error;
        }

        console.log('✅ Ticker mis à jour');
        toast({
          title: 'Succès',
          description: 'Message modifié avec succès',
        });
      } else {
        console.log('➕ Création du ticker');
        const { data, error } = await supabase
          .from('advertising_tickers')
          .insert([formData])
          .select();

        if (error) {
          console.error('❌ Erreur insert:', error);
          throw error;
        }

        console.log('✅ Ticker créé:', data);
        toast({
          title: 'Succès',
          description: 'Message créé avec succès',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadTickers();
    } catch (error: any) {
      console.error('💥 Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: error?.message || 'Impossible de sauvegarder le message',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      const { error } = await supabase
        .from('advertising_tickers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Message supprimé avec succès',
      });

      loadTickers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le message',
        variant: 'destructive',
      });
    }
  }

  async function toggleActive(ticker: TickerMessage) {
    try {
      const { error } = await supabase
        .from('advertising_tickers')
        .update({ is_active: !ticker.is_active })
        .eq('id', ticker.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: ticker.is_active ? 'Message désactivé' : 'Message activé',
      });

      loadTickers();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  }

  function resetForm() {
    setFormData({
      message: '',
      background_color: 'rgba(0, 0, 0, 0.9)',
      text_color: '#FFFFFF',
      is_active: true,
      priority: 5,
      start_date: '',
      end_date: '',
      display_duration_seconds: 30,
    });
    setEditingTicker(null);
  }

  function handleEdit(ticker: TickerMessage) {
    setEditingTicker(ticker);
    setFormData({
      message: ticker.message,
      background_color: ticker.background_color,
      text_color: ticker.text_color,
      is_active: ticker.is_active,
      priority: ticker.priority,
      start_date: ticker.start_date || '',
      end_date: ticker.end_date || '',
      display_duration_seconds: ticker.display_duration_seconds,
    });
    setIsDialogOpen(true);
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Radio className="w-10 h-10 text-amber-500" />
              Bandeau Publicitaire
            </h1>
            <p className="text-muted-foreground">
              Gérez les messages défilants affichés sous le lecteur TV/Radio
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTicker ? 'Modifier le Message' : 'Nouveau Message'}
                </DialogTitle>
              </DialogHeader>

              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500 rounded">
                <Button
                  type="button"
                  onClick={() => {
                    console.log('✅ TEST BUTTON WORKS!');
                    alert('Le bouton de test fonctionne! Le problème est ailleurs.');
                  }}
                  className="bg-blue-500 hover:bg-blue-600 w-full"
                >
                  🧪 Bouton Test - Cliquez ici pour vérifier
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => {
                console.log('🖱️ Click sur form:', e.target);
              }}>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => {
                      console.log('✏️ Changement message:', e.target.value);
                      setFormData({ ...formData, message: e.target.value });
                    }}
                    placeholder="📺 Bienvenue chez vous, bienvenue sur Altess • Profitez dès maintenant d'une sélection unique de chaînes et de contenus variés conçus pour vous • Votre fenêtre sur le monde commence ici."
                    required
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="background_color">Couleur de Fond</Label>
                    <div className="flex gap-2">
                      <Input
                        id="background_color"
                        type="text"
                        value={formData.background_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            background_color: e.target.value,
                          })
                        }
                        placeholder="rgba(0, 0, 0, 0.9)"
                      />
                      <div
                        className="w-12 h-10 rounded border border-border"
                        style={{ backgroundColor: formData.background_color }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="text_color">Couleur du Texte</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text_color"
                        type="text"
                        value={formData.text_color}
                        onChange={(e) =>
                          setFormData({ ...formData, text_color: e.target.value })
                        }
                        placeholder="#FFFFFF"
                      />
                      <div
                        className="w-12 h-10 rounded border border-border"
                        style={{ backgroundColor: formData.text_color }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priorité (0-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      max="10"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Durée Affichage (secondes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="10"
                      max="120"
                      value={formData.display_duration_seconds}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_duration_seconds: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de Début (optionnel)</Label>
                    <Input
                      id="start_date"
                      type="text"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      placeholder="jj/mm/aaaa"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">Date de Fin (optionnel)</Label>
                    <Input
                      id="end_date"
                      type="text"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      placeholder="jj/mm/aaaa"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Actif</Label>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t relative z-10">
                  {/* Bouton alternatif pour contourner le problème */}
                  <Button
                    type="button"
                    disabled={submitting}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 text-lg w-full"
                    onClick={async (e) => {
                      console.log('🟢 BOUTON ALTERNATIF CLIQUÉ');
                      e.preventDefault();
                      // Simuler l'événement de formulaire
                      const fakeEvent = {
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        type: 'submit'
                      } as React.FormEvent;
                      await handleSubmit(fakeEvent);
                    }}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {editingTicker ? 'Modification...' : 'Création...'}
                      </span>
                    ) : (
                      `⚡ ${editingTicker ? 'MODIFIER LE MESSAGE' : 'CRÉER LE MESSAGE'}`
                    )}
                  </Button>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        console.log('🚫 Annuler cliqué');
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      disabled={submitting}
                      className="px-6 py-3"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 text-lg relative z-20 cursor-pointer"
                      style={{ pointerEvents: submitting ? 'none' : 'auto' }}
                      onClick={(e) => {
                        console.log('🔘 CLICK DÉTECTÉ sur le bouton Créer!', {
                          submitting,
                          disabled: submitting,
                          type: e.type,
                          button: e.button,
                          currentTarget: e.currentTarget,
                          defaultPrevented: e.defaultPrevented
                        });
                      }}
                      onMouseEnter={() => console.log('🖱️ Souris sur le bouton')}
                      onMouseLeave={() => console.log('🖱️ Souris quitte le bouton')}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                          {editingTicker ? 'Modification...' : 'Création...'}
                        </span>
                      ) : (
                        editingTicker ? 'Modifier' : 'Créer'
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    💡 Si le bouton jaune ne répond pas, utilisez le bouton vert ci-dessus
                  </p>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {tickers.map((ticker) => (
              <Card key={ticker.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {ticker.message}
                        </CardTitle>
                        {ticker.is_active ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                        <Badge variant="outline">Priorité: {ticker.priority}</Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Durée: {ticker.display_duration_seconds}s</span>
                        {ticker.start_date && (
                          <span>Début: {new Date(ticker.start_date).toLocaleDateString()}</span>
                        )}
                        {ticker.end_date && (
                          <span>Fin: {new Date(ticker.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleActive(ticker)}
                      >
                        {ticker.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(ticker)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(ticker.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden">
                    <div
                      className="p-3 flex items-center"
                      style={{
                        backgroundColor: ticker.background_color,
                        color: ticker.text_color,
                      }}
                    >
                      <div className="ticker-preview whitespace-nowrap animate-ticker">
                        {ticker.message}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {tickers.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Radio className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucun message publicitaire configuré
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes ticker {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .ticker-preview {
          animation: ticker 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
