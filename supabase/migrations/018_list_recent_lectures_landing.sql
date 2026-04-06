-- 랜딩: 최근 등록 강의 (created_at 내림차순). catalog RPC와 동일하게 youtube_id 미노출.

CREATE OR REPLACE FUNCTION public.list_recent_lectures_for_landing(p_limit integer DEFAULT 4)
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
  ORDER BY v.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 4), 24));
$$;

REVOKE ALL ON FUNCTION public.list_recent_lectures_for_landing(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_recent_lectures_for_landing(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.list_recent_lectures_for_landing(integer) TO authenticated;
