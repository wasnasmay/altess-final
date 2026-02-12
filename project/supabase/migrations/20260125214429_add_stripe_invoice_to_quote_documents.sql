/*
  # Ajout des champs Stripe Invoice aux devis

  1. Nouvelles Colonnes dans `quote_documents`
    - `stripe_customer_id` (text) - ID du customer Stripe associé au client
    - `stripe_invoice_id` (text) - ID de la facture Stripe générée
    - `stripe_invoice_url` (text) - URL hébergée de la facture Stripe pour le paiement
    - `stripe_invoice_status` (text) - Statut de la facture Stripe (draft, open, paid, void, uncollectible)
    - `stripe_invoice_created_at` (timestamptz) - Date de création de la facture Stripe

  2. Notes Importantes
    - Ces champs permettent de générer des factures Stripe pour les devis acceptés
    - Le client reçoit un lien de paiement hébergé par Stripe
    - Le système peut suivre le statut de paiement via Stripe webhooks
    - Un devis peut avoir une seule facture Stripe active
*/

-- Ajouter les colonnes Stripe Invoice si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN stripe_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'stripe_invoice_id'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN stripe_invoice_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'stripe_invoice_url'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN stripe_invoice_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'stripe_invoice_status'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN stripe_invoice_status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_documents' AND column_name = 'stripe_invoice_created_at'
  ) THEN
    ALTER TABLE quote_documents ADD COLUMN stripe_invoice_created_at timestamptz;
  END IF;
END $$;

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_quote_documents_stripe_invoice_id ON quote_documents(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_quote_documents_stripe_customer_id ON quote_documents(stripe_customer_id);

-- Commentaires pour documentation
COMMENT ON COLUMN quote_documents.stripe_customer_id IS 'ID du customer Stripe associé au client du devis';
COMMENT ON COLUMN quote_documents.stripe_invoice_id IS 'ID de la facture Stripe générée pour ce devis';
COMMENT ON COLUMN quote_documents.stripe_invoice_url IS 'URL hébergée de la facture Stripe pour le paiement en ligne';
COMMENT ON COLUMN quote_documents.stripe_invoice_status IS 'Statut de la facture Stripe: draft, open, paid, void, uncollectible';
COMMENT ON COLUMN quote_documents.stripe_invoice_created_at IS 'Date de création de la facture Stripe';
