/*
  # Configure Storage policies for videos bucket

  1. Changes
    - Add public read access for all videos
    - Add authenticated upload access for videos
    - Add authenticated delete access for own videos
  
  2. Security
    - Public can read all videos (for playback)
    - Only authenticated users can upload
    - Only authenticated users can delete their own uploads
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read videos'
  ) THEN
    CREATE POLICY "Public can read videos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'videos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload videos'
  ) THEN
    CREATE POLICY "Authenticated users can upload videos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'videos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete own videos'
  ) THEN
    CREATE POLICY "Authenticated users can delete own videos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'videos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update own videos'
  ) THEN
    CREATE POLICY "Authenticated users can update own videos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'videos');
  END IF;
END $$;
