/*
  # Système de Gestion des Stations Radio

  1. Nouvelle Table
    - `radio_stations`
      - `id` (uuid, primary key)
      - `name` (text) - Nom de la station (ex: Radio ALTESS)
      - `stream_url` (text) - URL du flux audio
      - `logo_url` (text, nullable) - URL du logo/icône
      - `color` (text) - Couleur de la station (hex)
      - `display_order` (integer) - Ordre d'affichage
      - `is_active` (boolean) - Station active ou non
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `radio_stations`
    - Policy de lecture publique (tout le monde peut voir les stations actives)
    - Policy d'écriture pour les admins uniquement
*/

-- Création de la table radio_stations
CREATE TABLE IF NOT EXISTS radio_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stream_url text NOT NULL,
  logo_url text,
  color text NOT NULL DEFAULT '#f59e0b',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour l'ordre d'affichage
CREATE INDEX IF NOT EXISTS idx_radio_stations_order ON radio_stations(display_order);
CREATE INDEX IF NOT EXISTS idx_radio_stations_active ON radio_stations(is_active);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_radio_stations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS radio_stations_updated_at ON radio_stations;
CREATE TRIGGER radio_stations_updated_at
  BEFORE UPDATE ON radio_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_radio_stations_updated_at();

-- Enable RLS
ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les stations actives
CREATE POLICY "Anyone can view active radio stations"
  ON radio_stations
  FOR SELECT
  USING (is_active = true);

-- Policy: Les admins peuvent tout voir
CREATE POLICY "Admins can view all radio stations"
  ON radio_stations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Les admins peuvent insérer
CREATE POLICY "Admins can insert radio stations"
  ON radio_stations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Les admins peuvent mettre à jour
CREATE POLICY "Admins can update radio stations"
  ON radio_stations
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

-- Policy: Les admins peuvent supprimer
CREATE POLICY "Admins can delete radio stations"
  ON radio_stations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insertion des stations par défaut
INSERT INTO radio_stations (name, stream_url, color, display_order, is_active)
VALUES 
  ('Radio ALTESS', 'https://stream.radio.co/your-stream-id/listen', '#f59e0b', 1, true),
  ('Orientale 1', 'https://stream.radio.co/orientale1/listen', '#10b981', 2, true),
  ('Orientale 2', 'https://stream.radio.co/orientale2/listen', '#3b82f6', 3, true)
ON CONFLICT DO NOTHING;