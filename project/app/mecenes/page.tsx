'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Crown, Sparkles, Star, Award, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function MecenesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const values = [
    {
      icon: Crown,
      title: 'Excellence',
      description: 'Un engagement pour la qualité artistique et culturelle'
    },
    {
      icon: Star,
      title: 'Rayonnement',
      description: 'Promouvoir la culture orientale à travers le monde'
    },
    {
      icon: Award,
      title: 'Transmission',
      description: 'Accompagner les talents de demain'
    },
    {
      icon: Shield,
      title: 'Discrétion',
      description: 'Une philanthropie noble et confidentielle'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <Navigation />
      {/* <WhatsAppChat /> */}

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/10 border-2 border-amber-500/30 mb-4">
              <Crown className="w-12 h-12 text-amber-400" />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-light font-serif tracking-wider bg-gradient-to-r from-amber-300 via-rose-300 to-amber-300 bg-clip-text text-transparent leading-tight">
                Le Cercle des Mécènes
              </h1>

              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-amber-500/50" />
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-amber-500/50" />
              </div>

              <p className="text-2xl md:text-3xl font-light font-serif text-amber-200/90 italic">
                ALTESS
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-16">
            <Card className="bg-gradient-to-br from-slate-950/80 via-black/60 to-amber-950/20 backdrop-blur-xl border border-amber-500/20 shadow-2xl">
              <CardContent className="p-8 md:p-12">
                <div className="space-y-6 text-center">
                  <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                    Rejoignez une communauté d'excellence dédiée au rayonnement de la culture orientale.
                    Votre contribution discrète permet à ALTESS de perpétuer sa mission artistique,
                    d'accompagner de jeunes talents et de célébrer la richesse de notre patrimoine culturel.
                  </p>

                  <blockquote className="border-l-4 border-amber-500/50 pl-6 py-4 italic text-amber-400/90 text-base md:text-lg font-serif bg-black/30 rounded-r-lg">
                    "La culture est l'âme d'une nation. Chaque mécène en devient le gardien silencieux."
                  </blockquote>

                  <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                    En tant que membre du Cercle des Mécènes, vous participez à la préservation et à la promotion
                    d'un héritage culturel unique, tout en soutenant des initiatives éducatives et artistiques d'envergure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="bg-gradient-to-br from-black/60 to-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 mb-4">
                      <Icon className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">{value.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-br from-slate-950 via-black to-slate-950 border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 mb-4">
                    <Heart className="w-8 h-8 text-amber-400 animate-pulse" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400 bg-clip-text text-transparent mb-2">
                    Votre Contribution
                  </h2>
                  <p className="text-slate-400">
                    Chaque geste compte dans notre mission culturelle
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-amber-400 font-serif text-lg">
                      Montant de Votre Contribution (€)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white text-xl h-14 text-center"
                      placeholder="Montant libre"
                      required
                    />
                    <p className="text-xs text-slate-500 italic text-center">
                      Suggestion : À partir de 50€ pour un impact significatif
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 py-4 px-5 bg-black/40 border border-amber-500/20 rounded-lg hover:border-amber-500/40 transition-colors">
                    <Checkbox
                      id="anonymous"
                      checked={formData.isAnonymous}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isAnonymous: checked as boolean })
                      }
                    />
                    <Label htmlFor="anonymous" className="text-base cursor-pointer font-light flex-1">
                      Contribution confidentielle (Anonyme)
                    </Label>
                  </div>

                  {!formData.isAnonymous && (
                    <div className="space-y-6 p-6 bg-gradient-to-br from-amber-950/10 to-transparent border border-amber-500/10 rounded-lg">
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
                          Pour recevoir nos remerciements personnalisés et un reçu fiscal
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-400 font-light">
                      Message Personnel (Optionnel)
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-black/60 border-amber-500/30 focus:border-amber-500 text-white min-h-[120px] resize-none"
                      placeholder="Partagez vos motivations ou vos encouragements..."
                    />
                  </div>

                  <div className="bg-slate-950/60 border border-amber-500/20 rounded-lg p-5">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <strong className="text-amber-400">Note importante :</strong> Cette contribution est un geste de mécénat culturel.
                      Elle ne donne pas lieu à une contrepartie commerciale directe, mais participe au développement de nos activités
                      artistiques et pédagogiques. Les statistiques de collecte sont confidentielles et réservées à l'administration.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:via-rose-500 hover:to-amber-500 text-white font-serif text-xl py-7 shadow-2xl hover:shadow-amber-500/40 transition-all duration-500 border border-amber-500/30"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                        Enregistrement en cours...
                      </>
                    ) : (
                      <>
                        <Heart className="w-6 h-6 mr-3 animate-pulse" />
                        Confirmer ma Contribution
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-slate-500 text-sm mt-8 font-light">
              Votre générosité reste confidentielle. Seule l'équipe administrative d'ALTESS a accès aux détails de collecte.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
