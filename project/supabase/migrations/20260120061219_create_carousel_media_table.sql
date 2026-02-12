/*
  # Create Carousel Media Management System

  ## Summary
  This migration creates a comprehensive system for managing carousel media (images and videos) 
  that appear on the home page and other sections of the website.

  ## 1. New Tables
    
  ### `carousel_media`
  Central table for managing all carousel media items
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Display title for the media
  - `description` (text, nullable) - Optional description
  - `type` (text) - Media type: 'image' or 'video'
  - `url` (text) - Direct URL or Supabase Storage path
  - `thumbnail_url` (text, nullable) - Thumbnail for videos
  - `category` (text) - Category: 'home', 'gallery', 'featured', etc.
  - `order_position` (integer) - Display order (lower numbers first)
  - `is_active` (boolean) - Whether to display the media
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid, foreign key) - User who created the media

  ## 2. Storage Bucket
  - Creates 'carousel-media' bucket for storing uploaded files
  - Public access for viewing
  - Authenticated access for uploading

  ## 3. Security
  - Enable RLS on `carousel_media` table
  - Public read access for active items
  - Authenticated users can create/update/delete
  - Storage policies for public read and authenticated upload

  ## 4. Indexes
  - Index on category and order_position for efficient querying
  - Index on is_active for filtering active items
*/

-- Create carousel_media table
CREATE TABLE IF NOT EXISTS carousel_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  thumbnail_url text,
  category text NOT NULL DEFAULT 'home',
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carousel_media_category_order 
  ON carousel_media(category, order_position) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_carousel_media_active 
  ON carousel_media(is_active);

-- Enable RLS
ALTER TABLE carousel_media ENABLE ROW LEVEL SECURITY;

-- Public can read active carousel items
CREATE POLICY "Anyone can view active carousel media"
  ON carousel_media
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all carousel items
CREATE POLICY "Authenticated users can view all carousel media"
  ON carousel_media
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert carousel media
CREATE POLICY "Authenticated users can create carousel media"
  ON carousel_media
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update carousel media
CREATE POLICY "Authenticated users can update carousel media"
  ON carousel_media
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete carousel media
CREATE POLICY "Authenticated users can delete carousel media"
  ON carousel_media
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for carousel media
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-media', 'carousel-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for carousel-media bucket
CREATE POLICY "Public can view carousel media files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'carousel-media');

CREATE POLICY "Authenticated users can upload carousel media files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'carousel-media');

CREATE POLICY "Authenticated users can update carousel media files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'carousel-media')
  WITH CHECK (bucket_id = 'carousel-media');

CREATE POLICY "Authenticated users can delete carousel media files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'carousel-media');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_carousel_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS carousel_media_updated_at ON carousel_media;
CREATE TRIGGER carousel_media_updated_at
  BEFORE UPDATE ON carousel_media
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_media_updated_at();
