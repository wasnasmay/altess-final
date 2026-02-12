/*
  # Système de Documents de Devis

  1. Nouvelles Tables
    - `quote_templates` : Modèles de devis pré-configurés
    - `quote_documents` : Devis officiels envoyés aux clients
    - `quote_payments` : Paiements liés aux devis acceptés

  2. Sécurité
    - RLS activé sur toutes les tables
*/

-- Table des modèles de devis
CREATE TABLE IF NOT EXISTS quote_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  items jsonb DEFAULT '[]'::jsonb,
  validity_days integer DEFAULT 30,
  terms_conditions text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des documents de devis
CREATE TABLE IF NOT EXISTS quote_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES quote_templates(id) ON DELETE SET NULL,
  custom_order_id uuid REFERENCES custom_orders(id) ON DELETE SET NULL,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 20.00,
  tax_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  valid_until date,
  notes text,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des paiements de devis
CREATE TABLE IF NOT EXISTS quote_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_document_id uuid REFERENCES quote_documents(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date timestamptz,
  transaction_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quote_documents_user_id ON quote_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_documents_status ON quote_documents(status);
CREATE INDEX IF NOT EXISTS idx_quote_payments_document_id ON quote_payments(quote_document_id);

-- Fonction pour générer un numéro de devis
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS text AS $$
DECLARE
  new_number text;
  exists boolean;
BEGIN
  LOOP
    new_number := 'DEV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    SELECT EXISTS(SELECT 1 FROM quote_documents WHERE quote_number = new_number) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quote_templates_updated_at ON quote_templates;
CREATE TRIGGER update_quote_templates_updated_at
  BEFORE UPDATE ON quote_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quote_documents_updated_at ON quote_documents;
CREATE TRIGGER update_quote_documents_updated_at
  BEFORE UPDATE ON quote_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quote templates"
  ON quote_templates
  FOR ALL
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

CREATE POLICY "Everyone can view active templates"
  ON quote_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

ALTER TABLE quote_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quote documents"
  ON quote_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all quote documents"
  ON quote_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all quote documents"
  ON quote_documents
  FOR ALL
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

CREATE POLICY "Users can update their quote document status"
  ON quote_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE quote_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON quote_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_documents
      WHERE quote_documents.id = quote_payments.quote_document_id
      AND quote_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON quote_payments
  FOR ALL
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

-- Données de test
INSERT INTO quote_templates (name, description, base_price, items, validity_days, terms_conditions) VALUES
(
  'Formule Solo',
  'Prestation musicale avec un soliste professionnel',
  800.00,
  '[
    {"name": "Musicien soliste professionnel", "quantity": 1, "unit": "personne"},
    {"name": "Matériel sonorisation", "quantity": 1, "unit": "set"},
    {"name": "Déplacement (100km)", "quantity": 1, "unit": "forfait"},
    {"name": "Prestation 2h", "quantity": 1, "unit": "forfait"}
  ]'::jsonb,
  30,
  'Ce devis est valable 30 jours. Un acompte de 30% sera demandé à la confirmation. Le solde est à régler le jour de la prestation.'
),
(
  'Formule Trio',
  'Trio musical pour ambiance raffinée',
  1500.00,
  '[
    {"name": "Trio musical professionnel", "quantity": 3, "unit": "personnes"},
    {"name": "Matériel sonorisation complet", "quantity": 1, "unit": "set"},
    {"name": "Déplacement (100km)", "quantity": 1, "unit": "forfait"},
    {"name": "Prestation 3h", "quantity": 1, "unit": "forfait"},
    {"name": "Répertoire personnalisé", "quantity": 1, "unit": "forfait"}
  ]'::jsonb,
  30,
  'Ce devis est valable 30 jours. Un acompte de 30% sera demandé à la confirmation. Le solde est à régler le jour de la prestation.'
),
(
  'Orchestre Complet',
  'Orchestre complet pour événements prestigieux',
  3500.00,
  '[
    {"name": "Orchestre complet (8-12 musiciens)", "quantity": 1, "unit": "groupe"},
    {"name": "Chef d orchestre", "quantity": 1, "unit": "personne"},
    {"name": "Matériel sonorisation professionnel", "quantity": 1, "unit": "set"},
    {"name": "Éclairage scénique", "quantity": 1, "unit": "set"},
    {"name": "Déplacement national", "quantity": 1, "unit": "forfait"},
    {"name": "Prestation 4h", "quantity": 1, "unit": "forfait"},
    {"name": "Répertoire sur mesure", "quantity": 1, "unit": "forfait"}
  ]'::jsonb,
  30,
  'Ce devis est valable 30 jours. Un acompte de 30% sera demandé à la confirmation. Le solde est à régler le jour de la prestation.'
);
