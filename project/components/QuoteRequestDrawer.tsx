'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  Clock,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuoteRequestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName?: string;
  providerSlug?: string;
}

const eventTypes = [
  'Mariage',
  'Anniversaire',
  'Baptême',
  'Bar/Bat Mitzvah',
  'Fiançailles',
  'Soirée entreprise',
  'Gala',
  'Autre'
];

export default function QuoteRequestDrawer({
  open,
  onOpenChange,
  providerName,
  providerSlug
}: QuoteRequestDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventType: '',
    city: '',
    guestCount: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      setIsSuccess(false);
      onOpenChange(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        eventType: '',
        city: '',
        guestCount: '',
        message: ''
      });
      setDate(undefined);
    }, 2000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-zinc-950 border-t border-zinc-800 h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-amber-600 rounded-full" />
            <SheetTitle className="text-2xl font-light text-white">
              Demande de Devis
            </SheetTitle>
          </div>
          <SheetDescription className="text-gray-400 text-sm">
            {providerName ? (
              <>Demandez un devis personnalisé à <span className="text-amber-600 font-medium">{providerName}</span></>
            ) : (
              <>Remplissez le formulaire ci-dessous pour recevoir un devis personnalisé</>
            )}
          </SheetDescription>
        </SheetHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-light text-white mb-2">Demande envoyée !</h3>
            <p className="text-gray-400 text-center text-sm max-w-md">
              Votre demande de devis a été transmise avec succès. Le prestataire vous contactera dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
            <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300 leading-relaxed mb-1">
                      Réponse rapide garantie sous <span className="text-amber-600 font-medium">24h</span>
                    </p>
                    <p className="text-xs text-amber-400/80 italic">
                      Service gratuit et sans engagement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300 text-sm">
                  Nom complet *
                </Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Votre nom et prénom"
                  className="bg-black/50 border-zinc-800 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="votre@email.com"
                  className="bg-black/50 border-zinc-800 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300 text-sm">
                  Téléphone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="bg-black/50 border-zinc-800 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3 text-amber-600" />
                  Date de l'événement *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-black/50 border-zinc-800 text-white hover:bg-zinc-900 hover:text-white"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-amber-600" />
                      {date ? format(date, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="bg-zinc-900"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">
                  Type d'événement *
                </Label>
                <Select value={formData.eventType} onValueChange={(value) => handleChange('eventType', value)} required>
                  <SelectTrigger className="bg-black/50 border-zinc-800 text-white">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {eventTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-white">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-gray-300 text-sm flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  Ville de l'événement *
                </Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Paris, Lyon, Marseille..."
                  className="bg-black/50 border-zinc-800 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestCount" className="text-gray-300 text-sm flex items-center gap-2">
                  <Users className="w-3 h-3 text-amber-600" />
                  Nombre d'invités
                </Label>
                <Input
                  id="guestCount"
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => handleChange('guestCount', e.target.value)}
                  placeholder="Ex: 150"
                  className="bg-black/50 border-zinc-800 text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300 text-sm">
                Message (optionnel)
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Décrivez brièvement vos besoins, vos attentes, votre budget..."
                rows={4}
                className="bg-black/50 border-zinc-800 text-white placeholder:text-gray-600 resize-none"
              />
            </div>

            <Card className="bg-zinc-900/30 border border-zinc-800">
              <CardContent className="p-4">
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Réponse sous 24h maximum</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    <span>Service 100% gratuit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    <span>Aucun engagement de votre part</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isSubmitting || !date}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600 h-12 text-base font-semibold shadow-2xl shadow-amber-600/50 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  Envoyer ma demande
                  <Send className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
