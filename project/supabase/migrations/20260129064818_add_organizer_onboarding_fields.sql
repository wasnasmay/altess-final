/*
  # Ajouter champs onboarding organisateur
  
  1. Nouveaux champs
    - `headquarters_address` : Adresse du siège social (pour facturation)
    - `headquarters_city` : Ville du siège
    - `headquarters_postal_code` : Code postal du siège
    - `headquarters_country` : Pays du siège (défaut: France)
    - `iban` : Compte bancaire pour virements
    - `vat_number` : Numéro de TVA intracommunautaire
    - `company_registration` : SIRET/SIREN
    - `onboarding_completed` : Flag pour savoir si l'onboarding est terminé
    - `onboarding_step` : Dernière étape complétée (pour reprendre où on s'est arrêté)
  
  2. Notes importantes
    - L'adresse du siège est différente de l'adresse des événements
    - L'IBAN est requis pour les virements de comptabilité
    - Le flag onboarding_completed permet de rediriger vers l'onboarding si incomplet
*/

-- Ajouter les champs d'onboarding
DO $$
BEGIN
  -- Adresse du siège social
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'headquarters_address'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN headquarters_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'headquarters_city'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN headquarters_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'headquarters_postal_code'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN headquarters_postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'headquarters_country'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN headquarters_country text DEFAULT 'France';
  END IF;

  -- Informations bancaires
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'iban'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN iban text;
  END IF;

  -- Informations fiscales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'vat_number'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN vat_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'company_registration'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN company_registration text;
  END IF;

  -- Tracking de l'onboarding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN onboarding_step integer DEFAULT 0;
  END IF;
END $$;
