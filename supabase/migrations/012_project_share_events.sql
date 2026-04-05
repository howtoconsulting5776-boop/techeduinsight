-- 공유 이벤트 로그 + 프로젝트별 share_count 집계
-- 직접 INSERT 금지: SECURITY DEFINER `record_project_share` 만 사용

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS share_count bigint NOT NULL DEFAULT 0;

CREATE TABLE public.project_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('native_share', 'clipboard', 'navigate_detail')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_share_events_project_id ON public.project_share_events(project_id);
CREATE INDEX idx_project_share_events_created_at ON public.project_share_events(created_at DESC);

ALTER TABLE public.project_share_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bump_project_share_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET share_count = share_count + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_project_share_events_bump ON public.project_share_events;
CREATE TRIGGER tr_project_share_events_bump
  AFTER INSERT ON public.project_share_events
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_project_share_count();

CREATE OR REPLACE FUNCTION public.record_project_share(
  p_project_id uuid,
  p_channel text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_channel NOT IN ('native_share', 'clipboard', 'navigate_detail') THEN
    RAISE EXCEPTION 'invalid share channel';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND status = 'published'
  ) THEN
    RETURN;
  END IF;
  INSERT INTO public.project_share_events (project_id, user_id, channel)
  VALUES (p_project_id, auth.uid(), p_channel);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_project_share(uuid, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.project_social_counts(uuid[]);

CREATE OR REPLACE FUNCTION public.project_social_counts(p_ids uuid[])
RETURNS TABLE (
  project_id uuid,
  likes_count bigint,
  comments_count bigint,
  share_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_id,
    (SELECT count(*)::bigint FROM public.project_likes l WHERE l.project_id = p.id),
    (SELECT count(*)::bigint FROM public.project_comments c WHERE c.project_id = p.id),
    COALESCE(p.share_count, 0)::bigint
  FROM public.projects p
  WHERE p.id = ANY(p_ids)
    AND p.status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.project_social_counts(uuid[]) TO anon, authenticated;
