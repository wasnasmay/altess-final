/*
  # Optimisation RLS - Partie 3 : Orchestra System

  ## Description
  Cette migration optimise les politiques RLS pour le système de gestion des orchestres
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.

  ## Tables optimisées
  1. orchestras - Orchestres
  2. orchestra_formulas - Formules d'orchestres
  3. demo_videos - Vidéos de démonstration
  4. instruments - Instruments
  5. custom_orders - Commandes personnalisées
  6. order_items - Items de commande

  ## Changements
  - Toutes les références à `auth.uid()` sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec optimisation de performance
*/

-- =====================================================
-- OPTIMISATION: orchestras
-- =====================================================

-- Vue des orchestres actifs
DROP POLICY IF EXISTS "Anyone can view active orchestras" ON orchestras;
CREATE POLICY "Anyone can view active orchestras"
  ON orchestras FOR SELECT
  TO authenticated
  USING (is_active = true OR provider_id = (SELECT auth.uid()));

-- Providers peuvent insérer leurs orchestres
DROP POLICY IF EXISTS "Providers can insert own orchestras" ON orchestras;
CREATE POLICY "Providers can insert own orchestras"
  ON orchestras FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('provider', 'admin')
    )
  );

-- Providers peuvent mettre à jour leurs orchestres
DROP POLICY IF EXISTS "Providers can update own orchestras" ON orchestras;
CREATE POLICY "Providers can update own orchestras"
  ON orchestras FOR UPDATE
  TO authenticated
  USING (provider_id = (SELECT auth.uid()))
  WITH CHECK (provider_id = (SELECT auth.uid()));

-- Admins peuvent gérer tous les orchestres
DROP POLICY IF EXISTS "Admins can manage all orchestras" ON orchestras;
CREATE POLICY "Admins can manage all orchestras"
  ON orchestras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: orchestra_formulas
-- =====================================================

-- Admins peuvent gérer les formules
DROP POLICY IF EXISTS "Admins can manage formulas" ON orchestra_formulas;
CREATE POLICY "Admins can manage formulas"
  ON orchestra_formulas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: demo_videos
-- =====================================================

-- Admins peuvent gérer les vidéos
DROP POLICY IF EXISTS "Admins can manage demo videos" ON demo_videos;
CREATE POLICY "Admins can manage demo videos"
  ON demo_videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: instruments
-- =====================================================

-- Admins peuvent gérer les instruments
DROP POLICY IF EXISTS "Admins can manage instruments" ON instruments;
CREATE POLICY "Admins can manage instruments"
  ON instruments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: custom_orders
-- =====================================================

-- Users peuvent voir leurs commandes
DROP POLICY IF EXISTS "Users can view own orders" ON custom_orders;
CREATE POLICY "Users can view own orders"
  ON custom_orders FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users peuvent créer des commandes
DROP POLICY IF EXISTS "Users can create orders" ON custom_orders;
CREATE POLICY "Users can create orders"
  ON custom_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users peuvent mettre à jour leurs commandes brouillons
DROP POLICY IF EXISTS "Users can update own draft orders" ON custom_orders;
CREATE POLICY "Users can update own draft orders"
  ON custom_orders FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND status = 'draft')
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Admins peuvent voir toutes les commandes
DROP POLICY IF EXISTS "Admins can view all orders" ON custom_orders;
CREATE POLICY "Admins can view all orders"
  ON custom_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Admins peuvent mettre à jour toutes les commandes
DROP POLICY IF EXISTS "Admins can update all orders" ON custom_orders;
CREATE POLICY "Admins can update all orders"
  ON custom_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: order_items
-- =====================================================

-- Users peuvent voir les items de leurs commandes
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_orders
      WHERE custom_orders.id = order_items.order_id
      AND custom_orders.user_id = (SELECT auth.uid())
    )
  );

-- Users peuvent gérer les items de leurs commandes brouillons
DROP POLICY IF EXISTS "Users can manage items in own draft orders" ON order_items;
CREATE POLICY "Users can manage items in own draft orders"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_orders
      WHERE custom_orders.id = order_items.order_id
      AND custom_orders.user_id = (SELECT auth.uid())
      AND custom_orders.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_orders
      WHERE custom_orders.id = order_items.order_id
      AND custom_orders.user_id = (SELECT auth.uid())
      AND custom_orders.status = 'draft'
    )
  );

-- Admins peuvent voir tous les items
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );