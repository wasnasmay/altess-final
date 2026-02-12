'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Video, Music, Trash2, ExternalLink, Youtube, Upload, Clock } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_type: 'video' | 'audio';
  source_type: 'youtube' | 'vimeo' | 'direct_url' | 'upload';
  source_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  duration_ms?: number;
  fallback_url: string | null;
  created_at: string;
}

interface PlayoutMediaLibraryProps {
  mediaType?: 'video' | 'audio';
}

export function PlayoutMediaLibrary({ mediaType }: PlayoutMediaLibraryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source_type: 'upload' as 'youtube' | 'vimeo' | 'direct_url' | 'upload',
    source_url: '',
    thumbnail_url: '',
    duration_seconds: 0,
    fallback_url: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectingDuration, setDetectingDuration] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [mediaType]);

  async function loadMedia() {
    try {
      let query = supabase
        .from('playout_media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaType) {
        query = query.eq('type', mediaType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading media:', error);
        setMedia([]);
      } else {
        setMedia(data || []);
      }
    } catch (error) {
      console.error('Exception loading media:', error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }

  function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const cleanUrl = url.trim();
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /src=["']?[^"']*\/embed\/([a-zA-Z0-9_-]{11})/i,
      /^([a-zA-Z0-9_-]{11})$/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  async function fetchYouTubeDuration(url: string) {
    try {
      const response = await fetch('/api/youtube/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          title: data.title || 'Vidéo YouTube',
          thumbnail: data.thumbnail,
          duration: data.duration || 0,
          videoId: data.videoId
        };
      }
      throw new Error(data.error || 'Échec de la récupération');
    } catch (error) {
      console.error('Erreur YouTube:', error);
      toast.error('Impossible de récupérer les informations YouTube');
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return {
          title: `Vidéo YouTube ${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          duration: 0,
          videoId: videoId
        };
      }
      return null;
    }
  }

  async function handleImportYouTubeMetadata() {
    if (!formData.source_url) {
      toast.error('Veuillez d\'abord entrer une URL YouTube');
      return;
    }

    setDetectingDuration(true);
    const videoData = await fetchYouTubeDuration(formData.source_url);
    setDetectingDuration(false);

    if (videoData) {
      setFormData({
        ...formData,
        title: videoData.title || formData.title,
        thumbnail_url: videoData.thumbnail || formData.thumbnail_url,
        duration_seconds: videoData.duration || formData.duration_seconds,
      });
      toast.success('Informations YouTube importées avec succès !');
    }
  }

  async function uploadFile(file: File): Promise<string | null> {
    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors de l\'upload du fichier');
      return null;
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleAddMedia() {
    if (!formData.title) {
      toast.error('Veuillez entrer un titre');
      return;
    }

    if (formData.source_type === 'upload' && !selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    if (formData.source_type !== 'upload' && !formData.source_url) {
      toast.error('Veuillez entrer une URL');
      return;
    }

    try {
      let finalFormData = { ...formData };

      if (formData.source_type === 'upload' && selectedFile) {
        toast.info('Upload du fichier en cours...');
        const uploadedUrl = await uploadFile(selectedFile);
        if (!uploadedUrl) {
          toast.error('Échec de l\'upload');
          return;
        }
        finalFormData.source_url = uploadedUrl;
        toast.success('Fichier uploadé avec succès');
      }

      const { error } = await supabase.from('playout_media_library').insert({
        title: finalFormData.title,
        description: finalFormData.description || null,
        type: mediaType || 'video',
        category: finalFormData.source_type || null,
        media_url: finalFormData.source_url,
        thumbnail_url: finalFormData.thumbnail_url || null,
        duration_seconds: finalFormData.duration_seconds || 0,
        tags: [],
        is_active: true,
      });

      if (error) throw error;

      toast.success('Média ajouté avec succès');
      setIsAddDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        source_type: 'upload',
        source_url: '',
        thumbnail_url: '',
        duration_seconds: 0,
        fallback_url: '',
      });
      setSelectedFile(null);
      loadMedia();
    } catch (error) {
      console.error('Error adding media:', error);
      toast.error('Erreur lors de l\'ajout du média');
    }
  }

  async function handleDeleteMedia(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) return;

    try {
      const { error } = await supabase
        .from('playout_media_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Média supprimé avec succès');
      loadMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Erreur lors de la suppression du média');
    }
  }

  function getSourceIcon(sourceType: string) {
    switch (sourceType) {
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'vimeo': return <Video className="w-4 h-4" />;
      case 'upload': return <Upload className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  const loadVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.onerror = () => {
        console.warn('Impossible de charger les métadonnées');
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gold-gradient">Bibliothèque Média</h2>
          <p className="text-muted-foreground mt-2">
            Gérez vos sources {mediaType === 'video' ? 'vidéo' : 'audio'} avec détection automatique de durée
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un média
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-xl border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="text-2xl gold-gradient">Ajouter un nouveau média</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-amber-400 font-semibold">Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre du média"
                  className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500"
                />
              </div>
              <div>
                <Label className="text-amber-400 font-semibold">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du média"
                  rows={3}
                  className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500"
                />
              </div>
              <div>
                <Label className="text-amber-400 font-semibold">Type de source *</Label>
                <Select
                  value={formData.source_type}
                  onValueChange={(value: any) => {
                    setFormData({ ...formData, source_type: value });
                    setSelectedFile(null);
                  }}
                >
                  <SelectTrigger className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500">
                    <SelectValue placeholder="Choisir une source" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 border-amber-500/30">
                    <SelectItem value="upload">Upload depuis mon ordinateur</SelectItem>
                    <SelectItem value="youtube">YouTube (détection auto)</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="direct_url">Lien direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.source_type === 'upload' ? (
                <div>
                  <Label className="text-amber-400 font-semibold">Fichier vidéo * (avec détection automatique)</Label>
                  <Input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!formData.title) {
                          setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, '') });
                        }
                        if (file.type.startsWith('video/')) {
                          setDetectingDuration(true);
                          toast.info('Détection de la durée en cours...');
                          const durationInSeconds = await loadVideoDuration(file);
                          setDetectingDuration(false);
                          if (durationInSeconds > 0) {
                            setFormData(prev => ({ ...prev, duration_seconds: durationInSeconds }));
                            toast.success(`Durée détectée: ${formatDuration(durationInSeconds)}`);
                          } else {
                            toast.warning('Durée non détectée. Vous pouvez la saisir manuellement.');
                          }
                        }
                      }
                    }}
                    disabled={uploadingFile || detectingDuration}
                    className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500"
                  />
                  {selectedFile && (
                    <p className="text-xs text-green-400 mt-2">
                      Fichier: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  {detectingDuration && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Détection de la durée en cours...
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-amber-400 font-semibold">URL de la source *</Label>
                  <Input
                    value={formData.source_url}
                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                    placeholder={
                      formData.source_type === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                      formData.source_type === 'vimeo' ? 'https://vimeo.com/...' : 'https://...'
                    }
                    className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500"
                  />
                  {(formData.source_type === 'youtube' || formData.source_type === 'vimeo') && formData.source_url && (
                    <Button
                      type="button"
                      onClick={handleImportYouTubeMetadata}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
                      disabled={uploadingFile || detectingDuration}
                    >
                      <Youtube className="w-4 h-4 mr-2" />
                      {detectingDuration ? 'Détection...' : 'Importer Automatiquement (Titre, Miniature, Durée)'}
                    </Button>
                  )}
                </div>
              )}

              <div>
                <Label className="text-amber-400 font-semibold">URL de la miniature</Label>
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-amber-400 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Durée (secondes) {formData.source_type === 'upload' && '- Détection automatique'}
                </Label>
                <Input
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500"
                />
                <p className="text-xs text-amber-400/70 mt-1">
                  {formData.source_type === 'upload'
                    ? 'La durée est détectée automatiquement lors de la sélection du fichier.'
                    : 'Utilisez l\'import automatique pour YouTube/Vimeo ou entrez manuellement.'}
                </p>
              </div>

              <div>
                <Label className="text-amber-400 font-semibold">URL de secours (MP4)</Label>
                <Input
                  value={formData.fallback_url}
                  onChange={(e) => setFormData({ ...formData, fallback_url: e.target.value })}
                  placeholder="https://... (optionnel)"
                  className="bg-slate-800/50 border-amber-500/30 focus:border-amber-500"
                />
                <p className="text-xs text-amber-400/70 mt-1">URL MP4 utilisée si YouTube échoue</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={uploadingFile || detectingDuration}
                  className="border-amber-500/30 hover:bg-amber-500/10"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddMedia}
                  disabled={uploadingFile || detectingDuration}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {uploadingFile ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-pulse" />
                      Upload en cours...
                    </>
                  ) : detectingDuration ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Détection...
                    </>
                  ) : (
                    'Ajouter'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {media.length === 0 ? (
        <Card className="bg-slate-900/50 border-amber-500/30">
          <CardContent className="py-16 text-center">
            <div className="text-muted-foreground">
              <Video className="w-16 h-16 mx-auto mb-4 text-amber-500/50" />
              <p className="mb-6 text-lg">Aucun média dans la bibliothèque</p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter votre premier média
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover-lift bg-slate-900/50 border-amber-500/20 hover:border-amber-500/50">
              <div className="relative aspect-video bg-slate-800">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                ) : item.source_type === 'youtube' && extractYouTubeId(item.source_url) ? (
                  <img
                    src={`https://img.youtube.com/vi/${extractYouTubeId(item.source_url)}/maxresdefault.jpg`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {item.media_type === 'video' ? (
                      <Video className="w-12 h-12 text-amber-500/50" />
                    ) : (
                      <Music className="w-12 h-12 text-amber-500/50" />
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1 bg-black/80 border-amber-500/30">
                    {getSourceIcon(item.source_type)}
                    {item.source_type}
                  </Badge>
                </div>
                {item.duration_seconds && (
                  <Badge className="absolute bottom-2 right-2 bg-black/90 text-amber-400 border border-amber-600/50 text-sm font-bold px-3 py-1.5">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(item.duration_seconds)}
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-base line-clamp-1 gold-gradient">{item.title}</CardTitle>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir la source
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMedia(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
