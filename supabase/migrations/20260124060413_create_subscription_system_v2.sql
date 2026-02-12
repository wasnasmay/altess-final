/*
  # Système de Gestion d'Abonnements

  1. Tables créées
    - `subscription_plans` - Plans d'abonnement disponibles
    - `user_subscriptions` - Abonnements des utilisateurs
    - `user_favorites` - Favoris des utilisateurs
    - `mecenas_contributions` - Historique des contributions mécénat

  2. Security
    - Enable RLS sur toutes les tables
    - Policies pour que les users voient uniquement leurs données
*/

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('provider', 'advertiser', 'partner', 'general')),
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  max_videos integer,
  max_ads integer,
  priority_support boolean DEFAULT false,
  analytics_access boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'pending',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  auto_renew boolean DEFAULT true,
  payment_method text,
  last_payment_date timestamptz,
  next_billing_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des favoris utilisateurs
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  favoritable_type text NOT NULL CHECK (favoritable_type IN ('partner', 'star', 'orchestra', 'prestation', 'event')),
  favoritable_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, favoritable_type, favoritable_id)
);

-- Table historique contributions mécénat
CREATE TABLE IF NOT EXISTS mecenas_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_name text NOT NULL,
  partner_type text,
  amount numeric(10,2) NOT NULL,
  contribution_type text NOT NULL CHECK (contribution_type IN ('one_time', 'monthly', 'yearly')) DEFAULT 'one_time',
  message text,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecenas_contributions ENABLE ROW LEVEL SECURITY;

-- Policies pour subscription_plans (lecture publique)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour user_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies pour user_favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies pour mecenas_contributions
CREATE POLICY "Users can view own contributions"
  ON mecenas_contributions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create contributions"
  ON mecenas_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all contributions"
  ON mecenas_contributions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_mecenas_contributions_user_id ON mecenas_contributions(user_id);

-- Insérer des plans par défaut
INSERT INTO subscription_plans (name, description, type, price_monthly, price_yearly, features, max_videos, is_active) VALUES
  ('Prestataire Essentiel', 'Pour débuter sur ALTESS', 'provider', 29.99, 299.90, '["Jusqu''à 3 vidéos sociales", "Profil basique", "Support email"]'::jsonb, 3, true),
  ('Prestataire Pro', 'Pour les professionnels actifs', 'provider', 79.99, 799.90, '["Jusqu''à 10 vidéos sociales", "Profil premium", "Support prioritaire", "Analytics", "Badge vérifié"]'::jsonb, 10, true),
  ('Annonceur Starter', 'Démarrez votre communication', 'advertiser', 49.99, 499.90, '["Jusqu''à 5 publicités", "Ciblage basique", "Statistiques simples"]'::jsonb, 5, true),
  ('Annonceur Premium', 'Communication avancée', 'advertiser', 149.99, 1499.90, '["Publicités illimitées", "Ciblage avancé", "Analytics complets", "Support dédié", "Placement prioritaire"]'::jsonb, -1, true)
ON CONFLICT DO NOTHING;
