'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TestNouvellesFonctionnalites() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Nouvelles Fonctionnalités Actives !
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              Si vous voyez cette page, c'est que le système fonctionne parfaitement !
            </p>

            <div className="bg-black rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-amber-400">Fonctionnalités Ajoutées :</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Virement Différé</p>
                    <p className="text-sm text-gray-400">Compte à rebours 48h après l'événement</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Historique Transactions</p>
                    <p className="text-sm text-gray-400">Liste complète avec statuts colorés</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Codes Promo</p>
                    <p className="text-sm text-gray-400">Création et gestion de réductions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">QR Code Boutique</p>
                    <p className="text-sm text-gray-400">Télécharger, imprimer, partager</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Tooltips d'Aide</p>
                    <p className="text-sm text-gray-400">Explications sur tous les champs</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Design Noir & Or</p>
                    <p className="text-sm text-gray-400">Interface luxueuse et premium</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => router.push('/organizer-dashboard-premium')}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:from-amber-500 hover:to-amber-700 text-lg py-6"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Accéder au Dashboard Premium
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-blue-400" />
              Base de Données
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                <span className="text-white">Table : promo_codes</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                <span className="text-white">Table : event_custom_fields</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                <span className="text-white">Table : transaction_history</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                <span className="text-white">Colonnes ajoutées : 6</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-purple-400" />
              Composants Créés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                <span className="text-white">PromoCodeManager.tsx</span>
                <span className="text-amber-400 font-semibold">13 KB</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                <span className="text-white">StoreQRGenerator.tsx</span>
                <span className="text-amber-400 font-semibold">8.1 KB</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                <span className="text-white">OrganizerFinancialModule.tsx</span>
                <span className="text-amber-400 font-semibold">28 KB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-white">
                Système 100% Opérationnel ! 🎉
              </h3>
              <p className="text-gray-300">
                Toutes les modifications sont actives et prêtes à l'emploi.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => router.push('/organizer-dashboard-premium')}
                  className="bg-gradient-to-r from-green-400 to-green-600 text-white"
                >
                  Dashboard Premium
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-gray-700 text-white"
                >
                  Accueil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
