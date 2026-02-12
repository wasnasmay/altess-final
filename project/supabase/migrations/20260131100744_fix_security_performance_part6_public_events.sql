/*
  # Optimisation RLS - Partie 6 : Public Events System

  ## Description
  Cette migration optimise les politiques RLS pour le système d'événements publics
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.

  ## Tables optimisées
  1. public_events - Événements publics

  ## Changements
  - Toutes les références à `auth.uid()` sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec optimisation de performance
*/

-- =====================================================
-- OPTIMISATION: public_events
-- =====================================================

-- Admins peuvent créer des événements
DROP POLICY IF EXISTS "Admins can create events" ON public_events;
CREATE POLICY "Admins can create events"
  ON public_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Admins peuvent modifier des événements
DROP POLICY IF EXISTS "Admins can update events" ON public_events;
CREATE POLICY "Admins can update events"
  ON public_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Admins peuvent supprimer des événements
DROP POLICY IF EXISTS "Admins can delete events" ON public_events;
CREATE POLICY "Admins can delete events"
  ON public_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );