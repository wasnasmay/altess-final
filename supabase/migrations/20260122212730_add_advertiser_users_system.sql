/*
  # Système de Liaison Annonceurs

  Table de liaison entre utilisateurs et annonceurs
*/

-- =====================================================
-- TABLE: advertiser_users
-- =====================================================

CREATE TABLE IF NOT EXISTS advertiser_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  company_name text NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'editor')),
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_advertiser_users_user ON advertiser_users(user_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_users_email ON advertiser_users(email);
CREATE INDEX IF NOT EXISTS idx_advertiser_users_approved ON advertiser_users(is_approved);

ALTER TABLE advertiser_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own advertiser links
CREATE POLICY "Users can view their advertiser links"
  ON advertiser_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage advertiser links"
  ON advertiser_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Update premium_ads policies to allow advertisers to manage their own ads
CREATE POLICY "Advertisers can create their own ads"
  ON premium_ads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    advertiser_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM advertiser_users 
      WHERE user_id = auth.uid() 
      AND is_approved = true
    )
  );

CREATE POLICY "Advertisers can update their own ads"
  ON premium_ads
  FOR UPDATE
  TO authenticated
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());