/**
 * EXEMPLE D'UTILISATION DU SYSTÈME DE PROTECTION D'ABONNEMENT
 *
 * Ce fichier montre comment protéger les fonctionnalités premium
 * dans différents scénarios d'utilisation.
 */

'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Calendar, BarChart3 } from 'lucide-react';

// ========================================
// EXEMPLE 1: Protéger une action spécifique
// ========================================

export function ExempleProtectionAction() {
  const { guardPremiumFeature, canAccessPremium } = useSubscription();

  function handleAddVideo() {
    // Vérifie l'accès avant d'exécuter l'action
    if (!guardPremiumFeature('l\'ajout de vidéos premium')) {
      return; // Redirection automatique vers /settings/subscription
    }

    // Code pour ajouter la vidéo (seulement si accès autorisé)
    console.log('Ajout de vidéo autorisé');
  }

  return (
    <div>
      <Button
        onClick={handleAddVideo}
        disabled={!canAccessPremium}
      >
        <Video className="w-4 h-4 mr-2" />
        Ajouter une vidéo premium
      </Button>
    </div>
  );
}

// ========================================
// EXEMPLE 2: Protéger une section entière
// ========================================

export function ExempleProtectionSection() {
  return (
    <div className="space-y-6">
      {/* Contenu gratuit - accessible à tous */}
      <Card className="p-6">
        <h2>Statistiques de base</h2>
        <p>Visible par tous les utilisateurs</p>
      </Card>

      {/* Contenu premium - protégé */}
      <SubscriptionGuard
        level="premium"
        featureName="les statistiques avancées"
        redirect={false} // Affiche un message au lieu de rediriger
      >
        <Card className="p-6">
          <h2>Statistiques avancées</h2>
          <p>Réservé aux abonnés Pro/Premium</p>
          <BarChart3 className="w-12 h-12 text-amber-500" />
        </Card>
      </SubscriptionGuard>
    </div>
  );
}

// ========================================
// EXEMPLE 3: Protection avec redirection
// ========================================

export function ExempleProtectionPageEntiere() {
  return (
    <SubscriptionGuard
      level="pro"
      featureName="la gestion des rendez-vous"
      redirect={true} // Redirige automatiquement si pas d'accès
    >
      <div className="container mx-auto p-6">
        <h1>Gestion des rendez-vous</h1>
        <Calendar className="w-12 h-12" />
        <p>Cette page est réservée aux abonnés Pro et Premium</p>
      </div>
    </SubscriptionGuard>
  );
}

// ========================================
// EXEMPLE 4: Vérification conditionnelle
// ========================================

export function ExempleVerificationConditionnelle() {
  const {
    subscriptionData,
    canAccessPremium,
    canAccessPro,
    isActive
  } = useSubscription();

  return (
    <div className="space-y-4">
      {/* Afficher différent contenu selon le plan */}
      {!isActive && (
        <div className="bg-red-900/20 p-4 rounded">
          <p>Votre abonnement n'est pas actif</p>
        </div>
      )}

      {canAccessPro && (
        <div className="bg-green-900/20 p-4 rounded">
          <p>Fonctionnalités Pro disponibles</p>
        </div>
      )}

      {canAccessPremium && (
        <div className="bg-purple-900/20 p-4 rounded">
          <p>Fonctionnalités Premium disponibles</p>
        </div>
      )}

      {/* Afficher les détails de l'abonnement */}
      {subscriptionData && (
        <Card className="p-4">
          <h3>Détails de l'abonnement</h3>
          <p>Plan: {subscriptionData.planType}</p>
          <p>Statut: {subscriptionData.status}</p>
          <p>Entreprise: {subscriptionData.companyName}</p>
        </Card>
      )}
    </div>
  );
}

// ========================================
// EXEMPLE 5: Formulaire avec validation
// ========================================

export function ExempleFormulaireProtege() {
  const { guardPremiumFeature, canAccessPremium } = useSubscription();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Vérifier l'accès avant de soumettre
    if (!guardPremiumFeature('l\'envoi de devis personnalisés')) {
      return;
    }

    // Code de soumission du formulaire
    console.log('Formulaire soumis');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Description" />
      <input type="number" placeholder="Prix" />

      <Button
        type="submit"
        disabled={!canAccessPremium}
      >
        Envoyer le devis {!canAccessPremium && '(Pro requis)'}
      </Button>
    </form>
  );
}

// ========================================
// EXEMPLE 6: Limite basée sur le plan
// ========================================

export function ExempleLimiteParPlan() {
  const { subscriptionData } = useSubscription();

  // Définir les limites par plan
  const limits = {
    free: { photos: 5, videos: 0 },
    pro: { photos: 50, videos: 10 },
    premium: { photos: 999, videos: 999 },
  };

  const currentLimit = subscriptionData
    ? limits[subscriptionData.planType]
    : limits.free;

  return (
    <div>
      <p>Photos autorisées: {currentLimit.photos}</p>
      <p>Vidéos autorisées: {currentLimit.videos}</p>
    </div>
  );
}

// ========================================
// EXEMPLE 7: UI adaptative selon le plan
// ========================================

export function ExempleUIAdaptative() {
  const { subscriptionData } = useSubscription();

  const isPremium = subscriptionData?.planType === 'premium';

  return (
    <Card className={`p-6 ${isPremium ? 'border-purple-500 shadow-purple-500/20' : ''}`}>
      <div className="flex items-center justify-between">
        <h3>Ma fiche prestataire</h3>
        {isPremium && (
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs">
            Premium
          </span>
        )}
      </div>

      {isPremium ? (
        <p>Version Premium avec mise en avant spéciale</p>
      ) : (
        <p>Version standard</p>
      )}
    </Card>
  );
}
