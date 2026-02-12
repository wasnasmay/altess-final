'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Event {
  id: string;
  title: string;
  event_date: string;
  status: string;
}

interface PayoutModuleProps {
  organizerId: string;
  pendingBalance: number;
  events: Event[];
  onRequestPayout: () => void;
}

export default function OrganizerPayoutModule({
  organizerId,
  pendingBalance,
  events,
  onRequestPayout
}: PayoutModuleProps) {
  const [canRequestPayout, setCanRequestPayout] = useState(false);
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    checkPayoutEligibility();
  }, [events]);

  useEffect(() => {
    if (nextAvailableDate) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = nextAvailableDate.getTime() - now.getTime();

        if (diff <= 0) {
          setCanRequestPayout(true);
          setTimeRemaining('');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [nextAvailableDate]);

  const checkPayoutEligibility = () => {
    const now = new Date();
    const recentEvents = events.filter(event => event.status === 'completed');

    if (recentEvents.length === 0) {
      setCanRequestPayout(false);
      return;
    }

    const lastEventDate = new Date(
      Math.max(...recentEvents.map(e => new Date(e.event_date).getTime()))
    );

    const hoursSinceLastEvent = (now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastEvent >= 48) {
      setCanRequestPayout(true);
      setNextAvailableDate(null);
    } else {
      setCanRequestPayout(false);
      const availableDate = new Date(lastEventDate.getTime() + 48 * 60 * 60 * 1000);
      setNextAvailableDate(availableDate);
    }
  };

  const handlePayoutRequest = () => {
    if (!canRequestPayout) {
      toast.error('Demande de virement non disponible', {
        description: `Vous pourrez demander un virement dans ${timeRemaining}`
      });
      return;
    }

    if (pendingBalance <= 0) {
      toast.error('Solde insuffisant', {
        description: 'Vous devez avoir un solde positif pour demander un virement'
      });
      return;
    }

    onRequestPayout();
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-500" />
            Demande de virement
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-slate-400 hover:text-amber-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Pour des raisons de sécurité, les virements ne peuvent être demandés que 48h après la fin de votre dernier événement. Cela permet de gérer les éventuels remboursements.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Solde disponible</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-slate-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Montant total des ventes après commission</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-3xl font-bold text-white">
            {pendingBalance.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            })}
          </div>
        </div>

        {!canRequestPayout && nextAvailableDate && (
          <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-400 mb-1">
                  Virement différé
                </p>
                <p className="text-xs text-slate-300">
                  Disponible dans <span className="font-mono font-bold text-amber-400">{timeRemaining}</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Date de disponibilité : {nextAvailableDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {canRequestPayout && (
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400 mb-1">
                  Virement disponible
                </p>
                <p className="text-xs text-slate-300">
                  Vous pouvez maintenant demander le transfert de vos fonds
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handlePayoutRequest}
          disabled={!canRequestPayout || pendingBalance <= 0}
          className={
            canRequestPayout && pendingBalance > 0
              ? 'w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              : 'w-full'
          }
        >
          {canRequestPayout ? (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Demander mon virement
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Virement non disponible
            </>
          )}
        </Button>

        <p className="text-xs text-slate-500 text-center">
          Les virements sont traités sous 3-5 jours ouvrés
        </p>
      </CardContent>
    </Card>
  );
}
