'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

type ProviderData = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  plan_type: string;
  company_name: string;
};

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'pour toujours',
    icon: Sparkles,
    iconColor: 'text-gray-400',
    gradient: 'from-gray-600 to-gray-700',
    features: [
      'Fiche prestataire basique',
      'Jusqu\'à 5 photos',
      'Réception de devis',
      'Support par email',
    ],
  },
  {
    id: 'pro',
    name: 'Professionnel',
    price: '29€',
    period: 'par mois',
    icon: Zap,
    iconColor: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Fiche prestataire complète',
      'Photos et vidéos illimitées',
      'Badge "Vérifié"',
      'Mise en avant dans les résultats',
      'Statistiques détaillées',
      'Support prioritaire',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '79€',
    period: 'par mois',
    icon: Crown,
    iconColor: 'text-purple-400',
    gradient: 'from-purple-600 to-pink-600',
    features: [
      'Tout le plan Pro inclus',
      'Position en tête de liste',
      'Publicités sponsorisées',
      'Page personnalisée premium',
      'Analyses avancées & insights',
      'Manager dédié',
      'Formations exclusives',
    ],
  },
];

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadProviderData();
  }, [user, router]);

  async function loadProviderData() {
    try {
      const { data, error } = await supabase
        .from('event_providers')
        .select('id, stripe_customer_id, stripe_subscription_id, subscription_status, plan_type, company_name')
        .eq('provider_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProviderData(data);

      // Vérifier si on revient d'un paiement réussi
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        toast.success('🎉 Paiement réussi ! Votre abonnement est maintenant actif.', {
          duration: 5000,
        });
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/settings/subscription');
      } else if (urlParams.get('canceled') === 'true') {
        toast.error('Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.');
        window.history.replaceState({}, '', '/settings/subscription');
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlan(planId: string) {
    if (!user || !providerData || planId === 'free') return;

    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: planId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erreur lors de la création de la session de paiement');
      setCheckoutLoading(false);
    }
  }

  function handleManageSubscription() {
    toast.info('Le portail de gestion Stripe sera disponible prochainement');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const hasStripeCustomer = providerData?.stripe_customer_id;
  const currentPlan = providerData?.plan_type || 'free';
  const subscriptionStatus = providerData?.subscription_status || 'inactive';

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => router.push('/provider-dashboard')}
          className="mb-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au dashboard
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              Gestion de l'Abonnement
            </h1>
            {providerData && (
              <p className="text-xl text-gray-400">
                {providerData.company_name}
              </p>
            )}
          </div>

          {hasStripeCustomer ? (
            <Card className="bg-gradient-to-br from-slate-900 to-black border-2 border-amber-500/30 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-amber-400">Abonnement Actif</CardTitle>
                <CardDescription className="text-gray-400">
                  Gérez votre abonnement et vos informations de facturation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Plan actuel</p>
                    <p className="text-2xl font-bold text-amber-400 capitalize">
                      {currentPlan}
                    </p>
                  </div>
                  <Badge
                    variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}
                    className="text-sm px-3 py-1"
                  >
                    {subscriptionStatus === 'active' ? '✓ Actif' : subscriptionStatus}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    Votre ID client Stripe : <span className="font-mono text-gray-300">{providerData?.stripe_customer_id}</span>
                  </p>
                  {providerData?.stripe_subscription_id && (
                    <p className="text-sm text-gray-400">
                      ID abonnement : <span className="font-mono text-gray-300">{providerData.stripe_subscription_id}</span>
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={handleManageSubscription}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
                >
                  Gérer mon abonnement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              <p className="text-center text-gray-400 mb-8 text-lg">
                Choisissez le plan qui correspond le mieux à vos besoins
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isCurrentPlan = currentPlan === plan.id;

                  return (
                    <Card
                      key={plan.id}
                      className={`relative overflow-hidden bg-gradient-to-br from-slate-900 to-black border-2 transition-all hover:scale-105 ${
                        plan.popular
                          ? 'border-amber-500 shadow-2xl shadow-amber-500/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                          POPULAIRE
                        </div>
                      )}

                      <CardHeader className="text-center pb-8">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.gradient} mx-auto mb-4`}>
                          <Icon className={`w-8 h-8 ${plan.iconColor}`} />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white mb-2">
                          {plan.name}
                        </CardTitle>
                        <div className="mb-4">
                          <span className="text-4xl font-bold text-amber-400">{plan.price}</span>
                          <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          size="lg"
                          disabled={isCurrentPlan || checkoutLoading || plan.id === 'free'}
                          onClick={() => handleSelectPlan(plan.id)}
                          className={`w-full font-semibold ${
                            plan.popular
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black'
                              : 'bg-slate-700 hover:bg-slate-600 text-white'
                          }`}
                        >
                          {checkoutLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Redirection...
                            </>
                          ) : isCurrentPlan ? (
                            'Plan actuel'
                          ) : plan.id === 'free' ? (
                            'Plan gratuit'
                          ) : (
                            'Choisir ce plan'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-12 text-center">
                <p className="text-gray-400 text-sm">
                  Les paiements sont sécurisés par Stripe. Annulez à tout moment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
