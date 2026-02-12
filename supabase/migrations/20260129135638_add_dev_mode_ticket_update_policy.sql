/*
  # Politique de Mise à Jour pour Mode Développement

  ## Ajout
  Ajoute une politique permettant de mettre à jour le statut des billets
  en mode développement (fallback si Stripe n'est pas configuré).

  ## Note
  Cette politique devrait être retirée en production une fois Stripe configuré.
*/

-- Permettre la mise à jour du statut de paiement pour les billets en attente
CREATE POLICY "Allow updating pending tickets payment status"
ON ticket_purchases
FOR UPDATE
TO public
USING (payment_status = 'pending')
WITH CHECK (payment_status IN ('paid', 'cancelled'));

-- Commentaire
COMMENT ON POLICY "Allow updating pending tickets payment status" ON ticket_purchases 
IS 'Politique temporaire pour mode développement - permet de passer un billet de pending à paid sans webhook Stripe';
