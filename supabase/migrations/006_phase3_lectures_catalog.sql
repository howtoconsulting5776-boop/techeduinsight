-- Phase 3: catalog without exposing youtube_id; align PREMIUM access with Edge Function (TEACHER allowed)

-- Safe listing: no youtube_id column (prevents leaking IDs to browsers via Supabase client)
CREATE OR REPLACE FUNCTION public.list_lectures_for_catalog()
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  sort_order integer,
  duration_sec integer,
  required_role public.video_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.title, v.category, v.sort_order, v.duration_sec, v.required_role
  FROM public.videos v
  ORDER BY v.sort_order ASC, v.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.list_lectures_for_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_lectures_for_catalog() TO anon;
GRANT EXECUTE ON FUNCTION public.list_lectures_for_catalog() TO authenticated;

-- PREMIUM videos: PREMIUM, TEACHER, ADMIN (matches get-video-token Phase 3 rules)
DROP POLICY IF EXISTS "videos_select_by_role" ON public.videos;

CREATE POLICY "videos_select_by_role"
  ON public.videos
  FOR SELECT
  USING (
    CASE required_role
      WHEN 'MEMBER' THEN auth.uid() IS NOT NULL
      WHEN 'PREMIUM' THEN (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('PREMIUM', 'TEACHER', 'ADMIN')
        )
      )
      ELSE false
    END
  );
