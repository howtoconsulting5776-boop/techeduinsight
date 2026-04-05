-- 쇼케이스·프로젝트 상세에서 공개 프로젝트 소유자의 별명(display_name)을
-- 익명 포함 누구나 조회할 수 있도록 함 (기존 정책은 본인 행만 허용)

CREATE POLICY "profiles_select_published_project_owner"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.owner_id = profiles.id
        AND p.status = 'published'
    )
  );
