'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function MecenasCTAButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    amount: '',
    isAnonymous: false,
    message: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Montant requis',
        description: 'Veuillez entrer un montant valide pour votre contribution',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.isAnonymous && !formData.donorName.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez entrer votre nom ou cocher "Contribution anonyme"',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('mecenas_donations').insert({
        donor_name: formData.isAnonymous ? 'Anonyme' : formData.donorName,
        email: formData.email || null,
        amount: parseFloat(formData.amount),
        message: formData.message || null,
      });

      if (error) throw error;

      toast({
        title: 'Gratitude Infinie',
        description: 'Votre noble contribution a été enregistrée avec reconnaissance.',
      });

      setFormData({
        donorName: '',
        email: '',
        amount: '',
        isAnonymous: false,
        message: '',
      });

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast({
        title: 'Erreur Technique',
        description: 'Un incident est survenu. Veuillez réessayer ultérieurement.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="group relative overflow-hidden bg-gradient-to-r from-amber-900/20 to-rose-900/20 hover:from-amber-900/40 hover:to-rose-900/40 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 transition-all duration-500 px-6 py-2"
        >
          <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
          <span className="relative z-10 font-serif text-sm tracking-wide">
            Soutien au Rayonnement Culturel
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gradient-to-br from-black via-slate-950 to-black border border-amber-500/30 text-white max-w-2xl shadow-2xl shadow-amber-500/20">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center">
              <Heart className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-serif text-center bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            Philanthropie Culturelle
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-center text-base leading-relaxed mt-4 px-4">
            Votre soutien discret permet à ALTESS de perpétuer sa mission de promotion des arts et de la culture orientale.
            Chaque contribution, quelle qu'en soit l'ampleur, participe à l'excellence de notre rayonnement culturel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-2">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-amber-400 font-serif">
              Montant de Votre Contribution (€)
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white text-lg h-12"
              placeholder="Montant libre"
              required
            />
            <p className="text-xs text-slate-500 italic">
              Suggestion : À partir de 50€ pour un impact significatif
            </p>
          </div>

          <div className="flex items-center space-x-3 py-3 px-4 bg-black/40 border border-amber-500/20 rounded-lg">
            <Checkbox
              id="anonymous"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isAnonymous: checked as boolean })
              }
            />
            <Label htmlFor="anonymous" className="text-sm cursor-pointer font-light">
              Contribution confidentielle (Anonyme)
            </Label>
          </div>

          {!formData.isAnonymous && (
            <>
              <div className="space-y-2">
                <Label htmlFor="donorName" className="text-amber-400 font-serif">
                  Votre Nom ou Raison Sociale
                </Label>
                <Input
                  id="donorName"
                  type="text"
                  value={formData.donorName}
                  onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                  className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
                  placeholder="Nom Prénom ou Entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400 font-light">
                  Adresse Email (Optionnel)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white"
                  placeholder="votre@email.fr"
                />
                <p className="text-xs text-slate-500 italic">
                  Pour recevoir nos remerciements personnalisés
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="message" className="text-slate-400 font-light">
              Message Personnel (Optionnel)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white min-h-[100px] resize-none"
              placeholder="Partagez vos motivations ou vos encouragements..."
            />
          </div>

          <div className="bg-slate-950/50 border border-amber-500/20 rounded-lg p-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-amber-400">Note importante :</strong> Cette contribution est un geste de mécénat culturel.
              Elle ne donne pas lieu à une contrepartie commerciale directe, mais participe au développement de nos activités
              artistiques et pédagogiques. Un reçu vous sera transmis si vous communiquez votre adresse email.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-700 hover:via-rose-700 hover:to-amber-700 text-white font-serif text-lg py-6 shadow-xl hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Enregistrement en cours...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 mr-2" />
                Confirmer ma Contribution
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
