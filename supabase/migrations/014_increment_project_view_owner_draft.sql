-- 조회수: 공개 프로젝트는 누구나, 초안은 소유자(미리보기)가 볼 때도 증가
-- 반환값으로 갱신된 view_count 를 주어 클라이언트가 추가 SELECT 없이 표시 가능

CREATE OR REPLACE FUNCTION public.increment_project_view(project_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.projects
  SET view_count = view_count + 1
  WHERE id = project_id
    AND (
      status = 'published'
      OR owner_id = auth.uid()
    )
  RETURNING view_count INTO v_count;

  IF v_count IS NOT NULL THEN
    RETURN v_count;
  END IF;

  SELECT view_count INTO v_count FROM public.projects WHERE id = project_id;
  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_project_view(uuid) TO anon, authenticated;
