-- 쇼케이스: PostgREST `profiles` 임베드가 RLS/스키마 이슈로 실패할 때를 대비해
-- 공개 프로젝트 소유자의 display_name·avatar_url만 반환하는 안전한 조회 (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.showcase_owner_profiles(p_owner_ids uuid[])
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pr.id, pr.display_name, pr.avatar_url
  FROM public.profiles pr
  WHERE cardinality(p_owner_ids) > 0
    AND pr.id = ANY (p_owner_ids)
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.owner_id = pr.id
        AND p.status = 'published'
    );
$$;

REVOKE ALL ON FUNCTION public.showcase_owner_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.showcase_owner_profiles(uuid[]) TO anon, authenticated;
