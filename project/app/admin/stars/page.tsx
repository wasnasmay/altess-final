'use client';

import { useEffect, useState } from 'react';
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
  DialogFooter,
} from '@/components/ui/dialog';
import AdminNavigation from '@/components/AdminNavigation';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MoveUp, MoveDown, Star } from 'lucide-react';

type StarArtist = {
  id: string;
  name: string;
  slug: string;
  instrument: string;
  speciality: string;
  short_bio: string;
  full_bio: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  main_image: string | null;
  gallery_images: string[];
  achievements: string[];
  repertoire: string[];
  youtube_videos: string[];
  display_order: number;
  is_active: boolean;
};

export default function AdminStarsPage() {
  const [stars, setStars] = useState<StarArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStar, setEditingStar] = useState<StarArtist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    instrument: '',
    speciality: '',
    short_bio: '',
    full_bio: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_image: '',
    main_image: '',
    gallery_images: '',
    achievements: '',
    repertoire: '',
    youtube_videos: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadStars();
  }, []);

  async function loadStars() {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setStars(data || []);
    } catch (error) {
      console.error('Error loading stars:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(star: StarArtist) {
    setEditingStar(star);
    setFormData({
      name: star.name,
      slug: star.slug,
      instrument: star.instrument,
      speciality: star.speciality,
      short_bio: star.short_bio,
      full_bio: star.full_bio,
      seo_title: star.seo_title || '',
      seo_description: star.seo_description || '',
      seo_keywords: star.seo_keywords || '',
      og_image: star.og_image || '',
      main_image: star.main_image || '',
      gallery_images: star.gallery_images.join('\n'),
      achievements: star.achievements.join('\n'),
      repertoire: star.repertoire.join('\n'),
      youtube_videos: star.youtube_videos.join('\n'),
      display_order: star.display_order,
      is_active: star.is_active,
    });
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingStar(null);
    setFormData({
      name: '',
      slug: '',
      instrument: '',
      speciality: '',
      short_bio: '',
      full_bio: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      og_image: '',
      main_image: '',
      gallery_images: '',
      achievements: '',
      repertoire: '',
      youtube_videos: '',
      display_order: stars.length,
      is_active: true,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const starData = {
      name: formData.name,
      slug: formData.slug,
      instrument: formData.instrument,
      speciality: formData.speciality,
      short_bio: formData.short_bio,
      full_bio: formData.full_bio,
      seo_title: formData.seo_title || null,
      seo_description: formData.seo_description || null,
      seo_keywords: formData.seo_keywords || null,
      og_image: formData.og_image || null,
      main_image: formData.main_image || null,
      gallery_images: formData.gallery_images
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0),
      achievements: formData.achievements
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0),
      repertoire: formData.repertoire
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0),
      youtube_videos: formData.youtube_videos
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0),
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    try {
      if (editingStar) {
        const { error } = await supabase
          .from('stars')
          .update(starData)
          .eq('id', editingStar.id);

        if (error) throw error;
        toast.success('Star mis à jour');
      } else {
        const { error } = await supabase
          .from('stars')
          .insert([starData]);

        if (error) throw error;
        toast.success('Star créé');
      }

      setDialogOpen(false);
      loadStars();
    } catch (error) {
      console.error('Error saving star:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet artiste ?')) return;

    try {
      const { error } = await supabase
        .from('stars')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Star supprimé');
      loadStars();
    } catch (error) {
      console.error('Error deleting star:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = stars.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stars.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newStars = [...stars];
    [newStars[index], newStars[newIndex]] = [newStars[newIndex], newStars[index]];

    try {
      await Promise.all(
        newStars.map((s, idx) =>
          supabase
            .from('stars')
            .update({ display_order: idx })
            .eq('id', s.id)
        )
      );
      loadStars();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Erreur lors du réordonnancement');
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Gestion des Stars" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation title="Gestion des Stars" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Gestion des Stars</h1>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Star
          </Button>
        </div>

        <div className="grid gap-6">
          {stars.map((star) => (
            <Card key={star.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      {star.name}
                      {!star.is_active && (
                        <span className="text-sm font-normal text-muted-foreground">(Inactif)</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{star.slug} • {star.instrument}
                    </p>
                    <p className="text-xs text-primary mt-1">{star.speciality}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(star.id, 'up')}
                      disabled={stars[0].id === star.id}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(star.id, 'down')}
                      disabled={stars[stars.length - 1].id === star.id}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(star)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(star.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{star.short_bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStar ? 'Modifier la star' : 'Nouvelle star'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!editingStar) {
                      setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instrument">Instrument *</Label>
                <Input
                  id="instrument"
                  value={formData.instrument}
                  onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="speciality">Spécialité *</Label>
                <Input
                  id="speciality"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="short_bio">Biographie courte *</Label>
              <Textarea
                id="short_bio"
                value={formData.short_bio}
                onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="full_bio">Biographie complète *</Label>
              <Textarea
                id="full_bio"
                value={formData.full_bio}
                onChange={(e) => setFormData({ ...formData, full_bio: e.target.value })}
                rows={6}
                required
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Optimisation SEO</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">Titre SEO</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="seo_keywords">Mots-clés SEO</Label>
                  <Input
                    id="seo_keywords"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Images</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="main_image">Photo principale</Label>
                  <Input
                    id="main_image"
                    value={formData.main_image}
                    onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="og_image">Image Open Graph</Label>
                  <Input
                    id="og_image"
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gallery_images">Galerie (une URL par ligne)</Label>
                  <Textarea
                    id="gallery_images"
                    value={formData.gallery_images}
                    onChange={(e) => setFormData({ ...formData, gallery_images: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="achievements">Réalisations (une par ligne) *</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                rows={5}
                required
              />
            </div>

            <div>
              <Label htmlFor="repertoire">Répertoire (un élément par ligne) *</Label>
              <Textarea
                id="repertoire"
                value={formData.repertoire}
                onChange={(e) => setFormData({ ...formData, repertoire: e.target.value })}
                rows={5}
                required
              />
            </div>

            <div>
              <Label htmlFor="youtube_videos">Vidéos YouTube (une URL par ligne)</Label>
              <Textarea
                id="youtube_videos"
                value={formData.youtube_videos}
                onChange={(e) => setFormData({ ...formData, youtube_videos: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Star active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingStar ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
