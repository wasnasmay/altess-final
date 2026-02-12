'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Video,
  Image as ImageIcon,
  Smartphone,
  GripVertical,
  Save,
  Sparkles
} from 'lucide-react';

interface VideoItem {
  id: string;
  video_url: string;
  platform: string;
  title: string | null;
  duration: number;
  is_active: boolean;
}

interface PhotoItem {
  id: string;
  photo_url: string;
  display_order: number;
  is_active: boolean;
  caption: string | null;
}

interface ProviderMediaManagerProps {
  providerId: string;
}

export default function ProviderMediaManager({ providerId }: ProviderMediaManagerProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [newVideo, setNewVideo] = useState({
    video_url: '',
    platform: 'instagram',
    title: '',
    duration: 30
  });

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    try {
      const [videosRes, photosRes, profileRes] = await Promise.all([
        supabase
          .from('provider_social_videos')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false }),
        supabase
          .from('provider_photo_gallery')
          .select('*')
          .eq('provider_id', providerId)
          .order('display_order', { ascending: true }),
        supabase
          .from('profiles')
          .select('whatsapp_number')
          .eq('id', providerId)
          .maybeSingle()
      ]);

      if (videosRes.data) setVideos(videosRes.data);
      if (photosRes.data) setPhotos(photosRes.data);
      if (profileRes.data?.whatsapp_number) setWhatsappNumber(profileRes.data.whatsapp_number);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_number: whatsappNumber })
        .eq('id', providerId);

      if (error) throw error;

      toast.success('Numéro WhatsApp enregistré !');
    } catch (error) {
      console.error('Error saving WhatsApp:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleAddVideo = async () => {
    if (!newVideo.video_url) {
      toast.error('Veuillez entrer une URL de vidéo');
      return;
    }

    try {
      const { error } = await supabase
        .from('provider_social_videos')
        .insert({
          provider_id: providerId,
          video_url: newVideo.video_url,
          platform: newVideo.platform,
          title: newVideo.title || null,
          duration: newVideo.duration
        });

      if (error) throw error;

      toast.success('Vidéo ajoutée avec succès !');
      setShowVideoDialog(false);
      setNewVideo({ video_url: '', platform: 'instagram', title: '', duration: 30 });
      loadData();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleToggleVideo = async (videoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('provider_social_videos')
        .update({ is_active: !isActive })
        .eq('id', videoId);

      if (error) throw error;

      toast.success(`Vidéo ${!isActive ? 'activée' : 'désactivée'}`);
      loadData();
    } catch (error) {
      console.error('Error toggling video:', error);
      toast.error('Erreur');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('provider_social_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast.success('Vidéo supprimée');
      loadData();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (photos.length >= 10) {
      toast.error('Maximum 10 photos autorisées');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${providerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('provider-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('provider_photo_gallery')
        .insert({
          provider_id: providerId,
          photo_url: publicUrl,
          display_order: photos.length
        });

      if (insertError) throw insertError;

      toast.success('Photo ajoutée !');
      loadData();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTogglePhoto = async (photoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('provider_photo_gallery')
        .update({ is_active: !isActive })
        .eq('id', photoId);

      if (error) throw error;

      toast.success(`Photo ${!isActive ? 'activée' : 'désactivée'}`);
      loadData();
    } catch (error) {
      console.error('Error toggling photo:', error);
      toast.error('Erreur');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('provider_photo_gallery')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast.success('Photo supprimée');
      loadData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border-amber-600/30">
        <CardHeader>
          <CardTitle className="text-lg font-light text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-600" />
            Configuration WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-gray-300 text-sm">
                Numéro WhatsApp (format international)
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+33612345678"
                  className="bg-zinc-900 border-zinc-800 text-white flex-1"
                />
                <Button
                  onClick={handleSaveWhatsApp}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Ce numéro sera utilisé pour les contacts depuis votre fiche publique et le smartphone doré
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList className="bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger value="videos" className="data-[state=active]:bg-amber-600 data-[state=active]:text-black">
            <Video className="w-4 h-4 mr-2" />
            Vidéos Sociales
          </TabsTrigger>
          <TabsTrigger value="photos" className="data-[state=active]:bg-amber-600 data-[state=active]:text-black">
            <ImageIcon className="w-4 h-4 mr-2" />
            Galerie Photos
            <Badge variant="secondary" className="ml-2 bg-amber-600/20 text-amber-600">
              {photos.length}/10
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-light text-white">
                  Mes Vidéos
                </CardTitle>
                <Button
                  onClick={() => setShowVideoDialog(true)}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une vidéo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune vidéo ajoutée</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className={`p-3 bg-black/30 rounded-lg border ${
                        video.is_active ? 'border-amber-600/30' : 'border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {video.title || 'Vidéo sans titre'}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {video.platform} • {video.duration}s
                          </div>
                        </div>
                        <Badge
                          variant={video.is_active ? 'default' : 'secondary'}
                          className={video.is_active ? 'bg-green-500' : ''}
                        >
                          {video.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mb-3 break-all">
                        {video.video_url.substring(0, 50)}...
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleVideo(video.id, video.is_active)}
                          className="flex-1 text-xs"
                        >
                          {video.is_active ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                          {video.is_active ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-600/10 to-transparent border-purple-600/30">
            <CardHeader>
              <CardTitle className="text-base font-light text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Auto-Diaporama Intelligent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Ajoutez jusqu'à 10 photos qui seront automatiquement transformées en vidéo verticale 9:16
                pour diffusion dans "L'Heure des Réseaux Sociaux"
              </p>
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      photo.is_active ? 'border-purple-600/50' : 'border-zinc-800'
                    }`}
                  >
                    <img
                      src={photo.photo_url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePhoto(photo.id, photo.is_active)}
                        className="bg-black/50 border-white/30"
                      >
                        {photo.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="bg-red-500/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className={photo.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}

                {photos.length < 10 && (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-purple-600/50 transition-colors bg-black/30">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                    {uploadingPhoto ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Ajouter une photo</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {10 - photos.length} restantes
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {photos.length >= 3 && (
                <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-purple-400 mb-2">
                        Diaporama prêt !
                      </h4>
                      <p className="text-xs text-gray-400">
                        Vos photos seront automatiquement enchaînées en format vertical 9:16.
                        Chaque photo sera affichée 4 secondes avec des transitions fluides.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Ajouter une vidéo sociale</DialogTitle>
            <DialogDescription>
              Collez le lien de votre vidéo Instagram, TikTok, Facebook ou YouTube
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-300">Lien de la vidéo *</Label>
              <Input
                value={newVideo.video_url}
                onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                placeholder="https://www.instagram.com/reel/..."
                className="bg-zinc-900 border-zinc-800 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Plateforme</Label>
              <select
                value={newVideo.platform}
                onChange={(e) => setNewVideo({ ...newVideo, platform: e.target.value })}
                className="w-full h-10 px-3 border border-zinc-800 bg-zinc-900 text-white rounded-md mt-1"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-300">Titre (optionnel)</Label>
              <Input
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                placeholder="Titre de votre vidéo"
                className="bg-zinc-900 border-zinc-800 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Durée de diffusion (secondes)</Label>
              <Input
                type="number"
                min="15"
                max="60"
                value={newVideo.duration}
                onChange={(e) => setNewVideo({ ...newVideo, duration: parseInt(e.target.value) || 30 })}
                className="bg-zinc-900 border-zinc-800 text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVideoDialog(false)}
              className="border-zinc-800 text-gray-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddVideo}
              className="bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600"
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
