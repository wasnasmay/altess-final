'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Tv, Radio, Plus, Trash2, Eye, EyeOff, Play, Upload } from 'lucide-react';

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  is_live: boolean;
  is_active: boolean;
  view_count: number;
  created_at: string;
};

type Audio = {
  id: string;
  title: string;
  artist: string;
  album: string;
  audio_url: string;
  cover_url: string;
  genre: string;
  is_live: boolean;
  is_active: boolean;
  play_count: number;
  created_at: string;
};

interface MediaManagementProps {
  videos: Video[];
  audios: Audio[];
  onRefresh: () => void;
}

export function MediaManagement({ videos, audios, onRefresh }: MediaManagementProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    category: '',
    is_live: false
  });
  const [audioForm, setAudioForm] = useState({
    title: '',
    artist: '',
    album: '',
    audio_url: '',
    cover_url: '',
    genre: '',
    is_live: false
  });

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let videoUrl = videoForm.video_url;

      if (uploadMode === 'file' && selectedFile) {
        toast.info('Upload du fichier en cours...');
        videoUrl = await handleFileUpload(selectedFile);
        toast.success('Fichier uploadé avec succès!');
      }

      const { error } = await supabase.from('videos').insert([{
        ...videoForm,
        video_url: videoUrl
      }]);

      if (error) throw error;
      toast.success('Vidéo ajoutée avec succès');
      setShowVideoDialog(false);
      setVideoForm({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        category: '',
        is_live: false
      });
      setSelectedFile(null);
      setUploadMode('url');
      onRefresh();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Erreur lors de l\'ajout de la vidéo');
    } finally {
      setUploading(false);
    }
  };

  const handleAddAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('audios').insert([audioForm]);
      if (error) throw error;
      toast.success('Audio ajouté avec succès');
      setShowAudioDialog(false);
      setAudioForm({
        title: '',
        artist: '',
        album: '',
        audio_url: '',
        cover_url: '',
        genre: '',
        is_live: false
      });
      onRefresh();
    } catch (error) {
      console.error('Error adding audio:', error);
      toast.error('Erreur lors de l\'ajout de l\'audio');
    }
  };

  const handleToggleVideoActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
      toast.success(is_active ? 'Vidéo activée' : 'Vidéo désactivée');
      onRefresh();
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggleAudioActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('audios')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
      toast.success(is_active ? 'Audio activé' : 'Audio désactivé');
      onRefresh();
    } catch (error) {
      console.error('Error updating audio:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Vidéo supprimée');
      onRefresh();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet audio ?')) return;
    try {
      const { error } = await supabase.from('audios').delete().eq('id', id);
      if (error) throw error;
      toast.success('Audio supprimé');
      onRefresh();
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-primary" />
                WebTV - Gestion des Vidéos
              </CardTitle>
              <CardDescription>Gérez les vidéos de votre WebTV</CardDescription>
            </div>
            <Button onClick={() => setShowVideoDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter une vidéo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vignette</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Vues</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-primary/10 rounded flex items-center justify-center">
                        <Tv className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{video.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {video.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {video.category && (
                      <Badge variant="outline">{video.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {video.view_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {video.is_live && <Badge variant="destructive">LIVE</Badge>}
                      {video.is_active ? (
                        <Badge variant="default">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVideoActive(video.id, !video.is_active)}
                      >
                        {video.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary" />
                WebRadio - Gestion des Audios
              </CardTitle>
              <CardDescription>Gérez les musiques de votre WebRadio</CardDescription>
            </div>
            <Button onClick={() => setShowAudioDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter une musique
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pochette</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Artiste</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Écoutes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audios.map((audio) => (
                <TableRow key={audio.id}>
                  <TableCell>
                    {audio.cover_url ? (
                      <img
                        src={audio.cover_url}
                        alt={audio.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center">
                        <Radio className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{audio.title}</div>
                    {audio.album && (
                      <div className="text-xs text-muted-foreground">{audio.album}</div>
                    )}
                  </TableCell>
                  <TableCell>{audio.artist}</TableCell>
                  <TableCell>
                    {audio.genre && <Badge variant="outline">{audio.genre}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {audio.play_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {audio.is_live && <Badge variant="destructive">LIVE</Badge>}
                      {audio.is_active ? (
                        <Badge variant="default">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAudioActive(audio.id, !audio.is_active)}
                      >
                        {audio.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAudio(audio.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une vidéo</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle vidéo à votre WebTV
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <form onSubmit={handleAddVideo} className="space-y-4 p-1">
              <div>
                <Label htmlFor="video_title">Titre *</Label>
                <Input
                  id="video_title"
                  required
                  value={videoForm.title}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="video_description">Description</Label>
                <Textarea
                  id="video_description"
                  rows={3}
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, description: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Source de la vidéo *</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={uploadMode === 'url' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('url');
                      setSelectedFile(null);
                    }}
                    className="flex-1"
                  >
                    URL (YouTube/Vimeo)
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === 'file' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('file');
                      setVideoForm({ ...videoForm, video_url: '' });
                    }}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Fichier MP4
                  </Button>
                </div>
              </div>

              {uploadMode === 'url' ? (
                <div>
                  <Label htmlFor="video_url">URL de la vidéo *</Label>
                  <Input
                    id="video_url"
                    required={uploadMode === 'url'}
                    placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                    value={videoForm.video_url}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, video_url: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="video_file">Fichier vidéo (MP4) *</Label>
                  <Input
                    id="video_file"
                    type="file"
                    accept="video/mp4,video/webm"
                    required={uploadMode === 'file'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="thumbnail_url">URL Vignette</Label>
                <Input
                  id="thumbnail_url"
                  type="url"
                  placeholder="https://example.com/thumbnail.jpg"
                  value={videoForm.thumbnail_url}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, thumbnail_url: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="video_category">Catégorie</Label>
                <Input
                  id="video_category"
                  placeholder="Concerts, Interviews, etc."
                  value={videoForm.category}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, category: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="video_live"
                  checked={videoForm.is_live}
                  onCheckedChange={(checked) =>
                    setVideoForm({ ...videoForm, is_live: checked })
                  }
                />
                <Label htmlFor="video_live">Diffusion en direct</Label>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    {uploadMode === 'file' ? 'Upload en cours...' : 'Ajout en cours...'}
                  </>
                ) : (
                  'Ajouter la vidéo'
                )}
              </Button>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showAudioDialog} onOpenChange={setShowAudioDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une musique</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle musique à votre WebRadio
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <form onSubmit={handleAddAudio} className="space-y-4 p-1">
              <div>
                <Label htmlFor="audio_title">Titre *</Label>
                <Input
                  id="audio_title"
                  required
                  value={audioForm.title}
                  onChange={(e) =>
                    setAudioForm({ ...audioForm, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="audio_artist">Artiste</Label>
                <Input
                  id="audio_artist"
                  value={audioForm.artist}
                  onChange={(e) =>
                    setAudioForm({ ...audioForm, artist: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="audio_album">Album</Label>
                <Input
                  id="audio_album"
                  value={audioForm.album}
                  onChange={(e) =>
                    setAudioForm({ ...audioForm, album: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="audio_url">URL Audio *</Label>
                <Input
                  id="audio_url"
                  type="url"
                  required
                  placeholder="https://example.com/audio.mp3"
                  value={audioForm.audio_url}
                  onChange={(e) =>
                    setAudioForm({ ...audioForm, audio_url: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="cover_url">URL Pochette</Label>
                <Input
                  id="cover_url"
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={audioForm.cover_url}
                  onChange={(e) =>
                    setAudioForm({ ...audioForm, cover_url: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="audio_genre">Genre</Label>
                <Input
                  id="audio_genre"
                  placeholder="Oriental, Chaabi, Andalou, etc."
                  value={audioForm.genre}
                  onChange={(e) =>
                    setAudioForm({ ...audioForm, genre: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="audio_live"
                  checked={audioForm.is_live}
                  onCheckedChange={(checked) =>
                    setAudioForm({ ...audioForm, is_live: checked })
                  }
                />
                <Label htmlFor="audio_live">Diffusion en direct</Label>
              </div>
              <Button type="submit" className="w-full">
                Ajouter la musique
              </Button>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
