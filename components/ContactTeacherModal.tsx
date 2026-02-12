'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageCircle,
  Phone,
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import type { TeacherWithSubscription, ContactMethod } from '@/lib/types/altos';

interface ContactTeacherModalProps {
  teacher: TeacherWithSubscription | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactTeacherModal({ teacher, isOpen, onClose }: ContactTeacherModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_phone: '',
    message: '',
    preferred_contact_method: 'email' as ContactMethod
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacher) return;

    if (!formData.student_name.trim() || !formData.student_email.trim() || !formData.message.trim()) {
      toast({
        title: 'Champs obligatoires',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('check_contact_rate_limit', {
          p_ip_address: '0.0.0.0',
          p_email: formData.student_email
        });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
      }

      if (rateLimitCheck === false) {
        toast({
          title: 'Limite atteinte',
          description: 'Vous avez atteint la limite de demandes de contact pour aujourd\'hui. Réessayez demain.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const contactData = {
        teacher_id: teacher.profile_id,
        student_id: user?.id || null,
        student_name: formData.student_name.trim(),
        student_email: formData.student_email.trim(),
        student_phone: formData.student_phone.trim() || null,
        message: formData.message.trim(),
        preferred_contact_method: formData.preferred_contact_method,
        status: 'pending',
        ip_address: '0.0.0.0',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      };

      const { error } = await supabase
        .from('contact_requests')
        .insert([contactData]);

      if (error) throw error;

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de contact a été envoyée au professeur avec succès',
      });

      setFormData({
        student_name: '',
        student_email: '',
        student_phone: '',
        message: '',
        preferred_contact_method: 'email'
      });

      onClose();
    } catch (error) {
      console.error('Error sending contact request:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la demande de contact',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectContact = (method: 'email' | 'phone' | 'whatsapp') => {
    if (!teacher) return;

    switch (method) {
      case 'email':
        if (teacher.email) {
          window.open(`mailto:${teacher.email}`, '_blank');
        }
        break;
      case 'phone':
        if (teacher.phone) {
          window.open(`tel:${teacher.phone}`, '_blank');
        }
        break;
      case 'whatsapp':
        if (teacher.whatsapp) {
          const phone = teacher.whatsapp.replace(/\s/g, '');
          window.open(`https://wa.me/${phone}`, '_blank');
        }
        break;
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-transparent bg-clip-text">
            Contacter {teacher.full_name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Envoyez une demande de contact à ce professeur. Vous recevrez une réponse par votre méthode préférée.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-900/20 border-blue-500/30 text-blue-300 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription className="ml-2">
            <p className="text-sm">
              Protection anti-spam active : Maximum 3 demandes par jour depuis votre connexion,
              et 5 demandes par adresse email.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {teacher.is_subscribed && (teacher.email || teacher.phone || teacher.whatsapp) && (
            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <h4 className="font-semibold text-amber-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Contact Direct Disponible
              </h4>
              <div className="flex flex-wrap gap-2">
                {teacher.email && (
                  <Button
                    onClick={() => handleDirectContact('email')}
                    variant="outline"
                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
                {teacher.phone && (
                  <Button
                    onClick={() => handleDirectContact('phone')}
                    variant="outline"
                    className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Téléphone
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
                {teacher.whatsapp && (
                  <Button
                    onClick={() => handleDirectContact('whatsapp')}
                    variant="outline"
                    className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Ou remplissez le formulaire ci-dessous pour envoyer une demande via la plateforme
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Votre nom *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jean Dupont"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-300">Votre email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
                value={formData.student_email}
                onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">Votre téléphone (optionnel)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={formData.student_phone}
                onChange={(e) => setFormData({ ...formData, student_phone: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-gray-300">Votre message *</Label>
              <Textarea
                id="message"
                placeholder="Bonjour, je souhaiterais prendre des cours de..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label className="text-gray-300 mb-3 block">Méthode de contact préférée *</Label>
              <RadioGroup
                value={formData.preferred_contact_method}
                onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value as ContactMethod })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="method-email" />
                  <Label htmlFor="method-email" className="text-gray-300 cursor-pointer flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="method-phone" />
                  <Label htmlFor="method-phone" className="text-gray-300 cursor-pointer flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-400" />
                    Téléphone
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="method-whatsapp" />
                  <Label htmlFor="method-whatsapp" className="text-gray-300 cursor-pointer flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    WhatsApp
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
