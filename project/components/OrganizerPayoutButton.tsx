"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, DollarSign, AlertTriangle, Calendar } from "lucide-react";

interface OrganizerPayoutButtonProps {
  eventId: string;
  organizerId: string;
  eventDate: string;
  organizerAmount: number;
  eventTitle: string;
}

export default function OrganizerPayoutButton({
  eventId,
  organizerId,
  eventDate,
  organizerAmount,
  eventTitle,
}: OrganizerPayoutButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [availableDate, setAvailableDate] = useState<Date | null>(null);
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    checkPayoutAvailability();

    // Mettre à jour le compte à rebours chaque minute
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 60000);

    return () => clearInterval(interval);
  }, [eventDate]);

  function checkPayoutAvailability() {
    const eventDateObj = new Date(eventDate);
    const availableAfter = new Date(eventDateObj.getTime() + 48 * 60 * 60 * 1000); // 48h après
    setAvailableDate(availableAfter);

    const now = new Date();
    setIsAvailable(now >= availableAfter);
    updateTimeRemaining();

    // Vérifier si un virement existe déjà
    checkExistingPayout();
  }

  async function checkExistingPayout() {
    try {
      const { data, error } = await supabase
        .from('organizer_payouts')
        .select('payout_status, payout_date')
        .eq('event_id', eventId)
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setPayoutStatus(data.payout_status);
      }
    } catch (error) {
      // Pas de virement existant
    }
  }

  function updateTimeRemaining() {
    if (!availableDate) return;

    const now = new Date();
    const diff = availableDate.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining("Disponible maintenant");
      setIsAvailable(true);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      setTimeRemaining(`Disponible dans ${days} jour${days > 1 ? 's' : ''}`);
    } else {
      setTimeRemaining(`Disponible dans ${hours}h ${minutes}min`);
    }
  }

  async function requestPayout() {
    setLoading(true);
    try {
      // Créer une demande de virement via la fonction de base de données
      const { data, error } = await supabase.rpc('create_payout_request', {
        p_organizer_id: organizerId,
        p_event_id: eventId
      });

      if (error) throw error;

      toast({
        title: "Demande de virement envoyée",
        description: "Votre demande a été enregistrée et sera traitée sous 2-3 jours ouvrés.",
      });

      setPayoutStatus('available');
      checkExistingPayout();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la demande de virement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // États du bouton selon le statut
  const getButtonState = () => {
    if (payoutStatus === 'completed') {
      return {
        disabled: true,
        text: "Virement effectué",
        icon: <CheckCircle className="w-5 h-5" />,
        variant: "outline" as const,
        className: "bg-green-50 text-green-700 border-green-300",
      };
    }

    if (payoutStatus === 'processing') {
      return {
        disabled: true,
        text: "Virement en cours",
        icon: <Clock className="w-5 h-5 animate-spin" />,
        variant: "outline" as const,
        className: "bg-blue-50 text-blue-700 border-blue-300",
      };
    }

    if (payoutStatus === 'available' || payoutStatus === 'pending') {
      return {
        disabled: true,
        text: "Demande enregistrée",
        icon: <Clock className="w-5 h-5" />,
        variant: "outline" as const,
        className: "bg-amber-50 text-amber-700 border-amber-300",
      };
    }

    if (!isAvailable) {
      return {
        disabled: true,
        text: timeRemaining,
        icon: <Clock className="w-5 h-5" />,
        variant: "outline" as const,
        className: "bg-slate-100 text-slate-500 border-slate-300",
      };
    }

    return {
      disabled: loading,
      text: loading ? "Envoi en cours..." : "Demander mon virement",
      icon: <DollarSign className="w-5 h-5" />,
      variant: "default" as const,
      className: "bg-green-600 hover:bg-green-700 text-white",
    };
  };

  const buttonState = getButtonState();

  return (
    <Card className="shadow-xl border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Demande de Virement
        </CardTitle>
        <CardDescription>
          Récupérez vos gains 48h après la fin de l'événement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Montant à recevoir */}
        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
          <p className="text-sm text-green-700 font-medium mb-2">Montant à recevoir</p>
          <p className="text-4xl font-bold text-green-900">{organizerAmount.toFixed(2)}€</p>
          <p className="text-sm text-green-600 mt-2">Pour l'événement : {eventTitle}</p>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">Événement terminé</p>
              <p className="text-sm text-slate-500">
                {new Date(eventDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className={`w-5 h-5 mt-0.5 ${isAvailable ? 'text-green-600' : 'text-amber-600'}`} />
            <div>
              <p className="font-medium text-slate-900">
                {isAvailable ? 'Virement disponible' : 'Période de sécurisation'}
              </p>
              <p className="text-sm text-slate-500">
                {isAvailable
                  ? 'Vous pouvez maintenant demander votre virement'
                  : `${timeRemaining} (48h de délai de sécurité)`
                }
              </p>
            </div>
          </div>

          {payoutStatus && (
            <div className="flex items-start gap-3">
              {payoutStatus === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
              )}
              <div>
                <p className="font-medium text-slate-900">
                  {payoutStatus === 'completed' ? 'Virement effectué' : 'Traitement en cours'}
                </p>
                <p className="text-sm text-slate-500">
                  {payoutStatus === 'completed'
                    ? 'Les fonds ont été transférés sur votre compte bancaire'
                    : 'Votre demande est en cours de traitement (2-3 jours ouvrés)'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bouton d'action */}
        <Button
          onClick={requestPayout}
          disabled={buttonState.disabled}
          variant={buttonState.variant}
          className={`w-full ${buttonState.className}`}
          size="lg"
        >
          {buttonState.icon}
          {buttonState.text}
        </Button>

        {/* Message d'information */}
        {!isAvailable && !payoutStatus && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Période de sécurité</p>
              <p>
                Pour protéger les deux parties, les fonds sont bloqués pendant 48h après l'événement.
                Cela permet de gérer d'éventuels litiges ou remboursements.
              </p>
            </div>
          </div>
        )}

        {isAvailable && !payoutStatus && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Virement disponible</p>
              <p>
                Cliquez sur le bouton ci-dessus pour demander le transfert des fonds sur votre compte bancaire.
                Le virement sera effectué sous 2-3 jours ouvrés.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
