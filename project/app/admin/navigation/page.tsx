'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import AdminNavigation from '@/components/AdminNavigation';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  target: string;
  created_at: string;
  updated_at: string;
}

export default function NavigationManagementPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    href: '',
    icon: 'Circle',
    is_active: true,
    target: '_self',
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchItems();
    }
  }, [profile]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      toast.error('Erreur lors du chargement des éléments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('navigation_items')
          .update({
            label: formData.label,
            href: formData.href,
            icon: formData.icon,
            is_active: formData.is_active,
            target: formData.target,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Élément mis à jour avec succès');
      } else {
        const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) : 0;

        const { error } = await supabase
          .from('navigation_items')
          .insert({
            ...formData,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Élément créé avec succès');
      }

      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving navigation item:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const { error } = await supabase
        .from('navigation_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Élément supprimé avec succès');
      fetchItems();
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (item: NavigationItem) => {
    try {
      const { error } = await supabase
        .from('navigation_items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Élément désactivé' : 'Élément activé');
      fetchItems();
    } catch (error) {
      console.error('Error toggling navigation item:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex(i => i.id === id);
    if (
      (direction === 'up' && itemIndex === 0) ||
      (direction === 'down' && itemIndex === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    [newItems[itemIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[itemIndex]];

    try {
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order_index: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('navigation_items')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Ordre mis à jour');
      fetchItems();
    } catch (error) {
      console.error('Error reordering navigation items:', error);
      toast.error('Erreur lors du réordonnancement');
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      href: '',
      icon: 'Circle',
      is_active: true,
      target: '_self',
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      href: item.href,
      icon: item.icon,
      is_active: item.is_active,
      target: item.target,
    });
    setDialogOpen(true);
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <AdminNavigation title="Navigation" />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Accès non autorisé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AdminNavigation title="Gestion Navigation" />
      <div className="container mx-auto px-4 py-8">
        <Card className="border-primary/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-light gold-gradient">
                  Gestion de la Navigation
                </CardTitle>
                <CardDescription className="mt-2">
                  Gérez les éléments du menu principal du site
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetForm}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau lien
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Modifier le lien' : 'Nouveau lien de navigation'}
                    </DialogTitle>
                    <DialogDescription>
                      Configurez les détails du lien de navigation
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="label">Libellé</Label>
                        <Input
                          id="label"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          placeholder="Accueil"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="href">URL</Label>
                        <Input
                          id="href"
                          value={formData.href}
                          onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                          placeholder="/page"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icon">Icône (Lucide React)</Label>
                        <Input
                          id="icon"
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          placeholder="Home"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Utilisez le nom d&apos;une icône Lucide (ex: Home, Calendar, MapPin)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target">Cible</Label>
                        <select
                          id="target"
                          value={formData.target}
                          onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                        >
                          <option value="_self">Même fenêtre</option>
                          <option value="_blank">Nouvelle fenêtre</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_active: checked })
                          }
                        />
                        <Label htmlFor="is_active">Actif</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-amber-500 to-amber-600"
                      >
                        {loading ? 'Enregistrement...' : editingItem ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Ordre</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Icône</TableHead>
                    <TableHead className="w-[100px] text-center">Statut</TableHead>
                    <TableHead className="w-[200px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun élément de navigation
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleReorder(item.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleReorder(item.id, 'down')}
                              disabled={index === items.length - 1}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {item.href}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.icon}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleActive(item)}
                          >
                            {item.is_active ? (
                              <Eye className="w-4 h-4 text-green-500" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
