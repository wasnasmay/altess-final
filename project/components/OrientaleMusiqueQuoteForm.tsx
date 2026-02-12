'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Send, Calendar, Users, Clock, MapPin, Phone, Mail, User, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import CityAutocomplete from '@/components/CityAutocomplete';

type QuoteFormData = {
  client_name: string;
  client_email: string;
  client_phone: string;
  event_date: string;
  event_city: string;
  event_type: string;
  guests_count: number;
  duration_hours: number;
  musicians_count: number;
  additional_notes: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  formulaName?: string;
};

export default function OrientaleMusiqueQuoteForm({ isOpen, onClose, formulaName }: Props) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<QuoteFormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    event_date: '',
    event_city: '',
    event_type: formulaName || '',
    guests_count: 50,
    duration_hours: 4,
    musicians_count: 5,
    additional_notes: '',
  });

  if (!isOpen) return null;

  function updateField(field: keyof QuoteFormData, value: string | number) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function nextStep() {
    if (step < 3) setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit() {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .insert([{
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_phone: formData.client_phone,
          event_date: formData.event_date,
          event_city: formData.event_city,
          event_type: formData.event_type,
          guests_count: formData.guests_count,
          duration_hours: formData.duration_hours,
          musicians_count: formData.musicians_count,
          additional_notes: formData.additional_notes,
          status: 'pending',
          source: 'orientale-musique'
        }]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Demande de devis envoyée avec succès !');

      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setStep(1);
        setFormData({
          client_name: '',
          client_email: '',
          client_phone: '',
          event_date: '',
          event_city: '',
          event_type: formulaName || '',
          guests_count: 50,
          duration_hours: 4,
          musicians_count: 5,
          additional_notes: '',
        });
      }, 3000);
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-amber-950/95 to-black border-2 border-amber-700/40 shadow-2xl shadow-amber-900/30 my-8">
        <CardHeader className="border-b border-amber-700/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Demande de Devis Personnalisé
              </CardTitle>
              <p className="text-sm text-amber-400/70 mt-2">
                {formulaName ? `Formule ${formulaName}` : 'Événement sur mesure'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-600/50">
                <CheckCircle className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-amber-300 mb-4">Demande Envoyée !</h3>
              <p className="text-amber-200/70 mb-2">
                Votre demande de devis a été envoyée avec succès.
              </p>
              <p className="text-amber-400/60 text-sm">
                Notre équipe vous contactera dans les 24 heures.
              </p>
            </div>
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      s === step
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black shadow-lg shadow-amber-600/50'
                        : s < step
                        ? 'bg-amber-700 text-amber-200'
                        : 'bg-amber-950/50 text-amber-600/50 border border-amber-800/30'
                    }`}>
                      {s}
                    </div>
                    {s < 3 && (
                      <div className={`flex-1 h-1 mx-2 transition-all ${
                        s < step ? 'bg-amber-700' : 'bg-amber-950/30'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Informations Personnelles */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black mb-2">
                      <User className="w-3 h-3 mr-1" />
                      Étape 1/3
                    </Badge>
                    <h3 className="text-xl font-bold text-amber-200">Vos Coordonnées</h3>
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Nom complet *</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => updateField('client_name', e.target.value)}
                      placeholder="Jean Dupont"
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100 placeholder:text-amber-600/50"
                    />
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Email *</Label>
                    <Input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => updateField('client_email', e.target.value)}
                      placeholder="jean.dupont@email.com"
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100 placeholder:text-amber-600/50"
                    />
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Téléphone *</Label>
                    <Input
                      type="tel"
                      value={formData.client_phone}
                      onChange={(e) => updateField('client_phone', e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100 placeholder:text-amber-600/50"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Détails de l'Événement */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black mb-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      Étape 2/3
                    </Badge>
                    <h3 className="text-xl font-bold text-amber-200">Détails de l'Événement</h3>
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Date de l'événement *</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => updateField('event_date', e.target.value)}
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100"
                    />
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Ville de l'événement *</Label>
                    <CityAutocomplete
                      value={formData.event_city}
                      onSelect={(city) => updateField('event_city', city)}
                      placeholder="Paris, Lyon, Marseille..."
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100"
                    />
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Type d'événement</Label>
                    <Input
                      value={formData.event_type}
                      onChange={(e) => updateField('event_type', e.target.value)}
                      placeholder="Mariage, Gala, Soirée privée..."
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100 placeholder:text-amber-600/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-amber-300 mb-2 block">Nombre d'invités</Label>
                      <Input
                        type="number"
                        value={formData.guests_count}
                        onChange={(e) => updateField('guests_count', parseInt(e.target.value))}
                        min="1"
                        className="bg-amber-950/30 border-amber-700/40 text-amber-100"
                      />
                    </div>
                    <div>
                      <Label className="text-amber-300 mb-2 block">Durée (heures)</Label>
                      <Input
                        type="number"
                        value={formData.duration_hours}
                        onChange={(e) => updateField('duration_hours', parseInt(e.target.value))}
                        min="1"
                        max="12"
                        className="bg-amber-950/30 border-amber-700/40 text-amber-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Préférences & Notes */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black mb-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Étape 3/3
                    </Badge>
                    <h3 className="text-xl font-bold text-amber-200">Vos Préférences</h3>
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Nombre de musiciens souhaités</Label>
                    <Input
                      type="number"
                      value={formData.musicians_count}
                      onChange={(e) => updateField('musicians_count', parseInt(e.target.value))}
                      min="3"
                      max="15"
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100"
                    />
                    <p className="text-xs text-amber-500/60 mt-1">Entre 3 et 15 musiciens professionnels</p>
                  </div>

                  <div>
                    <Label className="text-amber-300 mb-2 block">Informations complémentaires</Label>
                    <Textarea
                      value={formData.additional_notes}
                      onChange={(e) => updateField('additional_notes', e.target.value)}
                      placeholder="Décrivez vos attentes, ambiance souhaitée, répertoire spécifique..."
                      rows={6}
                      className="bg-amber-950/30 border-amber-700/40 text-amber-100 placeholder:text-amber-600/50"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-amber-700/30">
                {step > 1 && (
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="border-amber-700 text-amber-400 hover:bg-amber-900/20"
                  >
                    Précédent
                  </Button>
                )}

                <div className="flex-1" />

                {step < 3 ? (
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold"
                    disabled={
                      (step === 1 && (!formData.client_name || !formData.client_email || !formData.client_phone)) ||
                      (step === 2 && (!formData.event_date || !formData.event_city))
                    }
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la Demande
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
