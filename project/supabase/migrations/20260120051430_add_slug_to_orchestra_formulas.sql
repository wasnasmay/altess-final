/*
  # Add slug field to orchestra_formulas

  1. Changes
    - Add `slug` column to `orchestra_formulas` table
    - Create unique index on slug
    - Update existing records with slugs based on names
  
  2. Security
    - No changes to RLS policies
*/

-- Add slug column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestra_formulas' AND column_name = 'slug'
  ) THEN
    ALTER TABLE orchestra_formulas ADD COLUMN slug text;
  END IF;
END $$;

-- Update existing records with slugs
UPDATE orchestra_formulas SET slug = 'solo' WHERE name ILIKE '%solo%';
UPDATE orchestra_formulas SET slug = 'trio' WHERE name ILIKE '%trio%';
UPDATE orchestra_formulas SET slug = 'complet' WHERE name ILIKE '%complet%' OR name ILIKE '%complete%';

-- Make slug NOT NULL after populating
ALTER TABLE orchestra_formulas ALTER COLUMN slug SET NOT NULL;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_orchestra_formulas_slug ON orchestra_formulas(slug);
