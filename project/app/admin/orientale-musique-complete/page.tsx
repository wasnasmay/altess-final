'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Music, Video, Image as ImageIcon, Star, Plus, Edit, Trash2, Save, X, Crown } from 'lucide-react';
import { toast } from 'sonner';

type Formula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  seo_content: string;
  seo_keywords: string[];
  price_from: number;
  duration_hours: number;
  musicians_count: number;
  features: string[];
  image_url: string;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  stripe_payment_link?: string;
};

type CarouselItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  thumbnail_url: string;
  category: string;
  formula_id?: string;
  is_active: boolean;
  order_position: number;
};

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  is_active: boolean;
  display_order: number;
};

type StarArtist = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  specialties: string[];
  is_active: boolean;
  display_order: number;
};

export default function OrientaleMusiqueAdminPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [stars, setStars] = useState<StarArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFormula, setEditingFormula] = useState<Partial<Formula> | null>(null);
  const [editingCarousel, setEditingCarousel] = useState<Partial<CarouselItem> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<DemoVideo> | null>(null);
  const [editingStar, setEditingStar] = useState<Partial<StarArtist> | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const [formulasRes, carouselRes, videosRes, starsRes] = await Promise.all([
        supabase.from('orchestra_formulas').select('*').order('display_order'),
        supabase.from('carousel_media').select('*').order('order_position'),
        supabase.from('demo_videos').select('*').order('display_order'),
        supabase.from('stars').select('*').order('display_order')
      ]);

      if (formulasRes.data) setFormulas(formulasRes.data);
      if (carouselRes.data) setCarouselItems(carouselRes.data);
      if (videosRes.data) setDemoVideos(videosRes.data);
      if (starsRes.data) setStars(starsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function saveFormula() {
    if (!editingFormula) return;

    try {
      const dataToSave = {
        ...editingFormula,
        features: Array.isArray(editingFormula.features)
          ? editingFormula.features
          : typeof editingFormula.features === 'string'
          ? (editingFormula.features as string).split('\n').filter((f: string) => f.trim())
          : []
      };

      if (editingFormula.id) {
        await supabase
          .from('orchestra_formulas')
          .update(dataToSave)
          .eq('id', editingFormula.id);
        toast.success('Formule mise à jour');
      } else {
        await supabase
          .from('orchestra_formulas')
          .insert([dataToSave]);
        toast.success('Formule créée');
      }

      loadAllData();
      setEditingFormula(null);
    } catch (error) {
      console.error('Error saving formula:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function deleteFormula(id: string) {
    if (!confirm('Supprimer cette formule ?')) return;

    try {
      await supabase.from('orchestra_formulas').delete().eq('id', id);
      toast.success('Formule supprimée');
      loadAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  async function saveCarousel() {
    if (!editingCarousel) return;

    try {
      if (editingCarousel.id) {
        await supabase
          .from('carousel_media')
          .update(editingCarousel)
          .eq('id', editingCarousel.id);
        toast.success('Carousel mis à jour');
      } else {
        await supabase
          .from('carousel_media')
          .insert([editingCarousel]);
        toast.success('Carousel créé');
      }

      loadAllData();
      setEditingCarousel(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  async function deleteCarousel(id: string) {
    if (!confirm('Supprimer cet élément ?')) return;

    try {
      await supabase.from('carousel_media').delete().eq('id', id);
      toast.success('Élément supprimé');
      loadAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  async function saveVideo() {
    if (!editingVideo) return;

    try {
      if (editingVideo.id) {
        await supabase
          .from('demo_videos')
          .update(editingVideo)
          .eq('id', editingVideo.id);
        toast.success('Vidéo mise à jour');
      } else {
        await supabase
          .from('demo_videos')
          .insert([editingVideo]);
        toast.success('Vidéo créée');
      }

      loadAllData();
      setEditingVideo(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm('Supprimer cette vidéo ?')) return;

    try {
      await supabase.from('demo_videos').delete().eq('id', id);
      toast.success('Vidéo supprimée');
      loadAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  async function saveStar() {
    if (!editingStar) return;

    try {
      const dataToSave = {
        ...editingStar,
        specialties: Array.isArray(editingStar.specialties)
          ? editingStar.specialties
          : typeof editingStar.specialties === 'string'
          ? (editingStar.specialties as string).split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : []
      };

      if (editingStar.id) {
        await supabase
          .from('stars')
          .update(dataToSave)
          .eq('id', editingStar.id);
        toast.success('Star mise à jour');
      } else {
        await supabase
          .from('stars')
          .insert([dataToSave]);
        toast.success('Star créée');
      }

      loadAllData();
      setEditingStar(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  async function deleteStar(id: string) {
    if (!confirm('Supprimer cette star ?')) return;

    try {
      await supabase.from('stars').delete().eq('id', id);
      toast.success('Star supprimée');
      loadAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center gap-3">
        <Crown className="w-8 h-8 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold">Gestion Orientale Musique</h1>
          <p className="text-sm text-muted-foreground">Gérer toutes les données du site Orientale Musique</p>
        </div>
      </div>

      <Tabs defaultValue="formulas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="formulas">
            <Music className="w-4 h-4 mr-2" />
            Formules ({formulas.length})
          </TabsTrigger>
          <TabsTrigger value="carousel">
            <Video className="w-4 h-4 mr-2" />
            Carousel ({carouselItems.length})
          </TabsTrigger>
          <TabsTrigger value="demos">
            <ImageIcon className="w-4 h-4 mr-2" />
            Démos ({demoVideos.length})
          </TabsTrigger>
          <TabsTrigger value="stars">
            <Star className="w-4 h-4 mr-2" />
            Stars ({stars.length})
          </TabsTrigger>
        </TabsList>

        {/* Formulas Tab */}
        <TabsContent value="formulas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Formules d'Orchestre</h2>
            <Dialog open={!!editingFormula} onOpenChange={(open) => !open && setEditingFormula(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingFormula({ is_active: true, display_order: formulas.length + 1, features: [] })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Formule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingFormula?.id ? 'Modifier' : 'Créer'} une Formule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nom *</Label>
                      <Input
                        value={editingFormula?.name || ''}
                        onChange={(e) => setEditingFormula({ ...editingFormula, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Slug *</Label>
                      <Input
                        value={editingFormula?.slug || ''}
                        onChange={(e) => setEditingFormula({ ...editingFormula, slug: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description courte *</Label>
                    <Textarea
                      value={editingFormula?.description || ''}
                      onChange={(e) => setEditingFormula({ ...editingFormula, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Description longue (SEO)</Label>
                    <Textarea
                      value={editingFormula?.long_description || ''}
                      onChange={(e) => setEditingFormula({ ...editingFormula, long_description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Prix (€) *</Label>
                      <Input
                        type="number"
                        value={editingFormula?.price_from || 0}
                        onChange={(e) => setEditingFormula({ ...editingFormula, price_from: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Durée (heures) *</Label>
                      <Input
                        type="number"
                        value={editingFormula?.duration_hours || 0}
                        onChange={(e) => setEditingFormula({ ...editingFormula, duration_hours: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Nb musiciens *</Label>
                      <Input
                        type="number"
                        value={editingFormula?.musicians_count || 0}
                        onChange={(e) => setEditingFormula({ ...editingFormula, musicians_count: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Features (une par ligne)</Label>
                    <Textarea
                      value={editingFormula && Array.isArray(editingFormula.features) ? editingFormula.features.join('\n') : ''}
                      onChange={(e) => setEditingFormula({ ...editingFormula, features: e.target.value.split('\n') })}
                      rows={5}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>

                  <div>
                    <Label>URL Image</Label>
                    <Input
                      value={editingFormula?.image_url || ''}
                      onChange={(e) => setEditingFormula({ ...editingFormula, image_url: e.target.value })}
                      placeholder="/image.jpg"
                    />
                  </div>

                  <div>
                    <Label>Lien Stripe</Label>
                    <Input
                      value={editingFormula?.stripe_payment_link || ''}
                      onChange={(e) => setEditingFormula({ ...editingFormula, stripe_payment_link: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingFormula?.is_popular || false}
                        onCheckedChange={(checked) => setEditingFormula({ ...editingFormula, is_popular: checked })}
                      />
                      <Label>Populaire</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingFormula?.is_active || false}
                        onCheckedChange={(checked) => setEditingFormula({ ...editingFormula, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingFormula(null)}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button onClick={saveFormula}>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {formulas.map((formula) => (
              <Card key={formula.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{formula.name}</h3>
                        {formula.is_popular && (
                          <Badge className="bg-amber-500">Populaire</Badge>
                        )}
                        {!formula.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{formula.description}</p>
                      <div className="flex gap-4 text-sm">
                        <span><strong>{formula.price_from}€</strong></span>
                        <span>{formula.duration_hours}h</span>
                        <span>{formula.musicians_count} musiciens</span>
                        <span>{Array.isArray(formula.features) ? formula.features.length : 0} features</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingFormula(formula)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteFormula(formula.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Carousel Tab */}
        <TabsContent value="carousel" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Carousel Média</h2>
            <Dialog open={!!editingCarousel} onOpenChange={(open) => !open && setEditingCarousel(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCarousel({ is_active: true, order_position: carouselItems.length + 1, type: 'video', category: 'home' })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel Élément
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingCarousel?.id ? 'Modifier' : 'Créer'} un Élément Carousel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={editingCarousel?.title || ''}
                      onChange={(e) => setEditingCarousel({ ...editingCarousel, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editingCarousel?.description || ''}
                      onChange={(e) => setEditingCarousel({ ...editingCarousel, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>URL Vidéo</Label>
                      <Input
                        value={editingCarousel?.url || ''}
                        onChange={(e) => setEditingCarousel({ ...editingCarousel, url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Thumbnail URL</Label>
                      <Input
                        value={editingCarousel?.thumbnail_url || ''}
                        onChange={(e) => setEditingCarousel({ ...editingCarousel, thumbnail_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Catégorie</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={editingCarousel?.category || 'home'}
                        onChange={(e) => setEditingCarousel({ ...editingCarousel, category: e.target.value })}
                      >
                        <option value="home">Page d'accueil</option>
                        <option value="formula_demo">Démo formule</option>
                      </select>
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Input
                        type="number"
                        value={editingCarousel?.order_position || 0}
                        onChange={(e) => setEditingCarousel({ ...editingCarousel, order_position: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingCarousel?.is_active || false}
                      onCheckedChange={(checked) => setEditingCarousel({ ...editingCarousel, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingCarousel(null)}>Annuler</Button>
                    <Button onClick={saveCarousel}>Enregistrer</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {carouselItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{item.title}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                        {!item.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingCarousel(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCarousel(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Demo Videos Tab */}
        <TabsContent value="demos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Vidéos Démo</h2>
            <Dialog open={!!editingVideo} onOpenChange={(open) => !open && setEditingVideo(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingVideo({ is_active: true, display_order: demoVideos.length + 1 })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Vidéo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingVideo?.id ? 'Modifier' : 'Créer'} une Vidéo Démo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={editingVideo?.title || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editingVideo?.description || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>URL Vidéo</Label>
                    <Input
                      value={editingVideo?.video_url || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, video_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Thumbnail URL</Label>
                    <Input
                      value={editingVideo?.thumbnail_url || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail_url: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingVideo?.is_active || false}
                      onCheckedChange={(checked) => setEditingVideo({ ...editingVideo, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingVideo(null)}>Annuler</Button>
                    <Button onClick={saveVideo}>Enregistrer</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {demoVideos.map((video) => (
              <Card key={video.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{video.title}</h3>
                        {!video.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingVideo(video)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteVideo(video.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stars Tab */}
        <TabsContent value="stars" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Nos Stars</h2>
            <Dialog open={!!editingStar} onOpenChange={(open) => !open && setEditingStar(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingStar({ is_active: true, display_order: stars.length + 1, specialties: [] })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Star
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingStar?.id ? 'Modifier' : 'Créer'} une Star</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={editingStar?.name || ''}
                      onChange={(e) => setEditingStar({ ...editingStar, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Rôle</Label>
                    <Input
                      value={editingStar?.role || ''}
                      onChange={(e) => setEditingStar({ ...editingStar, role: e.target.value })}
                      placeholder="ex: Chanteur Principal"
                    />
                  </div>
                  <div>
                    <Label>Biographie</Label>
                    <Textarea
                      value={editingStar?.bio || ''}
                      onChange={(e) => setEditingStar({ ...editingStar, bio: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Photo URL</Label>
                    <Input
                      value={editingStar?.photo_url || ''}
                      onChange={(e) => setEditingStar({ ...editingStar, photo_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Spécialités (séparées par des virgules)</Label>
                    <Input
                      value={editingStar && Array.isArray(editingStar.specialties) ? editingStar.specialties.join(', ') : ''}
                      onChange={(e) => setEditingStar({ ...editingStar, specialties: e.target.value.split(',').map(s => s.trim()) })}
                      placeholder="Chant, Oud, Improvisation"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingStar?.is_active || false}
                      onCheckedChange={(checked) => setEditingStar({ ...editingStar, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingStar(null)}>Annuler</Button>
                    <Button onClick={saveStar}>Enregistrer</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {stars.map((star) => (
              <Card key={star.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{star.name}</h3>
                        <Badge variant="outline">{star.role}</Badge>
                        {!star.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{star.bio}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingStar(star)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteStar(star.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
