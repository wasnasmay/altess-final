'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Music } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import AdminNavigation from '@/components/AdminNavigation';

type Instrument = {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  image_url: string;
  category: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

const categories = ['Cordes', 'Vents', 'Percussions', 'Voix', 'Autres'];

export default function InstrumentsAdmin() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_hour: '',
    image_url: '',
    category: 'Cordes',
    is_available: true,
  });

  useEffect(() => {
    loadInstruments();
  }, []);

  async function loadInstruments() {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setInstruments(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des instruments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveInstrument() {
    try {
      const instrumentData = {
        name: formData.name,
        description: formData.description,
        price_per_hour: parseFloat(formData.price_per_hour),
        image_url: formData.image_url,
        category: formData.category,
        is_available: formData.is_available,
        updated_at: new Date().toISOString(),
      };

      if (editingInstrument) {
        const { error } = await supabase
          .from('instruments')
          .update(instrumentData)
          .eq('id', editingInstrument.id);

        if (error) throw error;
        toast.success('Instrument mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('instruments')
          .insert([instrumentData]);

        if (error) throw error;
        toast.success('Instrument créé avec succès');
      }

      setDialogOpen(false);
      resetForm();
      loadInstruments();
    } catch (error: any) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  }

  async function deleteInstrument(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet instrument ?')) return;

    try {
      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Instrument supprimé avec succès');
      loadInstruments();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  }

  async function toggleAvailable(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('instruments')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Instrument ${!currentStatus ? 'disponible' : 'indisponible'}`);
      loadInstruments();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  }

  function openEditDialog(instrument: Instrument) {
    setEditingInstrument(instrument);
    setFormData({
      name: instrument.name,
      description: instrument.description,
      price_per_hour: instrument.price_per_hour.toString(),
      image_url: instrument.image_url,
      category: instrument.category,
      is_available: instrument.is_available,
    });
    setDialogOpen(true);
  }

  function openNewDialog() {
    setEditingInstrument(null);
    resetForm();
    setDialogOpen(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price_per_hour: '',
      image_url: '',
      category: 'Cordes',
      is_available: true,
    });
    setEditingInstrument(null);
  }

  const groupedInstruments = instruments.reduce((acc, instrument) => {
    if (!acc[instrument.category]) {
      acc[instrument.category] = [];
    }
    acc[instrument.category].push(instrument);
    return acc;
  }, {} as Record<string, Instrument[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AdminNavigation title="Gestion des Instruments" />
      <div className="flex justify-end items-center mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Instrument
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstrument ? 'Modifier l\'Instrument' : 'Nouvel Instrument'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Oud"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'instrument"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="price_per_hour">Prix par heure (€)</Label>
                <Input
                  id="price_per_hour"
                  type="number"
                  value={formData.price_per_hour}
                  onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
                  placeholder="150"
                />
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="image_url">URL de l&apos;image</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available">Instrument disponible</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={saveInstrument}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedInstruments).map(([category, categoryInstruments]) => (
          <div key={category}>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Music className="w-6 h-6 mr-2" />
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryInstruments.map((instrument) => (
                <Card key={instrument.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{instrument.name}</CardTitle>
                        <Badge variant={instrument.is_available ? 'default' : 'secondary'}>
                          {instrument.is_available ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Disponible
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Indisponible
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={instrument.image_url}
                      alt={instrument.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                    <p className="text-sm text-muted-foreground mb-3">{instrument.description}</p>
                    <p className="text-lg font-bold text-primary mb-4">
                      {instrument.price_per_hour}€/heure
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(instrument)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant={instrument.is_available ? 'secondary' : 'default'}
                        onClick={() => toggleAvailable(instrument.id, instrument.is_available)}
                      >
                        {instrument.is_available ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteInstrument(instrument.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
