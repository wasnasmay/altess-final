'use client';

import { useEffect, useState } from 'react';
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
import { Plus, Edit, Trash2, MoveUp, MoveDown } from 'lucide-react';

type Partner = {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  full_description: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  main_image: string | null;
  gallery_images: string[];
  services: string[];
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  display_order: number;
  is_active: boolean;
};

type PartnerCategory = {
  id: string;
  code: string;
  label: string;
  icon_name: string;
  description: string;
  display_order: number;
  is_active: boolean;
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'autre',
    short_description: '',
    full_description: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_image: '',
    main_image: '',
    gallery_images: '',
    services: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadPartners(), loadCategories()]);
  }

  async function loadPartners() {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Erreur lors du chargement des partenaires');
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('partner_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    }
  }

  function handleEdit(partner: Partner) {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      category: partner.category,
      short_description: partner.short_description,
      full_description: partner.full_description,
      seo_title: partner.seo_title || '',
      seo_description: partner.seo_description || '',
      seo_keywords: partner.seo_keywords || '',
      og_image: partner.og_image || '',
      main_image: partner.main_image || '',
      gallery_images: partner.gallery_images.join('\n'),
      services: partner.services.join('\n'),
      website: partner.website || '',
      phone: partner.phone || '',
      email: partner.email || '',
      address: partner.address || '',
      display_order: partner.display_order,
      is_active: partner.is_active,
    });
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingPartner(null);
    setFormData({
      name: '',
      slug: '',
      category: 'autre',
      short_description: '',
      full_description: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      og_image: '',
      main_image: '',
      gallery_images: '',
      services: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      display_order: partners.length,
      is_active: true,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const partnerData = {
      name: formData.name,
      slug: formData.slug,
      category: formData.category,
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
      services: formData.services
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      website: formData.website || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    try {
      if (editingPartner) {
        const { error } = await supabase
          .from('partners')
          .update(partnerData)
          .eq('id', editingPartner.id);

        if (error) throw error;
        toast.success('Partenaire mis à jour');
      } else {
        const { error } = await supabase
          .from('partners')
          .insert([partnerData]);

        if (error) throw error;
        toast.success('Partenaire créé');
      }

      setDialogOpen(false);
      loadPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) return;

    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Partenaire supprimé');
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = partners.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === partners.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newPartners = [...partners];
    [newPartners[index], newPartners[newIndex]] = [newPartners[newIndex], newPartners[index]];

    try {
      await Promise.all(
        newPartners.map((p, idx) =>
          supabase
            .from('partners')
            .update({ display_order: idx })
            .eq('id', p.id)
        )
      );
      loadPartners();
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
        <AdminNavigation title="Gestion des Partenaires" />
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
      <AdminNavigation title="Gestion des Partenaires" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Gestion des Partenaires</h1>
            <Button onClick={handleAdd} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Partenaire
            </Button>
          </div>
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                Catégories disponibles
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <div key={cat.code} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="font-medium">{cat.code}</span>
                    <span className="text-muted-foreground">→ {cat.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Total: <strong>{partners.length}</strong> partenaires •
                <strong className="ml-2">{partners.filter(p => p.is_active).length}</strong> actifs
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      {partner.name}
                      {!partner.is_active && (
                        <span className="text-sm font-normal text-muted-foreground">(Inactif)</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{partner.slug} • <span className="font-semibold text-primary">{categories.find(c => c.code === partner.category)?.label || partner.category}</span>
                    </p>
                    {partner.services.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {partner.services.length} service{partner.services.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(partner.id, 'up')}
                      disabled={partners[0].id === partner.id}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(partner.id, 'down')}
                      disabled={partners[partners.length - 1].id === partner.id}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(partner)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(partner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{partner.short_description}</p>
                {partner.main_image && (
                  <div className="mt-3">
                    <img
                      src={partner.main_image}
                      alt={partner.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {partner.website && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      🌐 Site web
                    </span>
                  )}
                  {partner.phone && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                      📞 Téléphone
                    </span>
                  )}
                  {partner.email && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                      ✉️ Email
                    </span>
                  )}
                  {partner.address && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                      📍 Adresse
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {partners.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Aucun partenaire pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Nouveau Partenaire" pour commencer</p>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire'}
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
                    if (!editingPartner) {
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

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.code} value={cat.code}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
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
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  💡 <strong>Astuce:</strong> Utilisez des images de Pexels pour des visuels professionnels gratuits.
                  <br />
                  Format recommandé: https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="main_image">Image principale (URL) *</Label>
                  <Input
                    id="main_image"
                    value={formData.main_image}
                    onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                    placeholder="https://images.pexels.com/photos/..."
                  />
                  {formData.main_image && (
                    <img
                      src={formData.main_image}
                      alt="Aperçu"
                      className="mt-2 w-full h-48 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.alt = 'Image invalide';
                      }}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="og_image">Image Open Graph (URL)</Label>
                  <Input
                    id="og_image"
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder="https://images.pexels.com/photos/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">Pour le partage sur les réseaux sociaux</p>
                </div>
                <div>
                  <Label htmlFor="gallery_images">Galerie (une URL par ligne)</Label>
                  <Textarea
                    id="gallery_images"
                    value={formData.gallery_images}
                    onChange={(e) => setFormData({ ...formData, gallery_images: e.target.value })}
                    rows={4}
                    placeholder="https://images.pexels.com/photos/...&#10;https://images.pexels.com/photos/...&#10;https://images.pexels.com/photos/..."
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Services proposés</h3>
              <Label htmlFor="services">Services (un par ligne) *</Label>
              <Textarea
                id="services"
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                rows={6}
                placeholder="Service 1&#10;Service 2&#10;Service 3&#10;..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ces services seront affichés sous forme de liste à puces sur la page du partenaire
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Partenaire actif</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingPartner ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
