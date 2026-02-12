/*
  # Add Stripe Payment Link Column
  
  1. Changes
    - Add `stripe_payment_link` column to `orchestra_formulas` table
    - Type: TEXT (to store Stripe payment link URLs)
    - Nullable: YES (optional field)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestra_formulas' AND column_name = 'stripe_payment_link'
  ) THEN
    ALTER TABLE orchestra_formulas ADD COLUMN stripe_payment_link TEXT;
  END IF;
END $$;