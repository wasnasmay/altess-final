'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Image as ImageIcon, Video, FileText, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import AdminNavigation from '@/components/AdminNavigation';

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  seo_content: string;
  price_from: number;
  image_url: string;
  features: string[];
  gallery_images: string[];
  gallery_videos: any[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function OrchestraFormulasAdmin() {
  const router = useRouter();
  const [formulas, setFormulas] = useState<OrchestraFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<OrchestraFormula | null>(null);
  const [currentGalleryImage, setCurrentGalleryImage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    seo_content: '',
    price_from: '',
    image_url: '',
    features: '',
    gallery_images: [] as string[],
    gallery_videos: [] as any[],
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadFormulas();
  }, []);

  async function loadFormulas() {
    try {
      const { data, error } = await supabase
        .from('orchestra_formulas')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFormulas(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des formules');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveFormula() {
    try {
      const features = formData.features.split('\n').filter(f => f.trim());

      const formulaData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        seo_content: formData.seo_content,
        price_from: parseFloat(formData.price_from),
        image_url: formData.image_url,
        features,
        gallery_images: formData.gallery_images,
        gallery_videos: formData.gallery_videos,
        display_order: formData.display_order,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingFormula) {
        const { error } = await supabase
          .from('orchestra_formulas')
          .update(formulaData)
          .eq('id', editingFormula.id);

        if (error) throw error;
        toast.success('Formule mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('orchestra_formulas')
          .insert([formulaData]);

        if (error) throw error;
        toast.success('Formule créée avec succès');
      }

      setDialogOpen(false);
      resetForm();
      loadFormulas();
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
  }

  async function deleteFormula(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formule ?')) return;

    try {
      const { error } = await supabase
        .from('orchestra_formulas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Formule supprimée avec succès');
      loadFormulas();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('orchestra_formulas')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Formule ${!currentStatus ? 'activée' : 'désactivée'}`);
      loadFormulas();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  }

  function openEditDialog(formula: OrchestraFormula) {
    setEditingFormula(formula);
    setFormData({
      name: formula.name,
      slug: formula.slug,
      description: formula.description,
      seo_content: formula.seo_content || '',
      price_from: formula.price_from.toString(),
      image_url: formula.image_url,
      features: formula.features.join('\n'),
      gallery_images: formula.gallery_images || [],
      gallery_videos: formula.gallery_videos || [],
      display_order: formula.display_order,
      is_active: formula.is_active,
    });
    setDialogOpen(true);
  }

  function openNewDialog() {
    setEditingFormula(null);
    resetForm();
    setDialogOpen(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      slug: '',
      description: '',
      seo_content: '',
      price_from: '',
      image_url: '',
      features: '',
      gallery_images: [],
      gallery_videos: [],
      display_order: 0,
      is_active: true,
    });
    setEditingFormula(null);
  }

  function addGalleryImage() {
    if (currentGalleryImage.trim()) {
      setFormData({
        ...formData,
        gallery_images: [...formData.gallery_images, currentGalleryImage.trim()]
      });
      setCurrentGalleryImage('');
    }
  }

  function removeGalleryImage(index: number) {
    setFormData({
      ...formData,
      gallery_images: formData.gallery_images.filter((_, i) => i !== index)
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AdminNavigation title="Gestion des Formules d'Orchestre" />
      <div className="flex justify-end items-center mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Formule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFormula ? 'Modifier la formule' : 'Nouvelle formule'}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="general">
                  <FileText className="w-4 h-4 mr-2" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <FileText className="w-4 h-4 mr-2" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="gallery">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Galerie
                </TabsTrigger>
                <TabsTrigger value="features">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Prestations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Formule Solo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="solo"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description courte *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description courte pour les cards"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_from">Prix à partir de (€) *</Label>
                    <Input
                      id="price_from"
                      type="number"
                      value={formData.price_from}
                      onChange={(e) => setFormData({ ...formData, price_from: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Ordre d'affichage</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="image_url">URL de l'image principale *</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="mt-2 w-full h-48 object-cover rounded" />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Formule active</Label>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <div>
                  <Label htmlFor="seo_content">Contenu SEO détaillé *</Label>
                  <Textarea
                    id="seo_content"
                    value={formData.seo_content}
                    onChange={(e) => setFormData({ ...formData, seo_content: e.target.value })}
                    placeholder="Description détaillée avec mots-clés pour le référencement..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Ce texte sera affiché sur la page de détail. Incluez des mots-clés pertinents pour le SEO.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="space-y-4">
                <div>
                  <Label>Galerie d'images</Label>
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={currentGalleryImage}
                      onChange={(e) => setCurrentGalleryImage(e.target.value)}
                      placeholder="URL de l'image"
                    />
                    <Button type="button" onClick={addGalleryImage}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {formData.gallery_images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Les vidéos de démonstration proviennent de la section "Vidéos de Démonstration" et sont automatiquement ajoutées à la galerie.
                </p>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div>
                  <Label htmlFor="features">Prestations incluses (une par ligne) *</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="1 musicien professionnel&#10;Répertoire oriental classique&#10;2 heures de prestation&#10;Système son inclus"
                    rows={10}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveFormula}>
                {editingFormula ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {formulas.map((formula) => (
          <Card key={formula.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    {formula.name}
                    <Badge variant={formula.is_active ? 'default' : 'secondary'}>
                      {formula.is_active ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                      )}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{formula.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(formula)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(formula.id, formula.is_active)}
                  >
                    {formula.is_active ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFormula(formula.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img src={formula.image_url} alt={formula.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">{formula.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">{formula.price_from.toLocaleString('fr-FR')} €</Badge>
                    <span className="text-muted-foreground">Ordre: {formula.display_order}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Galerie ({formula.gallery_images?.length || 0} images)
                    </h4>
                    {formula.gallery_images && formula.gallery_images.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {formula.gallery_images.slice(0, 6).map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Prestations</h4>
                    <ul className="text-sm space-y-1">
                      {formula.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                      {formula.features.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          +{formula.features.length - 3} autres...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
