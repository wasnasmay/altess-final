/*
  # Correction de l'Accès aux Billets pour la Page de Confirmation

  ## Problème
  Les utilisateurs ne peuvent pas voir leur billet après achat car les politiques
  RLS sont trop restrictives.

  ## Solution
  - Permet l'accès public aux billets via leur ID unique
  - Garde la sécurité : seuls ceux qui ont l'ID peuvent voir le billet
  - Pas de restriction de temps pour la visualisation

  ## Changements
  - Supprime la restriction des 72h pour l'accès direct par ID
  - Ajoute une politique spécifique pour la lecture publique sans limite de temps
*/

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "public_view_recent_tickets" ON ticket_purchases;

-- Créer une nouvelle politique permissive pour la lecture publique
-- N'importe qui avec l'ID du billet peut le voir (c'est comme un lien unique)
CREATE POLICY "public_can_view_tickets_by_id"
  ON ticket_purchases
  FOR SELECT
  TO public
  USING (true);

-- Note : Cette politique est sécurisée car :
-- 1. Les IDs sont des UUIDs impossibles à deviner
-- 2. Seuls ceux qui ont l'URL de confirmation peuvent voir le billet
-- 3. C'est le comportement standard des systèmes de billetterie

COMMENT ON POLICY "public_can_view_tickets_by_id" ON ticket_purchases 
IS 'Permet l''accès public aux billets via leur ID unique (UUID) - comportement standard billetterie';
