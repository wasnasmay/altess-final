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
import { Plus, Edit, Trash2, Image as ImageIcon, MoveUp, MoveDown } from 'lucide-react';

type Prestation = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  main_image: string | null;
  gallery_images: string[];
  features: string[];
  display_order: number;
  is_active: boolean;
};

export default function AdminPrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrestation, setEditingPrestation] = useState<Prestation | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    full_description: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_image: '',
    main_image: '',
    gallery_images: '',
    features: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadPrestations();
  }, []);

  async function loadPrestations() {
    try {
      const { data, error } = await supabase
        .from('prestations')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPrestations(data || []);
    } catch (error) {
      console.error('Error loading prestations:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(prestation: Prestation) {
    setEditingPrestation(prestation);
    setFormData({
      title: prestation.title,
      slug: prestation.slug,
      short_description: prestation.short_description,
      full_description: prestation.full_description,
      seo_title: prestation.seo_title || '',
      seo_description: prestation.seo_description || '',
      seo_keywords: prestation.seo_keywords || '',
      og_image: prestation.og_image || '',
      main_image: prestation.main_image || '',
      gallery_images: prestation.gallery_images.join('\n'),
      features: prestation.features.join('\n'),
      display_order: prestation.display_order,
      is_active: prestation.is_active,
    });
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingPrestation(null);
    setFormData({
      title: '',
      slug: '',
      short_description: '',
      full_description: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      og_image: '',
      main_image: '',
      gallery_images: '',
      features: '',
      display_order: prestations.length,
      is_active: true,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const prestationData = {
      title: formData.title,
      slug: formData.slug,
      short_description: formData.short_description,
      full_description: formData.full_description,
      seo_title: formData.seo_title || null,
      seo_description: formData.seo_description || null,
      seo_keywords: formData.seo_keywords || null,
      og_image: formData.og_image || null,
      main_image: formData.main_image || null,
      gallery_images: formData.gallery_images
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0),
      features: formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0),
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    try {
      if (editingPrestation) {
        const { error } = await supabase
          .from('prestations')
          .update(prestationData)
          .eq('id', editingPrestation.id);

        if (error) throw error;
        toast.success('Prestation mise à jour');
      } else {
        const { error } = await supabase
          .from('prestations')
          .insert([prestationData]);

        if (error) throw error;
        toast.success('Prestation créée');
      }

      setDialogOpen(false);
      loadPrestations();
    } catch (error) {
      console.error('Error saving prestation:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) return;

    try {
      const { error } = await supabase
        .from('prestations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Prestation supprimée');
      loadPrestations();
    } catch (error) {
      console.error('Error deleting prestation:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = prestations.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === prestations.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newPrestations = [...prestations];
    [newPrestations[index], newPrestations[newIndex]] = [newPrestations[newIndex], newPrestations[index]];

    try {
      await Promise.all(
        newPrestations.map((p, idx) =>
          supabase
            .from('prestations')
            .update({ display_order: idx })
            .eq('id', p.id)
        )
      );
      loadPrestations();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Erreur lors du réordonnancement');
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Gestion des Prestations" />
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
      <AdminNavigation title="Gestion des Prestations" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Gestion des Prestations</h1>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Prestation
          </Button>
        </div>

        <div className="grid gap-6">
          {prestations.map((prestation) => (
            <Card key={prestation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      {prestation.title}
                      {!prestation.is_active && (
                        <span className="text-sm font-normal text-muted-foreground">(Inactif)</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{prestation.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(prestation.id, 'up')}
                      disabled={prestations[0].id === prestation.id}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(prestation.id, 'down')}
                      disabled={prestations[prestations.length - 1].id === prestation.id}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(prestation)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(prestation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {prestation.short_description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {prestation.features.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {prestation.features.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{prestation.features.length - 3} autres
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrestation ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (!editingPrestation) {
                      setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) });
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

            <div>
              <Label htmlFor="short_description">Description courte *</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="full_description">Description complète *</Label>
              <Textarea
                id="full_description"
                value={formData.full_description}
                onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
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
                    placeholder="Titre optimisé pour les moteurs de recherche"
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    rows={2}
                    placeholder="Description pour les résultats de recherche"
                  />
                </div>
                <div>
                  <Label htmlFor="seo_keywords">Mots-clés SEO</Label>
                  <Input
                    id="seo_keywords"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                    placeholder="mot-clé1, mot-clé2, mot-clé3"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Images</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="main_image">Image principale</Label>
                  <Input
                    id="main_image"
                    value={formData.main_image}
                    onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                    placeholder="URL de l'image principale"
                  />
                </div>
                <div>
                  <Label htmlFor="og_image">Image Open Graph (partage social)</Label>
                  <Input
                    id="og_image"
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder="URL de l'image pour WhatsApp/Facebook"
                  />
                </div>
                <div>
                  <Label htmlFor="gallery_images">Galerie d'images (une URL par ligne)</Label>
                  <Textarea
                    id="gallery_images"
                    value={formData.gallery_images}
                    onChange={(e) => setFormData({ ...formData, gallery_images: e.target.value })}
                    rows={4}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="features">Caractéristiques (une par ligne) *</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={5}
                required
                placeholder="Caractéristique 1&#10;Caractéristique 2&#10;..."
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Prestation active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingPrestation ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
