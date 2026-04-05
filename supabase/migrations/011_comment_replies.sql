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
  );-- 대댓글: parent_id (같은 project_id인 댓글만 부모로 허용)
-- 부모 검증은 SECURITY DEFINER 함수로만 수행 (INSERT RLS 안에서 project_comments 를 SELECT 하면 무한 재귀)

ALTER TABLE public.project_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.project_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_project_comments_parent_id ON public.project_comments(parent_id);

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


