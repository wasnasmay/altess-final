'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Play } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import AdminNavigation from '@/components/AdminNavigation';

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function DemoVideosAdmin() {
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<DemoVideo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des vidéos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveVideo() {
    try {
      const videoData = {
        title: formData.title,
        description: formData.description,
        video_url: formData.video_url,
        thumbnail_url: formData.thumbnail_url,
        display_order: formData.display_order,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingVideo) {
        const { error } = await supabase
          .from('demo_videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
        toast.success('Vidéo mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('demo_videos')
          .insert([videoData]);

        if (error) throw error;
        toast.success('Vidéo créée avec succès');
      }

      setDialogOpen(false);
      resetForm();
      loadVideos();
    } catch (error: any) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;

    try {
      const { error } = await supabase
        .from('demo_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vidéo supprimée avec succès');
      loadVideos();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('demo_videos')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Vidéo ${!currentStatus ? 'activée' : 'désactivée'}`);
      loadVideos();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  }

  function openEditDialog(video: DemoVideo) {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      display_order: video.display_order,
      is_active: video.is_active,
    });
    setDialogOpen(true);
  }

  function openNewDialog() {
    setEditingVideo(null);
    resetForm();
    setDialogOpen(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      display_order: 0,
      is_active: true,
    });
    setEditingVideo(null);
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
      <AdminNavigation title="Gestion des Vidéos de Démonstration" />
      <div className="flex justify-end items-center mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Vidéo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Modifier la Vidéo' : 'Nouvelle Vidéo'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Orchestre Oriental Complet"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la vidéo"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="video_url">URL de la vidéo (YouTube ou Vimeo)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                  <p className="font-semibold">Formats acceptés :</p>
                  <p className="text-muted-foreground">• YouTube : https://www.youtube.com/watch?v=VIDEO_ID</p>
                  <p className="text-muted-foreground">• YouTube court : https://youtu.be/VIDEO_ID</p>
                  <p className="text-muted-foreground">• Vimeo : https://vimeo.com/VIDEO_ID</p>
                  <p className="text-muted-foreground mt-2">Les vidéos seront automatiquement converties en format embed sécurisé.</p>
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail_url">URL de la miniature</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="display_order">Ordre d&apos;affichage</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Vidéo active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={saveVideo}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{video.title}</CardTitle>
                  <Badge variant={video.is_active ? 'default' : 'secondary'}>
                    {video.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video mb-4 group cursor-pointer">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-black ml-1" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{video.description}</p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(video)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant={video.is_active ? 'secondary' : 'default'}
                  onClick={() => toggleActive(video.id, video.is_active)}
                >
                  {video.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteVideo(video.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
