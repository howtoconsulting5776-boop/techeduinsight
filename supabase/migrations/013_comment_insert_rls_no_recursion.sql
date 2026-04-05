-- 이전 버전 011(재귀 유발 INSERT 정책)만 적용된 DB용 수선. 내용은 현재 011과 동일·멱등.
-- INSERT 정책 WITH CHECK 에서 project_comments 를 직접 SELECT 하면 RLS 무한 재귀가 난다.

CREATE OR REPLACE FUNCTION public.comment_parent_belongs_to_project(
  p_parent_id uuid,
  p_project_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_comments pc
    WHERE pc.id = p_parent_id
      AND pc.project_id = p_project_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.comment_parent_belongs_to_project(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "comments_insert_authenticated" ON public.project_comments;

CREATE POLICY "comments_insert_authenticated"
  ON public.project_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.status = 'published'
    )
    AND (
      parent_id IS NULL
      OR public.comment_parent_belongs_to_project(parent_id, project_id)
    )
  );
