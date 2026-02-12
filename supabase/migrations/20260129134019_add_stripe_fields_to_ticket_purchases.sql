/*
  # Ajout des Champs Stripe à ticket_purchases

  ## Modifications
  Ajout de 3 colonnes pour intégrer Stripe Checkout :
  - `stripe_session_id` : ID de la session Stripe Checkout
  - `stripe_payment_intent` : ID du payment intent Stripe
  - `paid_at` : Date et heure du paiement confirmé

  ## But
  Permettre le suivi complet des paiements via Stripe et la réconciliation
  des billets avec les transactions Stripe.
*/

-- Ajouter les colonnes Stripe
ALTER TABLE ticket_purchases
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent text,
ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Index pour rechercher rapidement par session Stripe
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_stripe_session 
ON ticket_purchases(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_ticket_purchases_stripe_payment_intent 
ON ticket_purchases(stripe_payment_intent);

-- Commentaires
COMMENT ON COLUMN ticket_purchases.stripe_session_id IS 'ID de la session Stripe Checkout';
COMMENT ON COLUMN ticket_purchases.stripe_payment_intent IS 'ID du payment intent Stripe';
COMMENT ON COLUMN ticket_purchases.paid_at IS 'Date et heure de confirmation du paiement';
