'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Check, X, Clock, Bookmark } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

type AvailabilityStatus = 'available' | 'partially_available' | 'unavailable' | 'booked';

type AvailabilityItem = {
  id: string;
  date: string;
  status: AvailabilityStatus;
  notes: string | null;
};

const statusConfig = {
  available: {
    label: 'Disponible',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    borderColor: 'border-green-500',
    icon: Check,
  },
  partially_available: {
    label: 'Partiellement disponible',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
    borderColor: 'border-orange-500',
    icon: Clock,
  },
  unavailable: {
    label: 'Indisponible',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
    icon: X,
  },
  booked: {
    label: 'Réservé',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500',
    icon: Bookmark,
  },
};

export default function ProviderAvailabilityCalendar({ partnerId }: { partnerId: string }) {
  const [availability, setAvailability] = useState<Record<string, AvailabilityItem>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState<{
    status: AvailabilityStatus;
    notes: string;
  }>({
    status: 'available',
    notes: '',
  });

  useEffect(() => {
    loadAvailability();
  }, [partnerId, currentMonth]);

  async function loadAvailability() {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(addMonths(currentMonth, 2)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('partner_availability')
        .select('*')
        .eq('partner_id', partnerId)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      const availabilityMap: Record<string, AvailabilityItem> = {};
      (data || []).forEach((item) => {
        availabilityMap[item.date] = item;
      });
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Erreur lors du chargement des disponibilités');
    } finally {
      setLoading(false);
    }
  }

  function handleDateClick(date: Date | undefined) {
    if (!date) return;
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = availability[dateStr];
    if (existing) {
      setFormData({
        status: existing.status,
        notes: existing.notes || '',
      });
    } else {
      setFormData({ status: 'available', notes: '' });
    }
    setShowDialog(true);
  }

  async function handleSaveAvailability() {
    if (!selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existing = availability[dateStr];

      if (existing) {
        const { error } = await supabase
          .from('partner_availability')
          .update({
            status: formData.status,
            notes: formData.notes || null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partner_availability')
          .insert({
            partner_id: partnerId,
            date: dateStr,
            status: formData.status,
            notes: formData.notes || null,
          });

        if (error) throw error;
      }

      toast.success('Disponibilité mise à jour');
      setShowDialog(false);
      loadAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  }

  async function handleDeleteAvailability() {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = availability[dateStr];
    if (!existing) return;

    if (!confirm('Supprimer cette disponibilité ?')) return;

    try {
      const { error } = await supabase
        .from('partner_availability')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      toast.success('Disponibilité supprimée');
      setShowDialog(false);
      loadAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  function getDayClassName(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability[dateStr];
    if (!avail) return '';
    const config = statusConfig[avail.status];
    return `relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:rounded-full after:${config.color}`;
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/20">
      <CardHeader>
        <CardTitle className="text-2xl text-amber-400">Calendrier de Disponibilité</CardTitle>
        <CardDescription className="text-slate-400">
          Gérez votre disponibilité en cliquant sur les dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const count = Object.values(availability).filter((a) => a.status === status).length;
            return (
              <div
                key={status}
                className={`flex items-center gap-3 p-4 bg-black/40 border-2 ${config.borderColor} rounded-xl`}
              >
                <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400">{config.label}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-black/40 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="border-amber-500/30"
            >
              Mois précédent
            </Button>
            <h3 className="text-xl font-bold text-white">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h3>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="border-amber-500/30"
            >
              Mois suivant
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={fr}
            className="w-full"
            modifiers={{
              available: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'available';
              },
              unavailable: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'unavailable';
              },
              booked: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'booked';
              },
              partially: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return availability[dateStr]?.status === 'partially_available';
              },
            }}
            modifiersClassNames={{
              available: 'bg-green-500/20 text-green-400 font-bold',
              unavailable: 'bg-red-500/20 text-red-400 font-bold',
              booked: 'bg-blue-500/20 text-blue-400 font-bold',
              partially: 'bg-orange-500/20 text-orange-400 font-bold',
            }}
          />
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md bg-slate-900 border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="text-amber-400">
                Disponibilité du {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Définissez votre statut pour cette date
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="status" className="text-white">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: AvailabilityStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-black/40 border-amber-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes" className="text-white">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes internes..."
                  rows={3}
                  className="bg-black/40 border-amber-500/30 text-white"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              {selectedDate && availability[format(selectedDate, 'yyyy-MM-dd')] && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteAvailability}
                  className="mr-auto"
                >
                  Supprimer
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-amber-500/30"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveAvailability}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
