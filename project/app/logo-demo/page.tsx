'use client';

import AltosLogo, { AltosLogoText, AltosLogoArabic, AltosLogoMinimal } from '@/components/AltosLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function LogoDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-amber-400" />
            Propositions de Logo ALTOS
            <Sparkles className="w-10 h-10 text-amber-400" />
          </h1>
          <p className="text-xl text-slate-400">Différentes variantes adaptées à vos besoins</p>
        </div>

        <div className="grid gap-8">
          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400">1. Logo Complet - Version Premium</CardTitle>
              <p className="text-slate-400">Idéal pour la page d'accueil et les en-têtes</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-8">
              <div className="flex items-center justify-center p-12 bg-black/40 rounded-xl">
                <AltosLogo variant="full" size="xl" />
              </div>
              <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl">
                <AltosLogo variant="full" size="lg" />
              </div>
              <div className="flex items-center justify-center p-6 bg-black/40 rounded-xl">
                <AltosLogo variant="full" size="md" />
              </div>
              <div className="flex items-center justify-center p-4 bg-black/40 rounded-xl">
                <AltosLogo variant="full" size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400">2. Logo avec Texte Arabe</CardTitle>
              <p className="text-slate-400">Version bilingue pour authentifier la marque</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center justify-center p-12 bg-black/40 rounded-xl">
                <AltosLogoArabic />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl">
                  <AltosLogoArabic />
                </div>
                <div className="flex items-center justify-center p-8 bg-gradient-to-br from-amber-950/30 to-orange-950/30 rounded-xl border border-amber-500/20">
                  <AltosLogoArabic />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400">3. Logo Compact</CardTitle>
              <p className="text-slate-400">Parfait pour les barres de navigation et menus</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center justify-center p-10 bg-black/40 rounded-xl">
                <AltosLogo variant="compact" size="xl" />
              </div>
              <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl">
                <AltosLogo variant="compact" size="lg" />
              </div>
              <div className="flex items-center justify-center p-6 bg-black/40 rounded-xl">
                <AltosLogo variant="compact" size="md" />
              </div>
              <div className="flex items-center justify-center p-4 bg-black/40 rounded-xl">
                <AltosLogo variant="compact" size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400">4. Icône Seule</CardTitle>
              <p className="text-slate-400">Pour favicons, apps mobiles et réseaux sociaux</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl">
                  <AltosLogo variant="icon" size="xl" />
                </div>
                <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl">
                  <AltosLogo variant="icon" size="lg" />
                </div>
                <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl">
                  <AltosLogo variant="icon" size="md" />
                </div>
                <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl">
                  <AltosLogo variant="icon" size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400">5. Texte Seul</CardTitle>
              <p className="text-slate-400">Version typographique pure</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center justify-center p-12 bg-black/40 rounded-xl">
                <AltosLogoText size="xl" />
              </div>
              <div className="flex items-center justify-center p-10 bg-black/40 rounded-xl">
                <AltosLogoText size="lg" />
              </div>
              <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl">
                <AltosLogoText size="md" />
              </div>
              <div className="flex items-center justify-center p-6 bg-black/40 rounded-xl">
                <AltosLogoText size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400">6. Logo Minimal</CardTitle>
              <p className="text-slate-400">Version épurée et moderne</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-center p-10 bg-black/40 rounded-xl">
                  <AltosLogoMinimal />
                </div>
                <div className="flex items-center justify-center p-10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl">
                  <AltosLogoMinimal />
                </div>
                <div className="flex items-center justify-center p-10 bg-gradient-to-br from-amber-950/30 to-orange-950/30 rounded-xl border border-amber-500/20">
                  <AltosLogoMinimal />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-950/30 via-orange-950/30 to-amber-950/30 border-amber-500/50">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400">7. Tests sur Différents Fonds</CardTitle>
              <p className="text-slate-400">Vérification de la lisibilité</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center p-10 bg-white rounded-xl">
                  <AltosLogo variant="compact" size="lg" className="filter drop-shadow-xl" />
                </div>
                <div className="flex items-center justify-center p-10 bg-slate-900 rounded-xl">
                  <AltosLogo variant="compact" size="lg" />
                </div>
                <div className="flex items-center justify-center p-10 bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl">
                  <AltosLogo variant="compact" size="lg" />
                </div>
                <div className="flex items-center justify-center p-10 bg-gradient-to-br from-purple-950 to-purple-900 rounded-xl">
                  <AltosLogo variant="compact" size="lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-8 bg-gradient-to-br from-amber-950/20 to-orange-950/20 rounded-2xl border border-amber-500/30">
            <h3 className="text-2xl font-bold text-amber-400 mb-4">💡 Recommandations d'utilisation</h3>
            <div className="grid md:grid-cols-2 gap-6 text-slate-300">
              <div>
                <h4 className="font-bold text-amber-300 mb-2">Navigation principale</h4>
                <p className="text-sm">Logo Compact (variant="compact" size="md")</p>
              </div>
              <div>
                <h4 className="font-bold text-amber-300 mb-2">Page d'accueil Hero</h4>
                <p className="text-sm">Logo Complet ou Logo Arabe (size="xl")</p>
              </div>
              <div>
                <h4 className="font-bold text-amber-300 mb-2">Footer</h4>
                <p className="text-sm">Logo Complet (size="lg")</p>
              </div>
              <div>
                <h4 className="font-bold text-amber-300 mb-2">Favicon</h4>
                <p className="text-sm">Icône seule (variant="icon")</p>
              </div>
              <div>
                <h4 className="font-bold text-amber-300 mb-2">Réseaux sociaux</h4>
                <p className="text-sm">Logo Minimal ou Icône</p>
              </div>
              <div>
                <h4 className="font-bold text-amber-300 mb-2">Documents officiels</h4>
                <p className="text-sm">Logo avec texte arabe</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
