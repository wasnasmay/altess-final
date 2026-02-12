'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Tv, Radio, Globe, Trash2, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Background {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  display_mode: 'tv' | 'radio' | 'both';
  is_default: boolean;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export default function BackgroundsAdminPage() {
  const router = useRouter();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    display_mode: 'both' as 'tv' | 'radio' | 'both',
    is_active: false,
    priority: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBackgrounds();
  }, []);

  async function loadBackgrounds() {
    try {
      const { data, error } = await supabase
        .from('dynamic_backgrounds')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setBackgrounds(data || []);
    } catch (error) {
      console.error('Error loading backgrounds:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les arrière-plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner une image',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: 'Image trop volumineuse (max 5MB)',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('backgrounds')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('backgrounds')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadImage(selectedFile);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('dynamic_backgrounds').insert({
        title: formData.title,
        description: formData.description || null,
        image_url: imageUrl,
        display_mode: formData.display_mode,
        is_default: false,
        is_active: formData.is_active,
        priority: formData.priority,
        upload_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Arrière-plan ajouté avec succès',
      });

      setFormData({
        title: '',
        description: '',
        display_mode: 'both',
        is_active: false,
        priority: 0,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      loadBackgrounds();
    } catch (error) {
      console.error('Error uploading background:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'arrière-plan',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('dynamic_backgrounds')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: currentActive ? 'Arrière-plan désactivé' : 'Arrière-plan activé',
      });

      loadBackgrounds();
    } catch (error) {
      console.error('Error toggling background:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'arrière-plan',
        variant: 'destructive',
      });
    }
  }

  async function deleteBackground(id: string, imageUrl: string, isDefault: boolean) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet arrière-plan ?')) return;

    try {
      if (!isDefault && imageUrl.includes('supabase.co/storage')) {
        const urlParts = imageUrl.split('/backgrounds/');
        if (urlParts[1]) {
          await supabase.storage.from('backgrounds').remove([urlParts[1]]);
        }
      }

      const { error } = await supabase
        .from('dynamic_backgrounds')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Arrière-plan supprimé',
      });

      loadBackgrounds();
    } catch (error) {
      console.error('Error deleting background:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'arrière-plan',
        variant: 'destructive',
      });
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'tv':
        return <Tv className="w-4 h-4" />;
      case 'radio':
        return <Radio className="w-4 h-4" />;
      case 'both':
        return <Globe className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'tv':
        return 'WebTV';
      case 'radio':
        return 'WebRadio';
      case 'both':
        return 'TV & Radio';
      default:
        return mode;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="mb-6 text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour à l'Administration
          </Button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Gestion des Arrière-plans
          </h1>
          <p className="text-slate-600">
            Gérez les arrière-plans dynamiques pour WebTV et WebRadio
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Nouvel Arrière-plan
                </CardTitle>
                <CardDescription>
                  Téléchargez votre propre image haute résolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nom de l'arrière-plan"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description optionnelle"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="display_mode">Affichage</Label>
                    <Select
                      value={formData.display_mode}
                      onValueChange={(value: 'tv' | 'radio' | 'both') =>
                        setFormData({ ...formData, display_mode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">TV & Radio</SelectItem>
                        <SelectItem value="tv">WebTV uniquement</SelectItem>
                        <SelectItem value="radio">WebRadio uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Activer immédiatement</Label>
                  </div>

                  <div>
                    <Label htmlFor="image">Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">Max 5MB - Recommandé: 1920x1080px</p>
                  </div>

                  {previewUrl && (
                    <div className="relative rounded-lg overflow-hidden border-2 border-amber-200">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Ajouter l'arrière-plan
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Bibliothèque d'Arrière-plans
                </CardTitle>
                <CardDescription>
                  {backgrounds.length} arrière-plan{backgrounds.length > 1 ? 's' : ''} disponible{backgrounds.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {backgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      className={`relative group rounded-lg overflow-hidden transition-all ${
                        bg.is_active
                          ? 'border-4 border-amber-500 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                          : 'border-2 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={bg.image_url}
                          alt={bg.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        <div className="absolute top-2 left-2 flex gap-2">
                          {bg.is_default && (
                            <Badge className="bg-blue-500">ALTESS</Badge>
                          )}
                          {bg.is_active && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
                              <Check className="w-3 h-3 mr-1" />
                              En Ligne
                            </Badge>
                          )}
                        </div>

                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
                            {getModeIcon(bg.display_mode)}
                            <span className="ml-1">{getModeLabel(bg.display_mode)}</span>
                          </Badge>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-lg mb-1">{bg.title}</h3>
                          {bg.description && (
                            <p className="text-white/80 text-sm line-clamp-2">{bg.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={bg.is_active ? 'outline' : 'default'}
                            onClick={() => toggleActive(bg.id, bg.is_active)}
                            className={!bg.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
                          >
                            {bg.is_active ? (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Activer
                              </>
                            )}
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteBackground(bg.id, bg.image_url, bg.is_default)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {backgrounds.length === 0 && (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">Aucun arrière-plan disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
