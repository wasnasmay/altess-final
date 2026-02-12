/*
  # Add Financial Fields to Event Organizers

  1. New Fields
    - `legal_name` (text) - Raison sociale de l'entreprise
    - `headquarters_address` (text) - Adresse du siège social
    - `vat_number` (text) - Numéro de TVA intracommunautaire
    - `rib_url` (text) - URL du RIB uploadé
    - `vat_enabled` (boolean) - TVA activée ou non
    - `vat_rate` (numeric) - Taux de TVA (par défaut 20%)
  
  2. Security
    - Ces champs sont accessibles uniquement par l'organisateur propriétaire
*/

-- Add new financial fields to event_organizers
ALTER TABLE event_organizers
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS headquarters_address TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS rib_url TEXT,
ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 20.0;

-- Create storage bucket for documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents
CREATE POLICY "Organizers can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Organizers can view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
