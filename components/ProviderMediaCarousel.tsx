'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Image, Video, Trash2, Edit, Eye, EyeOff, GripVertical, Youtube, Download } from 'lucide-react';

type MediaItem = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export default function ProviderMediaCarousel({ partnerId }: { partnerId: string }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [formData, setFormData] = useState({
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    title: '',
    description: '',
  });

  useEffect(() => {
    loadMedia();
  }, [partnerId]);

  async function loadMedia() {
    try {
      const { data, error } = await supabase
        .from('partner_media_carousel')
        .select('*')
        .eq('partner_id', partnerId)
        .order('display_order');

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Erreur lors du chargement des médias');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMedia() {
    if (!formData.media_url) {
      toast.error('L\'URL du média est requise');
      return;
    }

    try {
      if (editingMedia) {
        const { error } = await supabase
          .from('partner_media_carousel')
          .update({
            media_url: formData.media_url,
            media_type: formData.media_type,
            title: formData.title || null,
            description: formData.description || null,
          })
          .eq('id', editingMedia.id);

        if (error) throw error;
        toast.success('Média mis à jour');
      } else {
        const maxOrder = media.length > 0 ? Math.max(...media.map(m => m.display_order)) : 0;
        const { error } = await supabase
          .from('partner_media_carousel')
          .insert({
            partner_id: partnerId,
            media_url: formData.media_url,
            media_type: formData.media_type,
            title: formData.title || null,
            description: formData.description || null,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Média ajouté');
      }

      setShowAddDialog(false);
      setEditingMedia(null);
      setFormData({ media_url: '', media_type: 'image', title: '', description: '' });
      loadMedia();
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  }

  async function handleDeleteMedia(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) return;

    try {
      const { error } = await supabase
        .from('partner_media_carousel')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Média supprimé');
      loadMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function toggleActiveStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('partner_media_carousel')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Média masqué' : 'Média visible');
      loadMedia();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  function openEditDialog(item: MediaItem) {
    setEditingMedia(item);
    setFormData({
      media_url: item.media_url,
      media_type: item.media_type,
      title: item.title || '',
      description: item.description || '',
    });
    setShowAddDialog(true);
  }

  function closeDialog() {
    setShowAddDialog(false);
    setEditingMedia(null);
    setFormData({ media_url: '', media_type: 'image', title: '', description: '' });
  }

  function extractYouTubeId(url: string): string | null {
    if (!url) return null;

    // Nettoyer l'URL
    const cleanUrl = url.trim();

    // Pattern 1: youtube.com/watch?v=VIDEO_ID
    const watchMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // Pattern 2: youtu.be/VIDEO_ID
    const shortMatch = cleanUrl.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // Pattern 3: youtube.com/embed/VIDEO_ID
    const embedMatch = cleanUrl.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // Pattern 4: youtube.com/v/VIDEO_ID
    const vMatch = cleanUrl.match(/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    if (vMatch) return vMatch[1];

    // Pattern 5: Iframe complet <iframe src="...">
    const iframeMatch = cleanUrl.match(/src=["']?[^"']*\/embed\/([a-zA-Z0-9_-]{11})/i);
    if (iframeMatch) return iframeMatch[1];

    // Pattern 6: ID direct (11 caractères)
    const directMatch = cleanUrl.match(/^([a-zA-Z0-9_-]{11})$/);
    if (directMatch) return directMatch[1];

    // Pattern 7: URL avec paramètres supplémentaires
    const paramsMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (paramsMatch) return paramsMatch[1];

    return null;
  }

  async function handleImportYouTubeMetadata() {
    if (!formData.media_url) {
      toast.error('Veuillez d\'abord entrer une URL YouTube');
      return;
    }

    console.log('🔍 Extraction des métadonnées YouTube...');
    toast.info('🔍 Récupération des informations YouTube...');

    try {
      const response = await fetch('/api/youtube/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.media_url }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Métadonnées récupérées:', data.title);

        setFormData({
          ...formData,
          media_url: data.embedUrl,
          title: data.title,
          description: data.description || formData.description,
        });

        toast.success('✅ Informations YouTube importées avec succès !');
      } else {
        throw new Error(data.error || 'Échec de la récupération');
      }
    } catch (e) {
      console.error('❌ Erreur lors de l\'import:', e);
      toast.error('Erreur lors de la récupération des informations');

      const videoId = extractYouTubeId(formData.media_url);
      if (videoId) {
        const cleanUrl = `https://www.youtube.com/embed/${videoId}`;
        setFormData({
          ...formData,
          media_url: cleanUrl,
          title: formData.title || `Vidéo YouTube ${videoId}`,
        });
      }
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-amber-400">Carrousel Médias</CardTitle>
            <CardDescription className="text-slate-400">Gérez les images et vidéos de votre mini-site</CardDescription>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un média
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun média dans le carrousel</p>
            <p className="text-sm mt-2">Ajoutez des images ou vidéos pour enrichir votre profil</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item) => (
              <Card key={item.id} className="group relative overflow-hidden bg-black/40 border-amber-500/20">
                <div className="aspect-video relative overflow-hidden bg-slate-900">
                  {item.media_type === 'image' ? (
                    <img
                      src={item.media_url}
                      alt={item.title || 'Média'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                      <Video className="w-12 h-12 text-amber-400" />
                    </div>
                  )}
                  {!item.is_active && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <EyeOff className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-white mb-1 line-clamp-1">
                    {item.title || 'Sans titre'}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{item.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActiveStatus(item.id, item.is_active)}
                      className="flex-1 border-amber-500/30 hover:border-amber-500/50"
                    >
                      {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(item)}
                      className="flex-1 border-amber-500/30 hover:border-amber-500/50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMedia(item.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={closeDialog}>
          <DialogContent className="max-w-2xl bg-slate-900 border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="text-amber-400">
                {editingMedia ? 'Modifier le média' : 'Ajouter un média'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Ajoutez une image ou une vidéo à votre carrousel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="media_type" className="text-white">Type de média</Label>
                <Select
                  value={formData.media_type}
                  onValueChange={(value: 'image' | 'video') => setFormData({ ...formData, media_type: value })}
                >
                  <SelectTrigger className="bg-black/40 border-amber-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="media_url" className="text-white">URL du média *</Label>
                <Input
                  id="media_url"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder={formData.media_type === 'video' ? 'https://www.youtube.com/watch?v=... ou youtu.be/...' : 'https://...'}
                  className="bg-black/40 border-amber-500/30 text-white"
                />
                <p className="text-xs text-amber-400/70">
                  Cliquez sur le bouton pour récupérer automatiquement les infos (titre, durée, miniature)
                </p>
                {formData.media_type === 'video' && formData.media_url && (
                  <Button
                    type="button"
                    onClick={handleImportYouTubeMetadata}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Importer Automatiquement (Titre, Miniature, Durée)
                  </Button>
                )}
              </div>
              <div>
                <Label htmlFor="title" className="text-white">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre du média"
                  className="bg-black/40 border-amber-500/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du média"
                  rows={3}
                  className="bg-black/40 border-amber-500/30 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} className="border-amber-500/30">
                Annuler
              </Button>
              <Button onClick={handleSaveMedia} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500">
                {editingMedia ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
