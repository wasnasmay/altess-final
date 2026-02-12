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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Minus, ShoppingCart, Calendar, MapPin, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { frenchCities, frenchCountries } from '@/lib/french-cities';
import { CitySelector } from '@/components/CitySelector';

type Instrument = {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  image_url: string;
  category: string;
  is_available: boolean;
};

type CartItem = {
  instrument: Instrument;
  quantity: number;
};

type OrchestraComposerProps = {
  open: boolean;
  onClose: () => void;
};

export function OrchestraComposer({ open, onClose }: OrchestraComposerProps) {
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isInternational, setIsInternational] = useState(false);
  const [orderData, setOrderData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_date: '',
    event_location: '',
    event_city: '',
    event_country: '',
    event_international_city: '',
    event_type: '',
    duration_hours: '3',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      loadInstruments();
    }
  }, [open]);

  async function loadInstruments() {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .select('*')
        .eq('is_available', true)
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

  function addToCart(instrument: Instrument) {
    const existingItem = cart.find(item => item.instrument.id === instrument.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.instrument.id === instrument.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { instrument, quantity: 1 }]);
    }
  }

  function removeFromCart(instrumentId: string) {
    const existingItem = cart.find(item => item.instrument.id === instrumentId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item =>
        item.instrument.id === instrumentId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.instrument.id !== instrumentId));
    }
  }

  function calculateTotal() {
    const duration = parseInt(orderData.duration_hours) || 0;
    return cart.reduce((total, item) => {
      return total + (item.instrument.price_per_hour * item.quantity * duration);
    }, 0);
  }

  async function createOrder() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Vous devez être connecté pour passer commande');
        router.push('/login');
        return;
      }

      const eventLocation = isInternational
        ? `${orderData.event_international_city}, ${orderData.event_country}`
        : orderData.event_city;

      if (!orderData.customer_name || !orderData.customer_email || !orderData.event_date || !eventLocation || !orderData.event_type) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (cart.length === 0) {
        toast.error('Veuillez sélectionner au moins un instrument');
        return;
      }

      const totalPrice = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from('custom_orders')
        .insert([{
          user_id: user.id,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          event_date: orderData.event_date,
          event_location: eventLocation,
          event_type: orderData.event_type,
          duration_hours: parseInt(orderData.duration_hours),
          total_price: totalPrice,
          status: 'draft',
          notes: orderData.notes,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        instrument_id: item.instrument.id,
        quantity: item.quantity,
        price_per_hour: item.instrument.price_per_hour,
        subtotal: item.instrument.price_per_hour * item.quantity * parseInt(orderData.duration_hours),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Devis créé avec succès!');
      onClose();
      setStep(1);
      setCart([]);
      setSelectedDate(undefined);
      setIsInternational(false);
      setOrderData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        event_date: '',
        event_location: '',
        event_city: '',
        event_country: '',
        event_international_city: '',
        event_type: '',
        duration_hours: '3',
        notes: '',
      });

      router.push('/client-dashboard');
    } catch (error: any) {
      toast.error('Erreur lors de la création du devis');
      console.error(error);
    }
  }

  const groupedInstruments = instruments.reduce((acc, instrument) => {
    if (!acc[instrument.category]) {
      acc[instrument.category] = [];
    }
    acc[instrument.category].push(instrument);
    return acc;
  }, {} as Record<string, Instrument[]>);

  const total = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Composer Votre Orchestre</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Button
            variant={step === 1 ? 'default' : 'outline'}
            onClick={() => setStep(1)}
            className="flex-1"
          >
            1. Sélection
          </Button>
          <Button
            variant={step === 2 ? 'default' : 'outline'}
            onClick={() => setStep(2)}
            disabled={cart.length === 0}
            className="flex-1"
          >
            2. Informations
          </Button>
          <Button
            variant={step === 3 ? 'default' : 'outline'}
            onClick={() => setStep(3)}
            disabled={cart.length === 0}
            className="flex-1"
          >
            3. Récapitulatif
          </Button>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedInstruments).map(([category, categoryInstruments]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold mb-3 flex items-center">
                        <Music className="w-5 h-5 mr-2" />
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryInstruments.map((instrument) => {
                          const cartItem = cart.find(item => item.instrument.id === instrument.id);
                          return (
                            <Card key={instrument.id} className="overflow-hidden">
                              <div className="relative">
                                <img
                                  src={instrument.image_url}
                                  alt={instrument.name}
                                  className="w-full h-32 object-cover"
                                />
                                {cartItem && (
                                  <Badge className="absolute top-2 right-2 bg-primary">
                                    {cartItem.quantity}
                                  </Badge>
                                )}
                              </div>
                              <CardContent className="p-4">
                                <h4 className="font-bold mb-1">{instrument.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{instrument.description}</p>
                                <p className="text-primary font-bold mb-3">{instrument.price_per_hour}€/h</p>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(instrument.id)}
                                    disabled={!cartItem}
                                    className="flex-1"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(instrument)}
                                    className="flex-1"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Votre Sélection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Aucun instrument sélectionné
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {cart.map(item => (
                          <div key={item.instrument.id} className="flex justify-between items-center text-sm">
                            <span>{item.quantity}x {item.instrument.name}</span>
                            <span className="font-bold">{item.instrument.price_per_hour}€/h</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold">Durée:</span>
                          <Input
                            type="number"
                            value={orderData.duration_hours}
                            onChange={(e) => setOrderData({ ...orderData, duration_hours: e.target.value })}
                            className="w-20 text-right"
                            min="1"
                          />
                          <span>heures</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-primary mt-4">
                          <span>Total:</span>
                          <span>{total}€</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => setStep(2)}
                      >
                        Continuer
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Nom complet *</Label>
                <Input
                  id="customer_name"
                  value={orderData.customer_name}
                  onChange={(e) => setOrderData({ ...orderData, customer_name: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={orderData.customer_email}
                  onChange={(e) => setOrderData({ ...orderData, customer_email: e.target.value })}
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Téléphone</Label>
                <Input
                  id="customer_phone"
                  value={orderData.customer_phone}
                  onChange={(e) => setOrderData({ ...orderData, customer_phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <Label htmlFor="event_type">Type d&apos;événement *</Label>
                <Select
                  value={orderData.event_type}
                  onValueChange={(value) => setOrderData({ ...orderData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Mariage</SelectItem>
                    <SelectItem value="corporate">Événement d'entreprise</SelectItem>
                    <SelectItem value="family">Événement familial</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date de l&apos;événement *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-12 text-base"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      {selectedDate ? (
                        format(selectedDate, 'PPP', { locale: fr })
                      ) : (
                        <span className="text-muted-foreground">Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          setOrderData({ ...orderData, event_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={fr}
                      className="rounded-md border text-base"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2">
                <CitySelector
                  value={orderData.event_city}
                  onChange={(location, isInternational) => {
                    setIsInternational(isInternational);
                  }}
                  internationalCity={orderData.event_international_city}
                  internationalCountry={orderData.event_country}
                  onInternationalCityChange={(city) =>
                    setOrderData({ ...orderData, event_international_city: city })
                  }
                  onInternationalCountryChange={(country) =>
                    setOrderData({ ...orderData, event_country: country })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes ou demandes spéciales</Label>
              <Textarea
                id="notes"
                value={orderData.notes}
                onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={4}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Retour
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif de votre commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Informations client</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nom:</strong> {orderData.customer_name}</p>
                    <p><strong>Email:</strong> {orderData.customer_email}</p>
                    {orderData.customer_phone && <p><strong>Téléphone:</strong> {orderData.customer_phone}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Détails de l&apos;événement
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Type:</strong> {orderData.event_type}</p>
                    <p><strong>Date:</strong> {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : orderData.event_date}</p>
                    <p><strong>Lieu:</strong> {isInternational ? `${orderData.event_international_city}, ${orderData.event_country}` : orderData.event_city}</p>
                    <p><strong>Durée:</strong> {orderData.duration_hours} heures</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center">
                    <Music className="w-4 h-4 mr-2" />
                    Instruments sélectionnés
                  </h3>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.instrument.id} className="flex justify-between items-center text-sm">
                        <span>{item.quantity}x {item.instrument.name}</span>
                        <span className="font-bold">
                          {item.instrument.price_per_hour * item.quantity * parseInt(orderData.duration_hours)}€
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-xl font-bold text-primary">
                    <span>Total:</span>
                    <span>{total}€</span>
                  </div>
                </div>

                {orderData.notes && (
                  <div>
                    <h3 className="font-bold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{orderData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Retour
              </Button>
              <Button onClick={createOrder} className="flex-1">
                Obtenir un Devis
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
