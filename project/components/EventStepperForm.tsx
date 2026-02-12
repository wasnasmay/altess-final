'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, MapPin, Ticket, Settings, ArrowRight, ArrowLeft,
  Plus, Trash2, Upload, Image as ImageIcon, Clock, Check, Link2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import GoogleMapsLocationPicker from '@/components/GoogleMapsLocationPicker';

interface TicketCategory {
  name: string;
  price: number;
  quota: number;
  description: string;
}

interface EventStepperFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, title: 'Infos de base', icon: Settings, description: 'Titre, Affiche, Type' },
  { id: 2, title: 'Date & Lieu', icon: MapPin, description: 'Quand et où' },
  { id: 3, title: 'Billetterie', icon: Ticket, description: 'Tarifs et quotas' }
];

export default function EventStepperForm({ onClose, onSuccess }: EventStepperFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [eventType, setEventType] = useState('');

  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [customSlug, setCustomSlug] = useState('');

  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    price: 0,
    quota: 0,
    description: ''
  });

  const progress = (currentStep / STEPS.length) * 100;

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return title.trim() && shortDescription.trim() && mainImage.trim();
      case 2:
        return eventDate && venueName.trim() && city.trim();
      case 3:
        return ticketCategories.length > 0;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length && canGoNext()) {
      setCurrentStep(currentStep + 1);
    } else if (!canGoNext()) {
      toast.error('Champs obligatoires manquants', {
        description: 'Veuillez remplir tous les champs requis'
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addTicketCategory = () => {
    if (newCategory.name && newCategory.price >= 0 && newCategory.quota > 0) {
      setTicketCategories([...ticketCategories, { ...newCategory }]);
      setNewCategory({ name: '', price: 0, quota: 0, description: '' });
      setShowTicketModal(false);
      toast.success('Tarif ajouté', {
        description: `${newCategory.name} - ${newCategory.price}€`
      });
    } else {
      toast.error('Informations incomplètes', {
        description: 'Veuillez remplir tous les champs requis'
      });
    }
  };

  const removeTicketCategory = (index: number) => {
    const removed = ticketCategories[index];
    setTicketCategories(ticketCategories.filter((_, i) => i !== index));
    toast.info('Tarif supprimé', {
      description: removed.name
    });
  };

  const handleLocationSelect = (location: {
    address: string;
    city: string;
    lat: number;
    lng: number
  }) => {
    setVenueAddress(location.address);
    setCity(location.city);
    setLatitude(location.lat);
    setLongitude(location.lng);
  };

  const handleSubmit = async () => {
    if (!canGoNext()) {
      toast.error('Formulaire incomplet', {
        description: 'Veuillez ajouter au moins une catégorie de billet'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Non authentifié', {
          description: 'Vous devez être connecté pour créer un événement'
        });
        return;
      }

      const { data: organizer } = await supabase
        .from('event_organizers')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single();

      if (!organizer) {
        toast.error('Profil organisateur introuvable');
        return;
      }

      const totalQuota = ticketCategories.reduce((sum, cat) => sum + cat.quota, 0);

      const { data, error } = await supabase
        .from('public_events')
        .insert({
          organizer_id: organizer.user_id,
          title,
          short_description: shortDescription,
          full_description: fullDescription,
          main_image: mainImage,
          event_type: eventType || 'concert',
          event_date: eventDate,
          event_time: eventTime || '20:00',
          venue_name: venueName,
          venue_address: venueAddress,
          city,
          latitude,
          longitude,
          custom_slug: customSlug || undefined,
          ticket_categories: ticketCategories.map((cat) => ({
            ...cat,
            sold: 0,
            color: '#F59E0B'
          })),
          total_quota: totalQuota,
          tickets_sold: 0,
          status: 'active',
          is_active: true,
          is_visible: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Événement créé !', {
        description: 'Votre événement est maintenant en ligne'
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Erreur', {
        description: 'Impossible de créer l\'événement'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Créer un nouvel événement
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStep >= step.id
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white scale-110 shadow-lg'
                          : currentStep > step.id
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${
                      currentStep >= step.id ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-slate-800'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <Progress value={progress} className="h-2 bg-slate-800" />

            <p className="text-center text-amber-400 font-semibold mt-4">
              Étape {currentStep} sur {STEPS.length} : {STEPS[currentStep - 1].description}
            </p>
          </div>

          <Card className="bg-slate-950 border-slate-800">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div>
                    <Label htmlFor="title" className="text-white font-semibold flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-amber-500" />
                      Titre de l'événement *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Soirée Orientale Premium 2024"
                      className="bg-black border-slate-700 text-white mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-type" className="text-white font-semibold">
                      Type d'événement
                    </Label>
                    <Input
                      id="event-type"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder="Concert, Festival, Spectacle, Conférence..."
                      className="bg-black border-slate-700 text-white mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="short-desc" className="text-white font-semibold">
                      Description courte * (Apparaît sur la carte)
                    </Label>
                    <Input
                      id="short-desc"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Une soirée exceptionnelle avec orchestre live"
                      className="bg-black border-slate-700 text-white mt-2"
                      maxLength={150}
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">{shortDescription.length}/150 caractères</p>
                  </div>

                  <div>
                    <Label htmlFor="full-desc" className="text-white font-semibold">
                      Description complète
                    </Label>
                    <Textarea
                      id="full-desc"
                      value={fullDescription}
                      onChange={(e) => setFullDescription(e.target.value)}
                      placeholder="Décrivez en détail votre événement, ce qui le rend unique, le programme, les artistes..."
                      className="bg-black border-slate-700 text-white mt-2 min-h-[120px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="image" className="text-white font-semibold flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2 text-amber-500" />
                      URL de l'affiche * (Recommandé: 1200x630px)
                    </Label>
                    <Input
                      id="image"
                      value={mainImage}
                      onChange={(e) => setMainImage(e.target.value)}
                      placeholder="https://exemple.com/mon-affiche.jpg"
                      className="bg-black border-slate-700 text-white mt-2"
                      required
                    />
                    {mainImage && (
                      <div className="mt-4 rounded-lg overflow-hidden border border-slate-700">
                        <img
                          src={mainImage}
                          alt="Aperçu"
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                            toast.error('Image invalide', {
                              description: 'URL d\'image incorrecte ou inaccessible'
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event-date" className="text-white font-semibold flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                        Date de l'événement *
                      </Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-black border-slate-700 text-white mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="event-time" className="text-white font-semibold flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-500" />
                        Heure de début
                      </Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="bg-black border-slate-700 text-white mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white font-semibold flex items-center mb-3">
                      <MapPin className="w-4 h-4 mr-2 text-amber-500" />
                      Lieu de l'événement * (Avec autocomplétion Google Maps)
                    </Label>
                    <GoogleMapsLocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialAddress={venueAddress}
                    />
                  </div>

                  <div>
                    <Label htmlFor="venue" className="text-white font-semibold">
                      Nom du lieu *
                    </Label>
                    <Input
                      id="venue"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Palais des Congrès, Zénith, Stade..."
                      className="bg-black border-slate-700 text-white mt-2"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-white font-semibold">
                        Ville *
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris, Lyon, Marseille..."
                        className="bg-black border-slate-700 text-white mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-white font-semibold">
                        Adresse complète
                      </Label>
                      <Input
                        id="address"
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        placeholder="123 Avenue..."
                        className="bg-black border-slate-700 text-white mt-2"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-start space-x-2">
                      <Link2 className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <Label htmlFor="custom-slug" className="text-white font-semibold">
                          Lien personnalisé de l'événement (optionnel)
                        </Label>
                        <p className="text-xs text-slate-400 mt-1 mb-2">
                          Personnalisez l'URL courte de votre événement. Si vous laissez vide, un lien sera généré automatiquement.
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-400 font-mono">altess.fr/e/</span>
                          <Input
                            id="custom-slug"
                            value={customSlug}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase()
                                .replace(/[^a-z0-9-]/g, '')
                                .replace(/-+/g, '-')
                                .substring(0, 50);
                              setCustomSlug(value);
                            }}
                            placeholder={title ? title.toLowerCase().replace(/\s+/g, '-').substring(0, 30) : "festival-chaabi-2026"}
                            className="bg-black border-slate-700 text-amber-400 font-mono"
                            maxLength={50}
                          />
                        </div>
                        {customSlug && (
                          <p className="text-xs text-green-400 mt-2 flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Votre événement sera accessible via: altess.fr/e/{customSlug}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center">
                        <Ticket className="w-6 h-6 mr-2 text-amber-500" />
                        Catégories de billets
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Créez différents tarifs (VIP, Standard, Réduit...)
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowTicketModal(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un tarif
                    </Button>
                  </div>

                  {ticketCategories.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
                      <Ticket className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-slate-400 font-medium mb-2">Aucune catégorie de billet</p>
                      <p className="text-sm text-slate-500">Cliquez sur "Ajouter un tarif" pour commencer</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ticketCategories.map((category, index) => (
                          <Card key={index} className="bg-black border-slate-700 hover:border-amber-500/50 transition-all">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-white text-lg">{category.name}</h4>
                                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                    {category.price === 0 ? 'GRATUIT' : `${category.price.toFixed(2)}€`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTicketCategory(index)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-semibold">
                                {category.quota} places disponibles
                              </Badge>
                              {category.description && (
                                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{category.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-400">Total de places disponibles</p>
                          <p className="text-2xl font-bold text-white">
                            {ticketCategories.reduce((sum, cat) => sum + cat.quota, 0)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
                <Button
                  variant="ghost"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                  className="text-slate-400 hover:text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Annuler
                  </Button>

                  {currentStep < STEPS.length ? (
                    <Button
                      onClick={goToNextStep}
                      disabled={!canGoNext()}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold disabled:opacity-50"
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !canGoNext()}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Création...' : 'Publier l\'événement'}
                      <Check className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal pour ajouter un tarif */}
        <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-400">
                Nouveau tarif de billet
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-white font-semibold">Nom de la catégorie *</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="VIP, Standard, Tarif Réduit, Gratuit..."
                  className="bg-black border-slate-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-white font-semibold">Prix (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCategory.price}
                  onChange={(e) => setNewCategory({ ...newCategory, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0 pour gratuit"
                  className="bg-black border-slate-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-white font-semibold">Quota de places *</Label>
                <Input
                  type="number"
                  min="1"
                  value={newCategory.quota}
                  onChange={(e) => setNewCategory({ ...newCategory, quota: parseInt(e.target.value) || 0 })}
                  placeholder="Nombre de places disponibles"
                  className="bg-black border-slate-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-white font-semibold">Description (optionnel)</Label>
                <Textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Avantages inclus, conditions..."
                  className="bg-black border-slate-700 text-white mt-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Annuler
                </Button>
                <Button
                  onClick={addTicketCategory}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold"
                >
                  Ajouter le tarif
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
