'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

type Formula = {
  id: string;
  name: string;
  slug: string;
};

type CarouselMedia = {
  id: string;
  title: string;
  description: string | null;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  category: string;
  formula_id: string | null;
  is_active: boolean;
  order_position: number;
};

type FormData = {
  title: string;
  description: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string;
  category: string;
  formula_id: string | null;
  is_active: boolean;
  order_position: number;
};

export default function OrientaleMusiqueImagesAdmin() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [images, setImages] = useState<CarouselMedia[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CarouselMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'image',
    url: '',
    thumbnail_url: '',
    category: 'formula_demo',
    formula_id: null,
    is_active: true,
    order_position: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [formulasRes, imagesRes] = await Promise.all([
        supabase
          .from('orchestra_formulas')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('carousel_media')
          .select('*')
          .or('category.eq.formula_demo,category.eq.home')
          .order('order_position')
      ]);

      if (formulasRes.data) setFormulas(formulasRes.data);
      if (imagesRes.data) setImages(imagesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingImage(null);
    setFormData({
      title: '',
      description: '',
      type: 'image',
      url: '',
      thumbnail_url: '',
      category: 'formula_demo',
      formula_id: formulas[0]?.id || null,
      is_active: true,
      order_position: images.length + 1
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(image: CarouselMedia) {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description || '',
      type: image.type,
      url: image.url,
      thumbnail_url: image.thumbnail_url || '',
      category: image.category,
      formula_id: image.formula_id,
      is_active: image.is_active,
      order_position: image.order_position
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        url: formData.url.trim(),
        thumbnail_url: formData.thumbnail_url.trim() || null,
        category: formData.category,
        formula_id: formData.formula_id,
        is_active: formData.is_active,
        order_position: formData.order_position
      };

      if (editingImage) {
        const { error } = await supabase
          .from('carousel_media')
          .update(dataToSave)
          .eq('id', editingImage.id);

        if (error) throw error;
        toast.success('Image modifiée !');
      } else {
        const { error } = await supabase
          .from('carousel_media')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Image ajoutée !');
      }

      setIsDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

    try {
      const { error } = await supabase
        .from('carousel_media')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      toast.success('Image supprimée');
      await loadData();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  const imagesByFormula = images.filter(img => img.category === 'formula_demo');
  const homeImages = images.filter(img => img.category === 'home');

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 text-amber-500 animate-pulse mx-auto mb-4" />
          <p className="text-amber-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-amber-500" />
            Galeries & Images
          </h1>
          <p className="text-amber-600/70 mt-1">Gérez les images des formules et du carrousel</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une Image
        </Button>
      </div>

      {/* Home Carousel */}
      <Card className="bg-gradient-to-br from-amber-950/20 to-black border-amber-700/30">
        <CardHeader>
          <CardTitle className="text-amber-300 flex items-center justify-between">
            <span>Carrousel Page d'Accueil</span>
            <Badge className="bg-amber-600 text-black">{homeImages.length} images</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeImages.map((img) => (
              <Card key={img.id} className="bg-black/50 border-amber-700/20 overflow-hidden group">
                <div className="aspect-video relative">
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(img)}
                      className="bg-amber-600 hover:bg-amber-700 text-black"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(img.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h4 className="text-sm font-medium text-amber-300 truncate">{img.title}</h4>
                  <p className="text-xs text-amber-600/70">Position: {img.order_position}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Images par Formule */}
      {formulas.map((formula) => {
        const formulaImages = imagesByFormula.filter(img => img.formula_id === formula.id);
        return (
          <Card key={formula.id} className="bg-gradient-to-br from-amber-950/20 to-black border-amber-700/30">
            <CardHeader>
              <CardTitle className="text-amber-300 flex items-center justify-between">
                <span>Galerie : {formula.name}</span>
                <Badge className="bg-yellow-600 text-black">{formulaImages.length} images</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formulaImages.length === 0 ? (
                <div className="text-center text-amber-600/50 py-8">
                  Aucune image pour cette formule.<br />
                  Ajoutez-en une avec le bouton ci-dessus !
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {formulaImages.map((img) => (
                    <Card key={img.id} className="bg-black/50 border-amber-700/20 overflow-hidden group">
                      <div className="aspect-video relative">
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(img)}
                            className="bg-amber-600 hover:bg-amber-700 text-black"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(img.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h4 className="text-sm font-medium text-amber-300 truncate">{img.title}</h4>
                        <p className="text-xs text-amber-600/70">Position: {img.order_position}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-amber-950/95 to-black border-amber-700/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-300 text-xl">
              {editingImage ? 'Modifier l\'Image' : 'Ajouter une Image'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <Label className="text-amber-300">Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-black/50 border-amber-700/30 text-white"
                placeholder="Ex: Performance Live Orchestre"
              />
            </div>

            <div>
              <Label className="text-amber-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-black/50 border-amber-700/30 text-white"
                placeholder="Description optionnelle"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-amber-300">Catégorie *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full bg-black/50 border border-amber-700/30 rounded-md px-3 py-2 text-white"
                >
                  <option value="home">Carrousel Accueil</option>
                  <option value="formula_demo">Galerie Formule</option>
                </select>
              </div>

              {formData.category === 'formula_demo' && (
                <div>
                  <Label className="text-amber-300">Formule *</Label>
                  <select
                    value={formData.formula_id || ''}
                    onChange={(e) => setFormData({ ...formData, formula_id: e.target.value || null })}
                    className="w-full bg-black/50 border border-amber-700/30 rounded-md px-3 py-2 text-white"
                  >
                    {formulas.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <Label className="text-amber-300">URL de l'Image * (Pexels, Unsplash...)</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-black/50 border-amber-700/30 text-white"
                placeholder="https://images.pexels.com/..."
              />
              <p className="text-xs text-amber-600/70 mt-1">
                Recommandation : Pexels.com (1200px largeur)
              </p>
            </div>

            <div>
              <Label className="text-amber-300">URL Thumbnail (optionnel)</Label>
              <Input
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="bg-black/50 border-amber-700/30 text-white"
                placeholder="https://images.pexels.com/... (version 400px)"
              />
            </div>

            <div>
              <Label className="text-amber-300">Position d'affichage</Label>
              <Input
                type="number"
                min={1}
                value={formData.order_position}
                onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 1 })}
                className="bg-black/50 border-amber-700/30 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label className="text-amber-300">Image active (visible sur le site)</Label>
            </div>

            {formData.url && (
              <div className="border border-amber-700/30 rounded-lg p-2">
                <p className="text-xs text-amber-600/70 mb-2">Aperçu :</p>
                <img src={formData.url} alt="Preview" className="w-full rounded" />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-amber-700/30">
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
              className="flex-1 border-amber-700/30 text-amber-300 hover:bg-amber-900/20"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingImage ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
