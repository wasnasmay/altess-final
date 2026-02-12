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
import { Plus, Edit, Trash2, MoveUp, MoveDown, Tag } from 'lucide-react';

type PartnerCategory = {
  id: string;
  code: string;
  label: string;
  icon_name: string;
  description: string;
  display_order: number;
  is_active: boolean;
};

const availableIcons = [
  'Users', 'Building2', 'Camera', 'Sparkles', 'Plane', 'Car', 'Paintbrush',
  'Music', 'Landmark', 'Briefcase', 'Heart', 'MapPin', 'Home', 'Store',
  'Utensils', 'Gift', 'Coffee', 'ShoppingBag', 'Palette', 'Cake',
  'Wine', 'Music2', 'Headphones', 'Mic', 'PartyPopper', 'Flower2'
];

export default function AdminPartnerCategoriesPage() {
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PartnerCategory | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    icon_name: 'MapPin',
    description: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('partner_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(category: PartnerCategory) {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      label: category.label,
      icon_name: category.icon_name,
      description: category.description,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingCategory(null);
    setFormData({
      code: '',
      label: '',
      icon_name: 'MapPin',
      description: '',
      display_order: categories.length,
      is_active: true,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const categoryData = {
      code: formData.code.toLowerCase().trim(),
      label: formData.label,
      icon_name: formData.icon_name,
      description: formData.description,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('partner_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Catégorie mise à jour');
      } else {
        const { error } = await supabase
          .from('partner_categories')
          .insert([categoryData]);

        if (error) throw error;
        toast.success('Catégorie créée');
      }

      setDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      if (error.code === '23505') {
        toast.error('Ce code de catégorie existe déjà');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    try {
      const { error } = await supabase
        .from('partner_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Catégorie supprimée');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

    try {
      await Promise.all(
        newCategories.map((c, idx) =>
          supabase
            .from('partner_categories')
            .update({ display_order: idx })
            .eq('id', c.id)
        )
      );
      loadCategories();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Erreur lors du réordonnancement');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Catégories de Partenaires" />
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
      <AdminNavigation title="Catégories de Partenaires" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Catégories de Partenaires</h1>
            <Button onClick={handleAdd} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle Catégorie
            </Button>
          </div>
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Tag className="text-amber-600 dark:text-amber-400" />
                Gestion des catégories
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Les catégories permettent de filtrer les partenaires sur la page publique.
                Chaque catégorie possède un code unique, un libellé et une icône.
              </p>
              <p className="text-sm text-muted-foreground">
                Total: <strong>{categories.length}</strong> catégories •
                <strong className="ml-2">{categories.filter(c => c.is_active).length}</strong> actives
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon_name}</span>
                      {category.label}
                      {!category.is_active && (
                        <span className="text-sm font-normal text-muted-foreground">(Inactif)</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Code: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{category.code}</span>
                    </p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-2">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(category.id, 'up')}
                      disabled={categories[0].id === category.id}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(category.id, 'down')}
                      disabled={categories[categories.length - 1].id === category.id}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      disabled={category.code === 'tous'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Aucune catégorie pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Nouvelle Catégorie" pour commencer</p>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code technique *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  required
                  disabled={editingCategory !== null}
                  placeholder="voyage, banque, etc."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lettres minuscules, chiffres, tirets uniquement
                </p>
              </div>
              <div>
                <Label htmlFor="label">Libellé affiché *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                  placeholder="Voyages"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="icon_name">Icône *</Label>
              <select
                id="icon_name"
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                required
              >
                {availableIcons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Icône Lucide React à utiliser pour cette catégorie
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Description courte de cette catégorie"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Catégorie active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingCategory ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
