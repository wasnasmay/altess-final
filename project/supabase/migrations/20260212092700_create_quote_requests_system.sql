/*
  # Système de Demandes de Devis pour Orientale Musique
  
  1. Nouvelles Tables
    - `quote_requests`
      - `id` (uuid, primary key)
      - `client_name` (text) - Nom du client
      - `client_email` (text) - Email du client
      - `client_phone` (text) - Téléphone du client
      - `event_date` (date) - Date de l'événement
      - `event_city` (text) - Ville de l'événement
      - `event_type` (text) - Type d'événement
      - `guests_count` (integer) - Nombre d'invités
      - `duration_hours` (integer) - Durée en heures
      - `musicians_count` (integer) - Nombre de musiciens souhaités
      - `additional_notes` (text) - Notes complémentaires
      - `status` (text) - Status: 'pending', 'quoted', 'accepted', 'rejected', 'paid'
      - `source` (text) - Source de la demande
      - `quote_amount` (decimal) - Montant du devis
      - `stripe_payment_link` (text) - Lien de paiement Stripe
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Sécurité
    - Enable RLS
    - Public insert pour nouvelles demandes
    - Admin full access
*/

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  event_date date NOT NULL,
  event_city text NOT NULL,
  event_type text,
  guests_count integer DEFAULT 50,
  duration_hours integer DEFAULT 4,
  musicians_count integer DEFAULT 5,
  additional_notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected', 'paid')),
  source text DEFAULT 'web',
  quote_amount decimal(10, 2),
  stripe_payment_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert a new quote request
CREATE POLICY "Anyone can submit quote request"
  ON quote_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own quotes by email
CREATE POLICY "Users can view own quotes"
  ON quote_requests
  FOR SELECT
  USING (
    client_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can manage all quotes
CREATE POLICY "Admins can manage all quotes"
  ON quote_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(client_email);
