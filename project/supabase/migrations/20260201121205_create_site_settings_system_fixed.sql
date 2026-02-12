/*
  # Système de paramètres généraux du site

  1. Nouvelle table
    - `site_settings`
      - `id` (bigint, primary key) - ID auto-incrémenté
      - `setting_key` (text, unique) - Clé du paramètre (ex: 'whatsapp_number')
      - `setting_value` (text) - Valeur du paramètre
      - `setting_label` (text) - Libellé pour l'interface admin
      - `setting_type` (text) - Type de champ (text, number, email, tel, url)
      - `setting_group` (text) - Groupe de paramètres (ex: 'contact', 'general')
      - `is_public` (boolean) - Si le paramètre est accessible publiquement
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

  2. Données initiales
    - Numéro WhatsApp général du site
    - Email de contact général
    - Numéro de téléphone général

  3. Sécurité
    - RLS activé avec politiques restrictives
    - Lecture publique pour les paramètres publics uniquement
    - Écriture réservée aux administrateurs
*/

-- Supprimer la table si elle existe déjà (pour éviter les conflits)
DROP TABLE IF EXISTS site_settings CASCADE;

-- Créer la table site_settings
CREATE TABLE site_settings (
  id bigserial PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  setting_label text NOT NULL,
  setting_type text DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'email', 'tel', 'url', 'textarea')),
  setting_group text DEFAULT 'general',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : publique pour les paramètres publics
CREATE POLICY "Public can read public settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (is_public = true);

-- Politique de lecture : admin peut tout lire
CREATE POLICY "Admins can read all settings"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique d'insertion : admin uniquement
CREATE POLICY "Admins can insert settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique de mise à jour : admin uniquement
CREATE POLICY "Admins can update settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique de suppression : admin uniquement
CREATE POLICY "Admins can delete settings"
  ON site_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_site_settings_updated_at_trigger
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- Insérer les paramètres initiaux
INSERT INTO site_settings (setting_key, setting_value, setting_label, setting_type, setting_group, is_public)
VALUES
  ('whatsapp_number', '33123456789', 'Numéro WhatsApp général', 'tel', 'contact', true),
  ('contact_email', 'contact@altess.fr', 'Email de contact général', 'email', 'contact', true),
  ('contact_phone', '01 23 45 67 89', 'Téléphone de contact général', 'tel', 'contact', true),
  ('site_name', 'ALTESS', 'Nom du site', 'text', 'general', true),
  ('site_tagline', 'Le sens du partage', 'Slogan du site', 'text', 'general', true);

-- Index pour améliorer les performances
CREATE INDEX idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX idx_site_settings_group ON site_settings(setting_group);
CREATE INDEX idx_site_settings_public ON site_settings(is_public);

-- Créer une fonction utilitaire pour récupérer un paramètre facilement
CREATE OR REPLACE FUNCTION get_setting(key text)
RETURNS text AS $$
  SELECT setting_value FROM site_settings WHERE setting_key = key AND is_public = true LIMIT 1;
$$ LANGUAGE sql STABLE;
