'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Mail, User, MessageSquare, Calendar as CalendarIcon, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerContactFormProps {
  partnerName: string;
  partnerEmail?: string;
  partnerId: string;
}

export default function PartnerContactForm({ partnerName, partnerEmail, partnerId }: PartnerContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventType: '',
    guestCount: '',
    message: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('partner_quote_requests').insert({
        partner_id: partnerId,
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone || null,
        event_date: formData.eventDate || null,
        event_type: formData.eventType || null,
        guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
        message: formData.message,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Demande de devis envoyée avec succès', {
        description: `${partnerName} recevra votre demande et vous contactera rapidement.`,
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        eventDate: '',
        eventType: '',
        guestCount: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending quote request:', error);
      toast.error('Erreur lors de l\'envoi', {
        description: 'Veuillez réessayer ou nous contacter directement.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 shadow-2xl shadow-amber-500/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-amber-400">
          <MessageSquare className="w-6 h-6" />
          Contacter {partnerName}
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Remplissez ce formulaire pour entrer en contact directement
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              Votre nom complet *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              Votre adresse email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
              placeholder="jean@exemple.fr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white">
              Téléphone (optionnel)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                Date de l'événement
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount" className="text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Nombre d'invités
              </Label>
              <Input
                id="guestCount"
                type="number"
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
                placeholder="100"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType" className="text-white">
              Type d'événement
            </Label>
            <Input
              id="eventType"
              type="text"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
              placeholder="Mariage, Anniversaire, Entreprise..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Votre message *
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white min-h-[140px] resize-none"
              placeholder="Décrivez votre projet, vos besoins et toute information utile..."
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 text-base shadow-lg hover:shadow-amber-500/50 transition-all"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Envoyer ma Demande
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Vos données sont utilisées uniquement pour traiter votre demande et ne seront pas partagées avec des tiers.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
