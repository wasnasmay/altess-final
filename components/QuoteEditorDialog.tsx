'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Download, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuoteEditorDialog({ open, onOpenChange }: QuoteEditorDialogProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: 'Prestation musicale', quantity: 1, unitPrice: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const generatePDF = () => {
    toast.success('Devis généré avec succès ! Téléchargement en cours...');
    setTimeout(() => {
      toast.info('Fonctionnalité PDF en cours de développement');
    }, 1000);
  };

  const total = calculateTotal();
  const tva = total * 0.2;
  const totalTTC = total + tva;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-light text-white">
                Éditeur de Devis Professionnel
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                Créez un devis élégant en 3 clics
              </p>
            </div>
          </div>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6 py-4">
            <Card className="bg-black/50 border-zinc-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-amber-600 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center text-xs">1</div>
                  Informations Client
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 text-xs">Nom du client *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="M. ou Mme..."
                      className="bg-zinc-900 border-zinc-800 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Email</Label>
                    <Input
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@email.com"
                      className="bg-zinc-900 border-zinc-800 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Date de l'événement</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Lieu</Label>
                    <Input
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Paris, Lyon..."
                      className="bg-zinc-900 border-zinc-800 text-white mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center text-xs">2</div>
                    Prestations
                  </h3>
                  <Button
                    onClick={addItem}
                    size="sm"
                    className="bg-amber-600/10 border border-amber-600/30 text-amber-600 hover:bg-amber-600/20"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                      <div className="md:col-span-5">
                        {index === 0 && (
                          <Label className="text-gray-400 text-xs mb-1 block">Description</Label>
                        )}
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Ex: Orchestre 5 musiciens"
                          className="bg-zinc-900 border-zinc-800 text-white h-9 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        {index === 0 && (
                          <Label className="text-gray-400 text-xs mb-1 block">Qté</Label>
                        )}
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="bg-zinc-900 border-zinc-800 text-white h-9 text-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        {index === 0 && (
                          <Label className="text-gray-400 text-xs mb-1 block">Prix unitaire €</Label>
                        )}
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="bg-zinc-900 border-zinc-800 text-white h-9 text-sm"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-sm text-gray-400 flex-1 text-right">
                          {(item.quantity * item.unitPrice).toFixed(2)}€
                        </span>
                        {items.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="h-9 w-9 p-0 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <div className="space-y-2 max-w-xs ml-auto">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Sous-total HT:</span>
                      <span className="text-white font-medium">{total.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>TVA (20%):</span>
                      <span className="text-white font-medium">{tva.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-amber-600 pt-2 border-t border-zinc-800">
                      <span>Total TTC:</span>
                      <span>{totalTTC.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-zinc-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-amber-600 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center text-xs">3</div>
                  Notes & Conditions
                </h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Conditions de paiement, délais, remarques particulières..."
                  rows={4}
                  className="bg-zinc-900 border-zinc-800 text-white resize-none"
                />
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowPreview(true)}
                variant="outline"
                className="flex-1 border-zinc-800 text-gray-300 hover:bg-zinc-900"
              >
                <Eye className="w-4 h-4 mr-2" />
                Prévisualiser
              </Button>
              <Button
                onClick={generatePDF}
                disabled={!clientName || items.some(i => !i.description)}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600 font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Générer PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <Card className="bg-white text-black p-8">
              <div className="border-b-4 border-amber-600 pb-6 mb-6">
                <h1 className="text-3xl font-bold text-amber-600 mb-2">DEVIS</h1>
                <p className="text-sm text-gray-600">N° {Date.now().toString().slice(-8)}</p>
                <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-amber-600 mb-2">Prestataire:</h3>
                  <p className="text-sm">ALTESS Événementiel</p>
                  <p className="text-sm text-gray-600">contact@altess.fr</p>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-600 mb-2">Client:</h3>
                  <p className="text-sm font-medium">{clientName || 'Nom du client'}</p>
                  {clientEmail && <p className="text-sm text-gray-600">{clientEmail}</p>}
                  {eventDate && (
                    <p className="text-sm text-gray-600 mt-2">
                      Événement: {new Date(eventDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  {eventLocation && <p className="text-sm text-gray-600">Lieu: {eventLocation}</p>}
                </div>
              </div>

              <table className="w-full mb-6">
                <thead className="bg-amber-600 text-white">
                  <tr>
                    <th className="text-left p-2 text-sm">Description</th>
                    <th className="text-center p-2 text-sm w-20">Qté</th>
                    <th className="text-right p-2 text-sm w-32">P.U. HT</th>
                    <th className="text-right p-2 text-sm w-32">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2 text-sm">{item.description}</td>
                      <td className="p-2 text-sm text-center">{item.quantity}</td>
                      <td className="p-2 text-sm text-right">{item.unitPrice.toFixed(2)}€</td>
                      <td className="p-2 text-sm text-right font-medium">
                        {(item.quantity * item.unitPrice).toFixed(2)}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total HT:</span>
                    <span className="font-medium">{total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA (20%):</span>
                    <span className="font-medium">{tva.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t-2 border-amber-600 pt-2">
                    <span>Total TTC:</span>
                    <span className="text-amber-600">{totalTTC.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {notes && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-amber-600 mb-2 text-sm">Conditions:</h3>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </Card>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                className="flex-1 border-zinc-800 text-gray-300 hover:bg-zinc-900"
              >
                Retour à l'édition
              </Button>
              <Button
                onClick={generatePDF}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600 font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
