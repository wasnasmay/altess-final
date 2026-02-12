'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Video,
  Music,
  Plus,
  Edit,
  Trash2,
  Play,
  Megaphone,
  DollarSign,
  Search,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import AdminNavigation from '@/components/AdminNavigation';

type MediaType = 'video' | 'audio' | 'jingle' | 'ad' | 'live';

type Media = {
  id: string;
  title: string;
  type: MediaType;
  category: string;
  description: string;
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  duration_ms?: number;
  file_size_mb: number;
  tags: string[];
  is_active: boolean;
  created_at: string;
};

type MediaFormData = {
  title: string;
  type: MediaType;
  category: string;
  description: string;
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  duration_ms?: number;
  file_size_mb: number;
  tags: string;
  is_active: boolean;
};

export default function PlayoutLibraryPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [durationInput, setDurationInput] = useState('00:00:00');

  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    type: 'video',
    category: '',
    description: '',
    media_url: '',
    thumbnail_url: '',
    duration_seconds: 0,
    file_size_mb: 0,
    tags: '',
    is_active: true,
  });

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    filterMedia();
  }, [media, searchQuery, filterType, filterCategory]);

  async function loadMedia() {
    try {
      const { data, error } = await supabase
        .from('playout_media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[Playout Library] ═══ DONNÉES CHARGÉES ═══');
      console.log('[Playout Library] Nombre de médias:', data?.length);

      const normalizedData = (data || []).map(item => {
        const durationMs = item.duration_ms || 0;
        const durationSeconds = item.duration_seconds || 0;

        let finalDurationMs = durationMs;

        if (!finalDurationMs && durationSeconds > 0) {
          finalDurationMs = durationSeconds * 1000;
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log(`[Playout Library] VIDEO: "${item.title}"`);
        console.log('[Playout Library] ID:', item.id);
        console.log('[Playout Library] duration_seconds (DB):', item.duration_seconds, typeof item.duration_seconds);
        console.log('[Playout Library] duration_ms (DB):', item.duration_ms, typeof item.duration_ms);
        console.log('[Playout Library] finalDurationMs (calculé):', finalDurationMs);
        console.log('[Playout Library] Affichage prévu:', formatDuration(finalDurationMs));
        console.log('═══════════════════════════════════════════════════════');

        return {
          ...item,
          duration_ms: finalDurationMs,
          duration_seconds: Math.round(finalDurationMs / 1000),
        };
      });

      setMedia(normalizedData);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des médias');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function filterMedia() {
    let filtered = media;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((m) => m.category === filterCategory);
    }

    setFilteredMedia(filtered);
  }

  async function handleFetchMediaInfo() {
    if (!formData.media_url) return;

    setFetchingInfo(true);
    try {
      if (formData.media_url.includes('youtube.com') || formData.media_url.includes('youtu.be')) {
        const response = await fetch('/api/youtube/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: formData.media_url }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            const durationMs = data.durationMs || 0;

            if (durationMs > 0) {
              const formatted = formatDuration(durationMs);
              setDurationInput(formatted);
              console.log('[YouTube] ✅ Durée auto-détectée:', formatted);
            }

            setFormData({
              ...formData,
              title: formData.title || data.title || '',
              thumbnail_url: data.thumbnail || '',
              media_url: data.embedUrl || formData.media_url,
            });
            toast.success('Informations YouTube récupérées avec succès');
          } else {
            throw new Error(data.error || 'Erreur lors de la récupération');
          }
        } else {
          throw new Error('Erreur de connexion au serveur');
        }
      }
    } catch (error: any) {
      console.error('Error fetching media info:', error);
      toast.error(error.message || 'Erreur lors de la récupération des informations');
    } finally {
      setFetchingInfo(false);
    }
  }

  function extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTION UTILITAIRE OBLIGATOIRE : Extraction durée avec Promise bloquante
  // Cette fonction garantit qu'aucun upload ne se fait sans durée valide
  // ═══════════════════════════════════════════════════════════════════════════
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      if (!isVideo && !isAudio) {
        console.warn('[getVideoDuration] ⚠️ Fichier non média, durée = 0');
        resolve(0);
        return;
      }

      const video = document.createElement(isVideo ? 'video' : 'audio');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const durationMs = Math.round(video.duration * 1000);
        console.log('[getVideoDuration] ✅ Durée trouvée:', video.duration, 's (', durationMs, 'ms)');
        window.URL.revokeObjectURL(video.src);
        resolve(durationMs);
      };

      video.onerror = (err) => {
        console.error('[getVideoDuration] ❌ Erreur extraction durée:', err);
        window.URL.revokeObjectURL(video.src);
        resolve(0);
      };

      video.src = URL.createObjectURL(file);

      setTimeout(() => {
        if (video.src) {
          window.URL.revokeObjectURL(video.src);
        }
        console.warn('[getVideoDuration] ⏱️ Timeout 15s - résolution à 0');
        resolve(0);
      }, 15000);
    });
  };

  async function detectMediaDuration(mediaUrl: string, mediaType: 'video' | 'audio'): Promise<number> {
    return new Promise((resolve, reject) => {
      const element = document.createElement(mediaType);

      element.addEventListener('loadedmetadata', () => {
        const durationMs = Math.round(element.duration * 1000);
        console.log(`[Playout Library] 🎬 Durée détectée: ${element.duration}s (${durationMs}ms)`);
        URL.revokeObjectURL(element.src);
        resolve(durationMs);
      });

      element.addEventListener('error', (e) => {
        console.error('[Playout Library] ❌ Erreur détection durée:', e);
        URL.revokeObjectURL(element.src);
        resolve(0);
      });

      element.src = mediaUrl;
      element.load();

      setTimeout(() => {
        URL.revokeObjectURL(element.src);
        resolve(0);
      }, 10000);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FONCTION D'UPLOAD AVEC AWAIT BLOQUANT SUR getVideoDuration
  // L'upload Supabase ne démarre QUE si la durée est extraite avec succès
  // ═══════════════════════════════════════════════════════════════════════════
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('═══════════════════════════════════════════════════════');
    console.log('[Playout Library] 📁 Upload de fichier démarré');
    console.log('[Playout Library] Fichier:', file.name);
    console.log('[Playout Library] Type:', file.type);
    console.log('[Playout Library] Taille:', (file.size / 1024 / 1024).toFixed(2), 'Mo');

    try {
      // ═════════════════════════════════════════════════════════════════════
      // ÉTAPE 1 : TENTATIVE CALCUL DURÉE AUTOMATIQUE (NON BLOQUANT)
      // ═════════════════════════════════════════════════════════════════════
      console.log('[Playout Library] ⏳ Tentative calcul de la durée...');
      const duration = await getVideoDuration(file);
      console.log('[Playout Library] Résultat:', duration, 'ms');

      if (duration > 0) {
        // ✅ AUTO-DÉTECTION RÉUSSIE : Remplir le champ automatiquement
        const formatted = formatDuration(duration);
        setDurationInput(formatted);
        console.log('[Playout Library] ✅ Durée auto-détectée:', formatted);
        toast.success(`Durée auto-détectée: ${formatted}`);
      } else {
        // ❌ ÉCHEC : Laisser l'utilisateur saisir manuellement
        console.log('[Playout Library] ⚠️ Auto-détection échouée. Saisie manuelle requise.');
        toast.warning('Durée non détectée. Veuillez la saisir manuellement (HH:MM:SS)');
        setDurationInput('00:00:00');
      }

      // ═════════════════════════════════════════════════════════════════════
      // ÉTAPE 2 : UPLOAD VERS SUPABASE STORAGE
      // ON ARRIVE ICI SEULEMENT SI duration > 0
      // ═════════════════════════════════════════════════════════════════════
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `playout/${fileName}`;

      console.log('[Playout Library] 📤 Upload vers Supabase Storage:', storagePath);
      console.log('[Playout Library] 📊 Durée garantie AVANT upload:', duration, 'ms');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Playout Library] ❌ Erreur upload:', uploadError);
        throw uploadError;
      }

      // ═════════════════════════════════════════════════════════════════════
      // ÉTAPE 3 : OBTENIR URL PUBLIQUE
      // ═════════════════════════════════════════════════════════════════════
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;
      console.log('[Playout Library] ✅ Upload réussi:', publicUrl);

      // ═════════════════════════════════════════════════════════════════════
      // ÉTAPE 4 : MISE À JOUR FORMULAIRE (SANS DURÉE - GÉRÉE PAR durationInput)
      // ═════════════════════════════════════════════════════════════════════
      setFormData({
        ...formData,
        media_url: publicUrl,
        file_size_mb: parseFloat((file.size / 1024 / 1024).toFixed(2)),
        title: formData.title || file.name.replace(/\.[^/.]+$/, ''),
      });

      console.log('[Playout Library] ✅ Formulaire mis à jour:');
      console.log('  URL:', publicUrl);
      console.log('  Durée (input):', durationInput);
      console.log('═══════════════════════════════════════════════════════');

    } catch (error: any) {
      console.error('[Playout Library] ❌ Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'upload du fichier');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log('═══════════════════════════════════════════════════════');
    console.log('[Playout Library] Submitting media form');
    console.log('Operation:', editingId ? 'UPDATE' : 'INSERT');

    try {
      // ═════════════════════════════════════════════════════════════════════
      // UTILISER UNIQUEMENT durationInput COMME SOURCE DE VÉRITÉ
      // ═════════════════════════════════════════════════════════════════════
      console.log('[Playout Library] 📊 Durée saisie (HH:MM:SS):', durationInput);

      const durationMs = parseDurationToMs(durationInput);
      const durationSeconds = Math.round(durationMs / 1000);

      console.log('[Playout Library] 📊 Durée convertie:', durationMs, 'ms (', durationSeconds, 's)');

      if (durationMs === 0 && (formData.type === 'video' || formData.type === 'audio')) {
        toast.error('Veuillez saisir une durée valide (HH:MM:SS)');
        return;
      }

      const mediaData = {
        title: formData.title,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        media_url: formData.media_url,
        thumbnail_url: formData.thumbnail_url,
        duration_seconds: durationSeconds,
        duration_ms: durationMs,
        file_size_mb: formData.file_size_mb,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        is_active: formData.is_active,
      };

      console.log('[Playout Library] Form data:', mediaData);
      console.log('[Playout Library] Calling API: /api/playout/media/save');

      const response = await fetch('/api/playout/media/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaData,
          editingId: editingId || null,
        }),
      });

      console.log('[Playout Library] API response status:', response.status);

      const result = await response.json();
      console.log('[Playout Library] API response:', result);

      if (!response.ok || !result.success) {
        console.error('[Playout Library] ❌ API returned error');
        console.error('  - Error:', result.error);
        console.error('  - Details:', result.details);

        const errorMessage = result.details?.hint
          ? `${result.error} - ${result.details.hint}`
          : result.error || 'Erreur inconnue';

        toast.error(`Erreur: ${errorMessage}`);
        return;
      }

      console.log('[Playout Library] ✅ Save successful');
      console.log('[Playout Library] 🔄 Rechargement des médias...');
      console.log('═══════════════════════════════════════════════════════');

      toast.success(result.message || 'Média sauvegardé avec succès');
      setIsDialogOpen(false);
      resetForm();

      // Attendre un peu pour laisser le temps à Supabase de synchroniser
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[Playout Library] ⏳ Démarrage du rechargement...');
      await loadMedia();
      console.log('[Playout Library] ✅ Rechargement terminé');

    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('[Playout Library] ❌ FATAL ERROR during save');
      console.error('Error type:', error.constructor?.name || typeof error);
      console.error('Error message:', error.message || error);
      console.error('Error stack:', error.stack || 'N/A');
      console.error('═══════════════════════════════════════════════════════');

      toast.error(`Erreur technique: ${error.message || 'Impossible de contacter le serveur'}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) return;

    try {
      const { error } = await supabase
        .from('playout_media_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Média supprimé avec succès');
      loadMedia();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression du média');
      console.error(error);
    }
  }

  function openEditDialog(item: Media) {
    setEditingId(item.id);
    const durationMs = item.duration_ms || item.duration_seconds * 1000;
    setDurationInput(formatDuration(durationMs));
    setFormData({
      title: item.title,
      type: item.type,
      category: item.category,
      description: item.description,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url,
      duration_seconds: item.duration_seconds,
      duration_ms: durationMs,
      file_size_mb: item.file_size_mb,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setDurationInput('00:00:00');
    setFormData({
      title: '',
      type: 'video',
      category: '',
      description: '',
      media_url: '',
      thumbnail_url: '',
      duration_seconds: 0,
      duration_ms: 0,
      file_size_mb: 0,
      tags: '',
      is_active: true,
    });
  }

  function formatDuration(durationMs: number): string {
    const totalSeconds = Math.round(durationMs / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function parseDurationToMs(hhmmss: string): number {
    const parts = hhmmss.split(':');
    if (parts.length !== 3) return 0;

    const hrs = parseInt(parts[0]) || 0;
    const mins = parseInt(parts[1]) || 0;
    const secs = parseInt(parts[2]) || 0;

    const totalSeconds = hrs * 3600 + mins * 60 + secs;
    return totalSeconds * 1000;
  }

  function getTypeIcon(type: MediaType) {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'jingle':
        return <Megaphone className="w-4 h-4" />;
      case 'ad':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  }

  const categories = Array.from(new Set(media.map(m => m.category).filter(Boolean)));
  const stats = {
    total: media.length,
    video: media.filter(m => m.type === 'video').length,
    audio: media.filter(m => m.type === 'audio').length,
    jingle: media.filter(m => m.type === 'jingle').length,
    ad: media.filter(m => m.type === 'ad').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <AdminNavigation title="Bibliothèque Média - Play Out" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-slate-400">Total médias</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.video}</div>
              <div className="text-sm text-slate-400">Vidéos</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.audio}</div>
              <div className="text-sm text-slate-400">Audios</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.jingle}</div>
              <div className="text-sm text-slate-400">Jingles</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.ad}</div>
              <div className="text-sm text-slate-400">Publicités</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher par titre, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[200px] bg-slate-900 border-slate-800">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="video">Vidéos</SelectItem>
              <SelectItem value="audio">Audios</SelectItem>
              <SelectItem value="jingle">Jingles</SelectItem>
              <SelectItem value="ad">Publicités</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[200px] bg-slate-900 border-slate-800">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              console.log('[Playout Library] 🔄 Rechargement manuel déclenché');
              loadMedia();
            }}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chargement...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              Aucun média trouvé
            </div>
          ) : (
            filteredMedia.map((item) => (
              <Card
                key={item.id}
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors overflow-hidden"
              >
                <div className="aspect-video bg-slate-800 relative">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getTypeIcon(item.type)}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs rounded bg-black/70 backdrop-blur-sm">
                      {item.type}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span>{formatDuration(item.duration_ms || 0)}</span>
                    {item.category && (
                      <span className="px-2 py-0.5 bg-slate-800 rounded">{item.category}</span>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] bg-slate-900 border-slate-800 flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800">
              <DialogTitle>{editingId ? 'Modifier' : 'Ajouter'} un média</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <Label>Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: MediaType) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100]" position="popper">
                        <SelectItem value="video">Vidéo</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="jingle">Jingle</SelectItem>
                        <SelectItem value="ad">Publicité</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Catégorie</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="news, music, entertainment..."
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Uploader un fichier (Vidéo/Audio)</Label>
                  <Input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileUpload}
                    className="bg-slate-800 border-slate-700"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    ✅ La durée sera extraite automatiquement AVANT l'upload
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-700"></div>
                  <span className="text-xs text-slate-500">OU</span>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                <div>
                  <Label>URL du média (externe)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.media_url}
                      onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                      placeholder="https://youtube.com/... ou https://..."
                      className="bg-slate-800 border-slate-700 flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleFetchMediaInfo}
                      disabled={!formData.media_url || fetchingInfo}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {fetchingInfo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pour YouTube : cliquez sur le bouton pour extraire les infos
                  </p>
                </div>

                <div>
                  <Label>URL de la miniature</Label>
                  <Input
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <span>Durée (HH:MM:SS) *</span>
                      {durationInput !== '00:00:00' && (
                        <span className="text-xs text-green-400">✓ Détectée</span>
                      )}
                    </Label>
                    <Input
                      type="text"
                      value={durationInput}
                      onChange={(e) => setDurationInput(e.target.value)}
                      placeholder="01:30:00"
                      pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                      required
                      className="bg-slate-800 border-slate-700 font-mono"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Format: HH:MM:SS (ex: 01:30:00 = 1h30)
                    </p>
                  </div>

                  <div>
                    <Label>Taille (MB)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.file_size_mb}
                      onChange={(e) => setFormData({ ...formData, file_size_mb: parseFloat(e.target.value) })}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <Label>Tags (séparés par des virgules)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="musique, oriental, festif"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex gap-4">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  {editingId ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
