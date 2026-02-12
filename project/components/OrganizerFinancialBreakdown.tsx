"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface FinancialBreakdownProps {
  totalSales: number;
  organizerAmount: number;
  platformCommission: number;
  stripeFees: number;
  ticketsSold: number;
}

export default function OrganizerFinancialBreakdown({
  totalSales,
  organizerAmount,
  platformCommission,
  stripeFees,
  ticketsSold,
}: FinancialBreakdownProps) {
  const organizerPercentage = totalSales > 0 ? (organizerAmount / totalSales) * 100 : 0;
  const platformPercentage = totalSales > 0 ? (platformCommission / totalSales) * 100 : 0;
  const stripePercentage = totalSales > 0 ? (stripeFees / totalSales) * 100 : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total des Ventes */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Total des Ventes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{totalSales.toFixed(2)}€</div>
          <p className="text-sm text-slate-500 mt-1">{ticketsSold} billet{ticketsSold > 1 ? 's' : ''} vendu{ticketsSold > 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Part Organisateur */}
      <Card className="shadow-lg border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Votre Part
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-700">{organizerAmount.toFixed(2)}€</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-green-100 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${organizerPercentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-green-700">{organizerPercentage.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Commission ALTESS */}
      <Card className="shadow-lg border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Commission ALTESS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-700">{platformCommission.toFixed(2)}€</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-orange-100 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${platformPercentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-orange-700">{platformPercentage.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Frais Stripe */}
      <Card className="shadow-lg border-red-200 bg-gradient-to-br from-red-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Frais Bancaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-700">{stripeFees.toFixed(2)}€</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-red-100 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${stripePercentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-red-700">{stripePercentage.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Détail en camembert */}
      <Card className="shadow-xl border-slate-200 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">Répartition Financière Détaillée</CardTitle>
          <CardDescription>
            Comprendre comment chaque euro est distribué
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Graphique visuel */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Organisateur (vert) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="20"
                    strokeDasharray={`${organizerPercentage * 2.51} 251`}
                    strokeLinecap="round"
                  />
                  {/* Commission ALTESS (orange) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="20"
                    strokeDasharray={`${platformPercentage * 2.51} 251`}
                    strokeDashoffset={-organizerPercentage * 2.51}
                    strokeLinecap="round"
                  />
                  {/* Frais Stripe (rouge) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${stripePercentage * 2.51} 251`}
                    strokeDashoffset={-(organizerPercentage + platformPercentage) * 2.51}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{totalSales.toFixed(0)}€</div>
                    <div className="text-xs text-slate-500">Total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Légende */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-4 h-4 bg-green-600 rounded mt-0.5"></div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Votre Part ({organizerPercentage.toFixed(1)}%)</p>
                  <p className="text-sm text-green-700 mt-1">
                    <span className="font-bold text-lg">{organizerAmount.toFixed(2)}€</span> que vous recevrez 48h après l'événement
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Montant net après déduction de toutes les charges
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-4 h-4 bg-orange-600 rounded mt-0.5"></div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">Commission ALTESS ({platformPercentage.toFixed(1)}%)</p>
                  <p className="text-sm text-orange-700 mt-1">
                    <span className="font-bold text-lg">{platformCommission.toFixed(2)}€</span> pour l'utilisation de la plateforme
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Couvre les services : billetterie, paiements, support, marketing
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="w-4 h-4 bg-red-600 rounded mt-0.5"></div>
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Frais Bancaires ({stripePercentage.toFixed(1)}%)</p>
                  <p className="text-sm text-red-700 mt-1">
                    <span className="font-bold text-lg">{stripeFees.toFixed(2)}€</span> perçus par les banques (Stripe)
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Frais techniques obligatoires pour le traitement des paiements carte
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note informative */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Transparence totale :</span> Vous voyez exactement combien vous gagnez sur chaque billet vendu.
              Les fonds sont sécurisés sur le compte ALTESS et vous seront virés automatiquement 48h après la fin de votre événement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
