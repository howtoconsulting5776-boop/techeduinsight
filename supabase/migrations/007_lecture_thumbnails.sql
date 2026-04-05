-- Lecture catalog thumbnails (custom upload; youtube_id still not exposed in RPC)

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS thumbnail_path text;

COMMENT ON COLUMN public.videos.thumbnail_path IS
  'Storage path in public thumbnails bucket, e.g. lectures/{video_id}/{file}';

CREATE OR REPLACE FUNCTION public.list_lectures_for_catalog()
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  sort_order integer,
  duration_sec integer,
  required_role public.video_role,
  thumbnail_path text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    v.title,
    v.category,
    v.sort_order,
    v.duration_sec,
    v.required_role,
    v.thumbnail_path
  FROM public.videos v
  ORDER BY v.sort_order ASC, v.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.list_lectures_for_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_lectures_for_catalog() TO anon;
GRANT EXECUTE ON FUNCTION public.list_lectures_for_catalog() TO authenticated;
