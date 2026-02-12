'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ArrowLeft, Check, X } from 'lucide-react';
import AdminNavigation from '@/components/AdminNavigation';

interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  base_price: number;
  items: any[];
  validity_days: number;
  terms_conditions: string;
  is_active: boolean;
  created_at: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  base_price: string;
  validity_days: string;
  terms_conditions: string;
  is_active: boolean;
  items: string;
}

interface QuoteItem {
  name: string;
  quantity: number;
  unit: string;
}

export default function QuoteTemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [itemsList, setItemsList] = useState<QuoteItem[]>([
    { name: 'Prestation musicale', quantity: 1, unit: 'forfait' }
  ]);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    base_price: '',
    validity_days: '30',
    terms_conditions: 'Ce devis est valable 30 jours. Un acompte de 30% sera demandé à la confirmation. Le solde est à régler le jour de la prestation.',
    is_active: true,
    items: JSON.stringify([
      { name: 'Prestation musicale', quantity: 1, unit: 'forfait' }
    ], null, 2)
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadTemplates();
  }, [user, router]);

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erreur lors du chargement des modèles');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(template: QuoteTemplate) {
    setEditingTemplate(template);

    let itemsData = [];
    try {
      itemsData = typeof template.items === 'string'
        ? JSON.parse(template.items)
        : template.items || [];
    } catch (e) {
      itemsData = [];
    }

    setItemsList(itemsData.length > 0 ? itemsData : [{ name: '', quantity: 1, unit: '' }]);
    setFormData({
      name: template.name,
      description: template.description || '',
      base_price: template.base_price.toString(),
      validity_days: template.validity_days.toString(),
      terms_conditions: template.terms_conditions || '',
      is_active: template.is_active,
      items: JSON.stringify(itemsData, null, 2)
    });
    setShowDialog(true);
  }

  function handleNew() {
    setEditingTemplate(null);
    setItemsList([{ name: 'Prestation musicale', quantity: 1, unit: 'forfait' }]);
    setFormData({
      name: '',
      description: '',
      base_price: '',
      validity_days: '30',
      terms_conditions: 'Ce devis est valable 30 jours. Un acompte de 30% sera demandé à la confirmation. Le solde est à régler le jour de la prestation.',
      is_active: true,
      items: JSON.stringify([
        { name: 'Prestation musicale', quantity: 1, unit: 'forfait' }
      ], null, 2)
    });
    setShowDialog(true);
  }

  function addItem() {
    setItemsList([...itemsList, { name: '', quantity: 1, unit: '' }]);
  }

  function removeItem(index: number) {
    const newItems = itemsList.filter((_, i) => i !== index);
    setItemsList(newItems);
  }

  function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
    const newItems = [...itemsList];
    newItems[index] = { ...newItems[index], [field]: value };
    setItemsList(newItems);
  }

  async function handleSave() {
    try {
      if (!formData.name || !formData.base_price) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const validItems = itemsList.filter(item => item.name.trim() !== '');

      if (validItems.length === 0) {
        toast.error('Veuillez ajouter au moins un élément');
        return;
      }

      const templateData = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        validity_days: parseInt(formData.validity_days),
        terms_conditions: formData.terms_conditions,
        is_active: formData.is_active,
        items: validItems
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('quote_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Modèle mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('quote_templates')
          .insert(templateData);

        if (error) throw error;
        toast.success('Modèle créé avec succès');
      }

      setShowDialog(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

    try {
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Modèle supprimé');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleToggleActive(template: QuoteTemplate) {
    try {
      const { error } = await supabase
        .from('quote_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      toast.success(template.is_active ? 'Modèle désactivé' : 'Modèle activé');
      loadTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <AdminNavigation title="Gestion des Modèles de Devis" />
        <p className="text-muted-foreground mb-6">Créez et gérez vos modèles de devis prédéfinis</p>
        <div className="flex justify-end mb-8">
          <Button onClick={handleNew} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Formule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden border-2 hover:border-primary transition-colors">
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{template.name}</CardTitle>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardDescription className="mb-4 min-h-[40px]">
                  {template.description || 'Aucune description'}
                </CardDescription>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      À partir de {template.base_price.toFixed(0)}€
                    </p>
                  </div>

                  <div className="text-sm space-y-1">
                    {template.items && template.items.length > 0 ? (
                      template.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Aucun élément</p>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Validité: {template.validity_days} jours
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggleActive(template)}
                  >
                    {template.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun modèle de devis créé</p>
              <Button onClick={handleNew}>
                <Plus className="w-4 h-4 mr-2" />
                Créer votre premier modèle
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle de devis'}
              </DialogTitle>
              <DialogDescription>
                Définissez les paramètres de votre modèle de devis
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nom de la formule *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Formule Solo"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la formule..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="base_price">Prix de base (€) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="800"
                  />
                </div>

                <div>
                  <Label htmlFor="validity_days">Validité (jours)</Label>
                  <Input
                    id="validity_days"
                    type="number"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Éléments inclus *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter un élément
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {itemsList.map((item, index) => (
                      <div key={index} className="flex gap-2 p-3 bg-muted/30 rounded-lg border">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Nom de l'élément (ex: Orchestre complet)"
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Quantité"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                            <Input
                              placeholder="Unité (ex: groupe)"
                              value={item.unit}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={itemsList.length === 1}
                          className="self-start"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="terms">Conditions générales</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    placeholder="Conditions et modalités de paiement..."
                    rows={4}
                  />
                </div>

                <div className="col-span-2 flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Activer ce modèle (visible pour la création de devis)
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {editingTemplate ? 'Mettre à jour' : 'Créer le modèle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
