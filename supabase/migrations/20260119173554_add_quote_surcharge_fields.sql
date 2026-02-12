/*
  # Ajout des champs de calcul de prix pour les devis

  1. Modifications
    - Ajouter `distance_km` à quote_documents (distance en km pour calculer les frais)
    - Ajouter `distance_surcharge` à quote_documents (supplément pour la distance)
    - Ajouter `duration_surcharge` à quote_documents (supplément pour la durée)

  Ces champs permettent un calcul automatique et transparent des suppléments appliqués au prix de base.
*/

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'distance_km'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN distance_km numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'distance_surcharge'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN distance_surcharge numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'duration_surcharge'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN duration_surcharge numeric(10,2) DEFAULT 0;
  END IF;
END $$;
