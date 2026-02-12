'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Users, Ticket, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TicketCategory {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  color?: string;
}

interface TicketQuotaManagerProps {
  eventId: string;
  eventTitle: string;
  categories: TicketCategory[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TicketQuotaManager({
  eventId,
  eventTitle,
  categories,
  isOpen,
  onClose,
  onUpdate
}: TicketQuotaManagerProps) {
  const [quotas, setQuotas] = useState<Record<string, number>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.quota }), {})
  );
  const [saving, setSaving] = useState(false);

  const handleQuotaChange = (categoryId: string, value: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (value < category.sold) {
      toast.error('Quota invalide', {
        description: `Le quota ne peut pas être inférieur aux billets déjà vendus (${category.sold})`
      });
      return;
    }

    setQuotas(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = categories.map(category => {
        const ticketCategories = category as any;
        return supabase
          .from('ticket_categories')
          .update({ quota: quotas[category.id] })
          .eq('id', category.id);
      });

      await Promise.all(updates);

      toast.success('Quotas mis à jour', {
        description: 'Les quotas de billets ont été enregistrés avec succès'
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating quotas:', error);
      toast.error('Erreur', {
        description: 'Impossible de mettre à jour les quotas'
      });
    } finally {
      setSaving(false);
    }
  };

  const getTotalQuota = () => Object.values(quotas).reduce((sum, q) => sum + (q || 0), 0);
  const getTotalSold = () => categories.reduce((sum, cat) => sum + (cat.sold || 0), 0);
  const getAvailability = (category: TicketCategory) => {
    const quota = quotas[category.id] || 0;
    const sold = category.sold || 0;
    const percentage = quota > 0 ? (sold / quota) * 100 : 0;
    return { percentage, remaining: quota - sold };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Ticket className="w-6 h-6 mr-3 text-amber-500" />
            Gestion des quotas - {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-400">Total quotas</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-slate-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Nombre total de places disponibles</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold text-white">{getTotalQuota()}</div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-400">Billets vendus</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-400">{getTotalSold()}</div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-400">Disponibles</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {getTotalQuota() - getTotalSold()}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {categories.map((category) => {
              const availability = getAvailability(category);
              const quota = quotas[category.id];

              return (
                <div
                  key={category.id}
                  className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || '#F59E0B' }}
                      />
                      <div>
                        <h4 className="font-medium text-white">{category.name}</h4>
                        <p className="text-sm text-slate-400">
                          {category.price.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={availability.percentage >= 90 ? 'destructive' : 'default'}
                      className={
                        availability.percentage >= 90
                          ? ''
                          : availability.percentage >= 70
                          ? 'bg-amber-600'
                          : 'bg-green-600'
                      }
                    >
                      {category.sold} / {quota} vendus
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <Label htmlFor={`quota-${category.id}`} className="text-sm text-slate-300 min-w-[100px]">
                        Quota maximum
                      </Label>
                      <div className="flex-1">
                        <Slider
                          id={`quota-${category.id}`}
                          min={category.sold}
                          max={Math.max(500, quota * 2)}
                          step={1}
                          value={[quota]}
                          onValueChange={([value]) => handleQuotaChange(category.id, value)}
                          className="flex-1"
                        />
                      </div>
                      <Input
                        type="number"
                        value={quota}
                        onChange={(e) => handleQuotaChange(category.id, parseInt(e.target.value) || 0)}
                        min={category.sold}
                        className="w-24 bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {availability.remaining > 0
                          ? `${availability.remaining} places restantes`
                          : 'Complet'}
                      </span>
                      <span>{availability.percentage.toFixed(0)}% rempli</span>
                    </div>

                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          availability.percentage >= 90
                            ? 'bg-red-500'
                            : availability.percentage >= 70
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(availability.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {quota < category.sold && (
                    <div className="mt-3 flex items-start space-x-2 bg-red-600/10 border border-red-600/30 rounded p-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-400">
                        Le quota ne peut pas être inférieur aux billets déjà vendus
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les quotas'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
