'use client';

import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriptionStatus } from '@/lib/subscription-guard';

interface SubscriptionAlertProps {
  status: SubscriptionStatus;
  companyName?: string;
}

export function SubscriptionAlert({ status, companyName }: SubscriptionAlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed || (status !== 'past_due' && status !== 'canceled' && status !== 'inactive')) {
    return null;
  }

  const getAlertConfig = () => {
    switch (status) {
      case 'past_due':
        return {
          icon: CreditCard,
          title: 'Problème de paiement détecté',
          description: 'Votre dernier paiement n\'a pas pu être traité. Veuillez mettre à jour vos informations de paiement pour continuer à profiter de vos fonctionnalités premium.',
          bgColor: 'bg-gradient-to-r from-orange-950/90 to-red-950/90',
          borderColor: 'border-orange-500/50',
          textColor: 'text-orange-100',
          buttonColor: 'bg-orange-500 hover:bg-orange-600',
        };
      case 'canceled':
        return {
          icon: AlertTriangle,
          title: 'Abonnement annulé',
          description: 'Votre abonnement a été annulé. Réactivez-le pour continuer à accéder aux fonctionnalités premium.',
          bgColor: 'bg-gradient-to-r from-red-950/90 to-slate-950/90',
          borderColor: 'border-red-500/50',
          textColor: 'text-red-100',
          buttonColor: 'bg-red-500 hover:bg-red-600',
        };
      case 'inactive':
        return {
          icon: AlertTriangle,
          title: 'Aucun abonnement actif',
          description: 'Souscrivez à un abonnement pour accéder aux fonctionnalités avancées et booster votre visibilité.',
          bgColor: 'bg-gradient-to-r from-slate-900/90 to-slate-950/90',
          borderColor: 'border-slate-600/50',
          textColor: 'text-slate-100',
          buttonColor: 'bg-amber-500 hover:bg-amber-600',
        };
      default:
        return null;
    }
  };

  const config = getAlertConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Alert
      className={`${config.bgColor} border-2 ${config.borderColor} ${config.textColor} backdrop-blur-sm shadow-lg mb-6 relative`}
    >
      <Icon className="h-5 w-5 text-current" />
      <AlertDescription className="flex items-center justify-between gap-4 ml-6">
        <div className="flex-1">
          <p className="font-semibold mb-1">{config.title}</p>
          <p className="text-sm opacity-90">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push('/settings/subscription')}
            className={`${config.buttonColor} text-white font-semibold shrink-0`}
          >
            {status === 'inactive' ? 'Voir les offres' : 'Gérer l\'abonnement'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="shrink-0 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
