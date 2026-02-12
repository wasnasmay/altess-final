'use client';

import { useEffect } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Zap } from 'lucide-react';

type FeatureLevel = 'pro' | 'premium' | 'premiumOnly';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  level: FeatureLevel;
  featureName?: string;
  fallback?: React.ReactNode;
  redirect?: boolean;
}

export function SubscriptionGuard({
  children,
  level,
  featureName = 'cette fonctionnalité',
  fallback,
  redirect = false,
}: SubscriptionGuardProps) {
  const { loading, canAccessPro, canAccessPremium, canAccessPremiumOnly, guardProFeature, guardPremiumFeature, guardPremiumOnlyFeature, redirectToSubscription } = useSubscription();

  useEffect(() => {
    if (loading || !redirect) return;

    if (level === 'pro' && !canAccessPro) {
      guardProFeature(featureName);
    } else if (level === 'premium' && !canAccessPremium) {
      guardPremiumFeature(featureName);
    } else if (level === 'premiumOnly' && !canAccessPremiumOnly) {
      guardPremiumOnlyFeature(featureName);
    }
  }, [loading, level, canAccessPro, canAccessPremium, canAccessPremiumOnly, redirect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const hasAccess =
    (level === 'pro' && canAccessPro) ||
    (level === 'premium' && canAccessPremium) ||
    (level === 'premiumOnly' && canAccessPremiumOnly);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getLevelConfig = () => {
    switch (level) {
      case 'premiumOnly':
        return {
          icon: Crown,
          title: 'Fonctionnalité Premium',
          description: 'Cette fonctionnalité est réservée aux abonnés Premium',
          gradient: 'from-purple-600 to-pink-600',
          iconColor: 'text-purple-400',
        };
      case 'premium':
        return {
          icon: Zap,
          title: 'Fonctionnalité Pro/Premium',
          description: 'Cette fonctionnalité nécessite un abonnement Pro ou Premium',
          gradient: 'from-amber-500 to-orange-600',
          iconColor: 'text-amber-400',
        };
      case 'pro':
        return {
          icon: Zap,
          title: 'Fonctionnalité Pro',
          description: 'Cette fonctionnalité nécessite un abonnement Pro',
          gradient: 'from-amber-500 to-orange-600',
          iconColor: 'text-amber-400',
        };
    }
  };

  const config = getLevelConfig();
  const Icon = config.icon;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-black border-2 border-slate-700">
      <CardHeader className="text-center pb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${config.gradient} mx-auto mb-4`}>
          <Lock className={`w-8 h-8 ${config.iconColor}`} />
        </div>
        <CardTitle className="text-2xl font-bold text-white mb-2">
          {config.title}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-gray-400 mb-6">
          Accédez à <span className="text-amber-400 font-semibold">{featureName}</span> en souscrivant à un abonnement adapté à vos besoins.
        </p>
        <Button
          size="lg"
          onClick={redirectToSubscription}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
        >
          <Icon className="w-5 h-5 mr-2" />
          Voir les offres
        </Button>
      </CardContent>
    </Card>
  );
}
