'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Upload, MoveUp, MoveDown, Image as ImageIcon, Video, Music2 } from 'lucide-react';
import AdminNavigation from '@/components/AdminNavigation';
import Image from 'next/image';

type CarouselMedia = {
  id: string;
  title: string;
  description: string | null;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  category: string;
  order_position: number;
  is_active: boolean;
  orchestra_formula_id: string | null;
  created_at: string;
};

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
};

export default function CarouselManagementPage() {
  const [media, setMedia] = useState<CarouselMedia[]>([]);
  const [formulas, setFormulas] = useState<OrchestraFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'image' as 'image' | 'video',
    url: '',
    thumbnail_url: '',
    category: 'home',
    orchestra_formula_id: null as string | null,
    is_active: true,
  });

  useEffect(() => {
    loadMedia();
    loadFormulas();
  }, []);

  const loadMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('carousel_media')
        .select('*')
        .order('orchestra_formula_id', { nullsFirst: true })
        .order('category')
        .order('order_position');

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFormulas = async () => {
    try {
      const { data, error } = await supabase
        .from('orchestra_formulas')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setFormulas(data || []);
    } catch (error: any) {
      console.error('Error loading formulas:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('carousel-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('carousel-media')
        .getPublicUrl(filePath);

      if (isImage) {
        setFormData({ ...formData, url: publicUrl });
      } else {
        setFormData({ ...formData, thumbnail_url: publicUrl });
      }

      toast({
        title: 'Succès',
        description: 'Fichier téléchargé avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const filterConditions = formData.orchestra_formula_id
        ? { orchestra_formula_id: formData.orchestra_formula_id }
        : { category: formData.category, orchestra_formula_id: null };

      const existingMedia = media.filter(m => {
        if (formData.orchestra_formula_id) {
          return m.orchestra_formula_id === formData.orchestra_formula_id;
        }
        return m.category === formData.category && !m.orchestra_formula_id;
      });

      const maxOrder = Math.max(...existingMedia.map(m => m.order_position), -1);

      if (editingId) {
        const { error } = await supabase
          .from('carousel_media')
          .update({
            title: formData.title,
            description: formData.description || null,
            type: formData.type,
            url: formData.url,
            thumbnail_url: formData.thumbnail_url || null,
            category: formData.category,
            orchestra_formula_id: formData.orchestra_formula_id,
            is_active: formData.is_active,
          })
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Média mis à jour avec succès',
        });
      } else {
        const { error } = await supabase
          .from('carousel_media')
          .insert({
            ...formData,
            description: formData.description || null,
            thumbnail_url: formData.thumbnail_url || null,
            order_position: maxOrder + 1,
            created_by: user.id,
          });

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Média ajouté avec succès',
        });
      }

      resetForm();
      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: CarouselMedia) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      type: item.type,
      url: item.url,
      thumbnail_url: item.thumbnail_url || '',
      category: item.category,
      orchestra_formula_id: item.orchestra_formula_id,
      is_active: item.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) return;

    try {
      const { error } = await supabase
        .from('carousel_media')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Média supprimé avec succès',
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const item = media.find(m => m.id === id);
    if (!item) return;

    const sameGroupMedia = media.filter(m => {
      if (item.orchestra_formula_id) {
        return m.orchestra_formula_id === item.orchestra_formula_id;
      }
      return m.category === item.category && !m.orchestra_formula_id;
    }).sort((a, b) => a.order_position - b.order_position);

    const currentIndex = sameGroupMedia.findIndex(m => m.id === id);

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sameGroupMedia.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapItem = sameGroupMedia[swapIndex];

    try {
      const { error: error1 } = await supabase
        .from('carousel_media')
        .update({ order_position: swapItem.order_position })
        .eq('id', item.id);

      const { error: error2 } = await supabase
        .from('carousel_media')
        .update({ order_position: item.order_position })
        .eq('id', swapItem.id);

      if (error1 || error2) throw error1 || error2;

      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      type: 'image',
      url: '',
      thumbnail_url: '',
      category: 'home',
      orchestra_formula_id: null,
      is_active: true,
    });
  };

  const generalMedia = media.filter(m => !m.orchestra_formula_id);
  const groupedGeneral = generalMedia.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CarouselMedia[]>);

  const formulaMedia = formulas.map(formula => ({
    formula,
    media: media.filter(m => m.orchestra_formula_id === formula.id),
  })).filter(group => group.media.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <AdminNavigation title="Gestion du Carousel" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>{editingId ? 'Modifier' : 'Ajouter'} un Média</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'image' | 'video') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <Label className="flex items-center gap-2 mb-2">
                    <Music2 className="w-4 h-4 text-primary" />
                    Formule d&apos;orchestre (optionnel)
                  </Label>
                  <Select
                    value={formData.orchestra_formula_id || 'none'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      orchestra_formula_id: value === 'none' ? null : value
                    })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Sélectionner une formule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune (Général)</SelectItem>
                      {formulas.map(formula => (
                        <SelectItem key={formula.id} value={formula.id}>
                          {formula.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400 mt-1">
                    Si vous sélectionnez une formule, le média apparaîtra uniquement sur la page de cette formule
                  </p>
                </div>

                {!formData.orchestra_formula_id && (
                  <div>
                    <Label>Catégorie (pour médias généraux)</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Accueil</SelectItem>
                        <SelectItem value="gallery">Galerie</SelectItem>
                        <SelectItem value="featured">À la une</SelectItem>
                        <SelectItem value="events">Événements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>URL ou Fichier</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://... ou télécharger"
                    className="bg-slate-800 border-slate-700 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={uploading}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </div>
                </div>

                {formData.type === 'video' && (
                  <div>
                    <Label>Miniature (optionnelle)</Label>
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="URL de la miniature"
                      className="bg-slate-800 border-slate-700 mb-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={uploading}
                      onClick={() => document.getElementById('thumb-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Télécharger miniature
                    </Button>
                    <input
                      id="thumb-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Actif</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="py-8 text-center">
                  Chargement...
                </CardContent>
              </Card>
            ) : (
              <>
                {formulaMedia.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Music2 className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Médias par Formule d&apos;Orchestre</h3>
                    </div>
                    {formulaMedia.map(({ formula, media: items }) => (
                      <Card key={formula.id} className="bg-slate-900 border-slate-800 border-primary/30">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Music2 className="w-5 h-5 text-primary" />
                            {formula.name}
                            <span className="text-sm font-normal text-slate-400">({items.length})</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {items.sort((a, b) => a.order_position - b.order_position).map((item, index) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg"
                              >
                                <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-slate-700">
                                  {item.type === 'image' ? (
                                    <Image
                                      src={item.url}
                                      alt={item.title}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {item.thumbnail_url ? (
                                        <Image
                                          src={item.thumbnail_url}
                                          alt={item.title}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <Video className="w-8 h-8 text-slate-500" />
                                      )}
                                    </div>
                                  )}
                                  {item.type === 'image' && (
                                    <ImageIcon className="absolute top-1 left-1 w-4 h-4 text-white/80" />
                                  )}
                                  {item.type === 'video' && (
                                    <Video className="absolute top-1 left-1 w-4 h-4 text-white/80" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-sm text-slate-400 truncate">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {item.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                    <span className="text-xs text-slate-500">#{item.order_position}</span>
                                  </div>
                                </div>

                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleMove(item.id, 'up')}
                                    disabled={index === 0}
                                  >
                                    <MoveUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleMove(item.id, 'down')}
                                    disabled={index === items.length - 1}
                                  >
                                    <MoveDown className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}

                {Object.keys(groupedGeneral).length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-slate-400 mt-8">
                      <ImageIcon className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Médias Généraux</h3>
                    </div>
                    {Object.entries(groupedGeneral).map(([category, items]) => (
                      <Card key={category} className="bg-slate-900 border-slate-800">
                        <CardHeader>
                          <CardTitle className="capitalize">
                            {category === 'home' ? 'Accueil' :
                             category === 'gallery' ? 'Galerie' :
                             category === 'featured' ? 'À la une' :
                             category === 'events' ? 'Événements' : category}
                            {' '}({items.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {items.sort((a, b) => a.order_position - b.order_position).map((item, index) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg"
                              >
                                <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-slate-700">
                                  {item.type === 'image' ? (
                                    <Image
                                      src={item.url}
                                      alt={item.title}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {item.thumbnail_url ? (
                                        <Image
                                          src={item.thumbnail_url}
                                          alt={item.title}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <Video className="w-8 h-8 text-slate-500" />
                                      )}
                                    </div>
                                  )}
                                  {item.type === 'image' && (
                                    <ImageIcon className="absolute top-1 left-1 w-4 h-4 text-white/80" />
                                  )}
                                  {item.type === 'video' && (
                                    <Video className="absolute top-1 left-1 w-4 h-4 text-white/80" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-sm text-slate-400 truncate">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {item.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                    <span className="text-xs text-slate-500">#{item.order_position}</span>
                                  </div>
                                </div>

                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleMove(item.id, 'up')}
                                    disabled={index === 0}
                                  >
                                    <MoveUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleMove(item.id, 'down')}
                                    disabled={index === items.length - 1}
                                  >
                                    <MoveDown className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}

                {formulaMedia.length === 0 && Object.keys(groupedGeneral).length === 0 && (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-12 text-center text-slate-400">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>Aucun média pour le moment</p>
                      <p className="text-sm mt-2">Ajoutez votre premier média avec le formulaire</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
