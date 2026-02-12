/*
  # Link Carousel Media to Orchestra Formulas

  ## Summary
  This migration adds the ability to associate carousel media items with specific orchestra formulas,
  allowing each formula to have its own dedicated gallery.

  ## Changes
  
  ### 1. Modifications to `carousel_media` table
  - Add `orchestra_formula_id` (uuid, nullable, foreign key) - Links media to a specific orchestra formula
  - When null, media belongs to the general "home" category
  - When set, media is specific to that orchestra formula
  
  ### 2. Foreign Key Constraint
  - References `orchestra_formulas(id)` with ON DELETE CASCADE
  - If a formula is deleted, its associated carousel media is also deleted
  
  ### 3. Index
  - Add index on `orchestra_formula_id` for efficient querying
  
  ## Usage
  - General carousel (home page): `orchestra_formula_id IS NULL` and `category = 'home'`
  - Formula-specific carousel: `orchestra_formula_id = '<formula_id>'`
*/

-- Add orchestra_formula_id column to carousel_media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carousel_media' AND column_name = 'orchestra_formula_id'
  ) THEN
    ALTER TABLE carousel_media 
    ADD COLUMN orchestra_formula_id uuid REFERENCES orchestra_formulas(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on orchestra_formula_id
CREATE INDEX IF NOT EXISTS idx_carousel_media_formula 
  ON carousel_media(orchestra_formula_id) 
  WHERE orchestra_formula_id IS NOT NULL;

-- Update existing RLS policies to work with formula-specific media
DROP POLICY IF EXISTS "Anyone can view active carousel media" ON carousel_media;
CREATE POLICY "Anyone can view active carousel media"
  ON carousel_media
  FOR SELECT
  USING (is_active = true);
