-- Likes & comments on published projects (showcase / detail)

CREATE TABLE public.project_likes (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_likes_project_id ON public.project_likes(project_id);

ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_published"
  ON public.project_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_likes.project_id AND p.status = 'published'
    )
  );

CREATE POLICY "likes_insert_authenticated"
  ON public.project_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.status = 'published'
    )
  );

CREATE POLICY "likes_delete_own"
  ON public.project_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Denormalized author name (profiles RLS blocks public join)
CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_display_name text NOT NULL,
  body text NOT NULL CHECK (
    char_length(trim(body)) > 0 AND char_length(trim(body)) <= 2000
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);

ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_published"
  ON public.project_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_comments.project_id AND p.status = 'published'
    )
  );

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
  );

CREATE POLICY "comments_delete_own"
  ON public.project_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.project_social_counts(p_ids uuid[])
RETURNS TABLE (project_id uuid, likes_count bigint, comments_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_id,
    (SELECT count(*)::bigint FROM public.project_likes l WHERE l.project_id = p.id),
    (SELECT count(*)::bigint FROM public.project_comments c WHERE c.project_id = p.id)
  FROM public.projects p
  WHERE p.id = ANY(p_ids)
    AND p.status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.project_social_counts(uuid[]) TO anon, authenticated;
