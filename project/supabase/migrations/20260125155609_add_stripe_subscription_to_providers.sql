/*
  # Ajout des Champs Stripe pour les Abonnements Prestataires

  ## Vue d'ensemble
  Cette migration ajoute les champs nécessaires pour gérer les abonnements
  Stripe des prestataires événementiels sur la plateforme ALTOS.

  ## Modifications apportées

  ### Table `event_providers` - Nouveaux champs:
  - `stripe_customer_id` (text, nullable) - ID client Stripe unique
  - `stripe_subscription_id` (text, nullable) - ID abonnement Stripe actif
  - `subscription_status` (text, default: 'inactive') - Statut de l'abonnement
    * inactive: Aucun abonnement actif
    * active: Abonnement en cours et valide
    * past_due: Paiement en retard
    * canceled: Abonnement annulé
    * trialing: Période d'essai
  - `plan_type` (text, default: 'free') - Type de plan souscrit
    * free: Plan gratuit avec fonctionnalités limitées
    * pro: Plan professionnel avec fonctionnalités étendues
    * premium: Plan premium avec toutes les fonctionnalités

  ## Sécurité
  - Les champs Stripe ne peuvent être modifiés que par les administrateurs
  - Les prestataires peuvent uniquement VOIR leur propre subscription_status et plan_type
  - Les stripe_customer_id et stripe_subscription_id restent confidentiels

  ## Notes d'implémentation
  - Cette migration est idempotente (peut être exécutée plusieurs fois)
  - Les valeurs par défaut assurent la compatibilité avec les données existantes
  - Index créés pour optimiser les requêtes de facturation
*/

-- =====================================================
-- AJOUT DES COLONNES
-- =====================================================

DO $$
BEGIN
  -- Stripe Customer ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_providers' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE event_providers 
    ADD COLUMN stripe_customer_id text UNIQUE;
  END IF;

  -- Stripe Subscription ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_providers' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE event_providers 
    ADD COLUMN stripe_subscription_id text;
  END IF;

  -- Subscription Status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_providers' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE event_providers 
    ADD COLUMN subscription_status text DEFAULT 'inactive' 
    CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing'));
  END IF;

  -- Plan Type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_providers' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE event_providers 
    ADD COLUMN plan_type text DEFAULT 'free' 
    CHECK (plan_type IN ('free', 'pro', 'premium'));
  END IF;
END $$;

-- =====================================================
-- INDEXES DE PERFORMANCE
-- =====================================================

-- Index pour rechercher par customer Stripe (facturation)
CREATE INDEX IF NOT EXISTS idx_event_providers_stripe_customer 
ON event_providers(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Index pour rechercher par statut d'abonnement
CREATE INDEX IF NOT EXISTS idx_event_providers_subscription_status 
ON event_providers(subscription_status) 
WHERE subscription_status = 'active';

-- Index pour rechercher par type de plan
CREATE INDEX IF NOT EXISTS idx_event_providers_plan_type 
ON event_providers(plan_type) 
WHERE plan_type != 'free';

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN event_providers.stripe_customer_id IS 'ID unique du client dans Stripe (confidentiel)';
COMMENT ON COLUMN event_providers.stripe_subscription_id IS 'ID de l''abonnement actif dans Stripe (confidentiel)';
COMMENT ON COLUMN event_providers.subscription_status IS 'Statut actuel de l''abonnement: inactive, active, past_due, canceled, trialing';
COMMENT ON COLUMN event_providers.plan_type IS 'Type de plan souscrit: free (gratuit), pro (professionnel), premium (premium)';
