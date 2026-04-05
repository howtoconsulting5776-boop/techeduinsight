-- ============================================================
-- 002_storage.sql
-- TechEdu Insight - Supabase Storage: thumbnails bucket
-- ============================================================

-- Create the public 'thumbnails' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Storage RLS policies for the 'thumbnails' bucket
-- ────────────────────────────────────────────────────────────

-- SELECT (read): all users including anonymous
CREATE POLICY "thumbnails_read_public"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'thumbnails');

-- INSERT (upload): authenticated users only
CREATE POLICY "thumbnails_upload_authenticated"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: owner only (uploader matches auth.uid)
CREATE POLICY "thumbnails_update_owner"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'thumbnails'
    AND owner_id::uuid = auth.uid()
  );

-- DELETE: owner only
CREATE POLICY "thumbnails_delete_owner"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'thumbnails'
    AND owner_id::uuid = auth.uid()
  );
