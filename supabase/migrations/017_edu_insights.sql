-- 교육 인사이트(외부 기사 큐레이션) MVP

CREATE TABLE public.edu_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  source_name text NOT NULL,
  source_url text NOT NULL,
  image_url text,
  category text,
  tags text[],
  published_at timestamptz NOT NULL,
  sort_priority integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_edu_insights_published_list
  ON public.edu_insights (is_published, published_at DESC, sort_priority DESC);

ALTER TABLE public.edu_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edu_insights_select_published"
  ON public.edu_insights
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "edu_insights_insert_admin"
  ON public.edu_insights
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "edu_insights_update_admin"
  ON public.edu_insights
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "edu_insights_delete_admin"
  ON public.edu_insights
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE OR REPLACE FUNCTION public.set_edu_insights_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_edu_insights_updated_at ON public.edu_insights;
CREATE TRIGGER tr_edu_insights_updated_at
  BEFORE UPDATE ON public.edu_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.set_edu_insights_updated_at();
