'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import AdminNavigation from '@/components/AdminNavigation';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MoveUp, MoveDown, BookOpen, Eye } from 'lucide-react';

type Pack = {
  id: string;
  title: string;
  slug: string;
  description: string;
  full_description: string;
  skills_acquired: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  cover_image: string | null;
  level: string;
  duration_hours: number;
  price: number;
  is_published: boolean;
  display_order: number;
};

const levels = [
  { value: 'débutant', label: 'Débutant' },
  { value: 'intermédiaire', label: 'Intermédiaire' },
  { value: 'avancé', label: 'Avancé' },
];

export default function AdminAcademyPacksPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    full_description: '',
    skills_acquired: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    cover_image: '',
    level: 'débutant',
    duration_hours: 0,
    price: 0,
    is_published: false,
    display_order: 0,
  });

  useEffect(() => {
    loadPacks();
  }, []);

  async function loadPacks() {
    try {
      const { data, error } = await supabase
        .from('academy_packs')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPacks(data || []);
    } catch (error) {
      console.error('Error loading packs:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(pack: Pack) {
    setEditingPack(pack);
    setFormData({
      title: pack.title,
      slug: pack.slug,
      description: pack.description,
      full_description: pack.full_description,
      skills_acquired: pack.skills_acquired.join('\n'),
      seo_title: pack.seo_title || '',
      seo_description: pack.seo_description || '',
      seo_keywords: pack.seo_keywords || '',
      cover_image: pack.cover_image || '',
      level: pack.level,
      duration_hours: pack.duration_hours,
      price: pack.price,
      is_published: pack.is_published,
      display_order: pack.display_order,
    });
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingPack(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      full_description: '',
      skills_acquired: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      cover_image: '',
      level: 'débutant',
      duration_hours: 0,
      price: 0,
      is_published: false,
      display_order: packs.length,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const packData = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      full_description: formData.full_description,
      skills_acquired: formData.skills_acquired
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      seo_title: formData.seo_title || null,
      seo_description: formData.seo_description || null,
      seo_keywords: formData.seo_keywords || null,
      cover_image: formData.cover_image || null,
      level: formData.level,
      duration_hours: formData.duration_hours,
      price: formData.price,
      is_published: formData.is_published,
      display_order: formData.display_order,
    };

    try {
      if (editingPack) {
        const { error } = await supabase
          .from('academy_packs')
          .update(packData)
          .eq('id', editingPack.id);

        if (error) throw error;
        toast.success('Pack mis à jour');
      } else {
        const { error } = await supabase
          .from('academy_packs')
          .insert([packData]);

        if (error) throw error;
        toast.success('Pack créé');
      }

      setDialogOpen(false);
      loadPacks();
    } catch (error) {
      console.error('Error saving pack:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr ? Cela supprimera aussi tous les cours et leçons associés.')) return;

    try {
      const { error } = await supabase
        .from('academy_packs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Pack supprimé');
      loadPacks();
    } catch (error) {
      console.error('Error deleting pack:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = packs.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === packs.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newPacks = [...packs];
    [newPacks[index], newPacks[newIndex]] = [newPacks[newIndex], newPacks[index]];

    try {
      await Promise.all(
        newPacks.map((p, idx) =>
          supabase
            .from('academy_packs')
            .update({ display_order: idx })
            .eq('id', p.id)
        )
      );
      loadPacks();
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
        <AdminNavigation title="Gestion des Packs LMS" />
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
      <AdminNavigation title="Gestion des Packs LMS" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Packs de Formation</h1>
          <Button onClick={handleAdd} size="lg" className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Pack
          </Button>
        </div>

        <div className="grid gap-6">
          {packs.map((pack) => (
            <Card key={pack.id} className="bg-gradient-to-br from-slate-900 to-black border-amber-500/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-amber-500" />
                      {pack.title}
                      {!pack.is_published && (
                        <span className="text-sm font-normal text-muted-foreground">(Brouillon)</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{pack.slug} • {pack.level} • {pack.duration_hours}h • {pack.price}€
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/academy/${pack.slug}`)}
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(pack.id, 'up')}
                      disabled={packs[0].id === pack.id}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(pack.id, 'down')}
                      disabled={packs[packs.length - 1].id === pack.id}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(pack)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(pack.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{pack.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPack ? 'Modifier le pack' : 'Nouveau pack'}
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
                    if (!editingPack) {
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
              <Label htmlFor="description">Description courte *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                rows={8}
                required
              />
            </div>

            <div>
              <Label htmlFor="skills_acquired">Compétences acquises (une par ligne) *</Label>
              <Textarea
                id="skills_acquired"
                value={formData.skills_acquired}
                onChange={(e) => setFormData({ ...formData, skills_acquired: e.target.value })}
                rows={6}
                placeholder="Posture correcte&#10;Maîtrise technique&#10;..."
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="level">Niveau *</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration_hours">Durée (heures) *</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min="0"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Prix (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cover_image">Image de couverture (URL)</Label>
              <Input
                id="cover_image"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                placeholder="https://..."
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

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="is_published">Pack publié (visible par tous)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {editingPack ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
