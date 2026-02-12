'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Music2, Save, X, Play, Pause, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

type AudioTrack = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  album: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export default function OrientaleMusiqueAudioAdminPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyTrack: Omit<AudioTrack, 'id' | 'created_at'> = {
    title: '',
    artist: 'Orientale Musique',
    audio_url: '',
    cover_image_url: null,
    duration_seconds: 0,
    album: null,
    display_order: 0,
    is_active: true,
  };

  useEffect(() => {
    checkAuth();
    loadTracks();
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

  async function loadTracks() {
    try {
      const { data, error } = await supabase
        .from('orientale_musique_audio_tracks')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error loading tracks:', error);
      toast.error('Erreur lors du chargement des pistes audio');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(track: Partial<AudioTrack>) {
    try {
      if (editingTrack && editingTrack.id) {
        const { error } = await supabase
          .from('orientale_musique_audio_tracks')
          .update(track)
          .eq('id', editingTrack.id);

        if (error) throw error;
        toast.success('Piste audio mise à jour');
      } else {
        const { error } = await supabase
          .from('orientale_musique_audio_tracks')
          .insert([{ ...track, display_order: tracks.length }]);

        if (error) throw error;
        toast.success('Piste audio créée');
      }

      setEditingTrack(null);
      setIsCreating(false);
      loadTracks();
    } catch (error) {
      console.error('Error saving track:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette piste audio ?')) return;

    try {
      const { error } = await supabase
        .from('orientale_musique_audio_tracks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Piste audio supprimée');
      loadTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const currentIndex = tracks.findIndex(t => t.id === id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === tracks.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newTracks = [...tracks];
    [newTracks[currentIndex], newTracks[newIndex]] = [newTracks[newIndex], newTracks[currentIndex]];

    try {
      const updates = newTracks.map((track, index) =>
        supabase
          .from('orientale_musique_audio_tracks')
          .update({ display_order: index })
          .eq('id', track.id)
      );

      await Promise.all(updates);
      setTracks(newTracks);
      toast.success('Ordre mis à jour');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Erreur lors du réordonnancement');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Music2 className="w-8 h-8 text-amber-500" />
            Gestion Audio - Orientale Musique
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérer les pistes audio du lecteur premium
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTrack({ ...emptyTrack, id: '', created_at: '' } as AudioTrack);
            setIsCreating(true);
          }}
          className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une piste
        </Button>
      </div>

      {/* Formulaire d'édition/création */}
      {(editingTrack || isCreating) && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-background">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{isCreating ? 'Nouvelle piste audio' : 'Modifier la piste'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingTrack(null);
                  setIsCreating(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Titre du morceau</Label>
                <Input
                  value={editingTrack?.title || ''}
                  onChange={(e) => setEditingTrack(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Ex: Laylat Hob"
                />
              </div>

              <div>
                <Label>Artiste</Label>
                <Input
                  value={editingTrack?.artist || ''}
                  onChange={(e) => setEditingTrack(prev => prev ? { ...prev, artist: e.target.value } : null)}
                  placeholder="Ex: Orientale Musique"
                />
              </div>

              <div>
                <Label>URL Audio (MP3)</Label>
                <Input
                  value={editingTrack?.audio_url || ''}
                  onChange={(e) => setEditingTrack(prev => prev ? { ...prev, audio_url: e.target.value } : null)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>URL Image de couverture</Label>
                <Input
                  value={editingTrack?.cover_image_url || ''}
                  onChange={(e) => setEditingTrack(prev => prev ? { ...prev, cover_image_url: e.target.value } : null)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Album</Label>
                <Input
                  value={editingTrack?.album || ''}
                  onChange={(e) => setEditingTrack(prev => prev ? { ...prev, album: e.target.value } : null)}
                  placeholder="Ex: Collection Prestige"
                />
              </div>

              <div>
                <Label>Durée (secondes)</Label>
                <Input
                  type="number"
                  value={editingTrack?.duration_seconds || 0}
                  onChange={(e) => setEditingTrack(prev => prev ? { ...prev, duration_seconds: parseInt(e.target.value) } : null)}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={editingTrack?.is_active || false}
                  onCheckedChange={(checked) => setEditingTrack(prev => prev ? { ...prev, is_active: checked } : null)}
                />
                <Label>Piste active</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSave(editingTrack!)}
                className="bg-gradient-to-r from-amber-600 to-yellow-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTrack(null);
                  setIsCreating(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des pistes */}
      <div className="grid gap-4">
        {tracks.map((track, index) => (
          <Card key={track.id} className="border-amber-700/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReorder(track.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReorder(track.id, 'down')}
                    disabled={index === tracks.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={track.cover_image_url || '/image_(4).png'}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-amber-200">{track.title}</h3>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                  {track.album && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {track.album}
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {Math.floor(track.duration_seconds / 60)}:{(track.duration_seconds % 60).toString().padStart(2, '0')}
                </div>

                <Badge variant={track.is_active ? 'default' : 'secondary'}>
                  {track.is_active ? 'Actif' : 'Inactif'}
                </Badge>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTrack(track)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(track.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {tracks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Music2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucune piste audio. Commencez par en ajouter une.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
