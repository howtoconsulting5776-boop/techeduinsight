-- ============================================================
-- 005_prd_alignment.sql
-- PRD Phase 1–2: videos policy, projects owner/admin split, view_count RPC
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.1 videos: PREMIUM rows — PREMIUM + ADMIN only (not TEACHER)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "videos_select_by_role" ON public.videos;

CREATE POLICY "videos_select_by_role"
  ON public.videos
  FOR SELECT
  USING (
    CASE required_role
      WHEN 'MEMBER' THEN auth.uid() IS NOT NULL
      WHEN 'PREMIUM' THEN (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('PREMIUM', 'ADMIN')
        )
      )
      ELSE false
    END
  );

-- ────────────────────────────────────────────────────────────
-- 1.2 projects: owners may only insert/update/delete drafts;
--               ADMIN may update/delete any row
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_update_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_owner" ON public.projects;

-- New projects are always draft until an admin publishes
CREATE POLICY "projects_insert_authenticated"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND owner_id = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY "projects_update_owner_draft"
  ON public.projects
  FOR UPDATE
  USING (owner_id = auth.uid() AND status = 'draft')
  WITH CHECK (owner_id = auth.uid() AND status = 'draft');

CREATE POLICY "projects_update_admin"
  ON public.projects
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

CREATE POLICY "projects_delete_owner_draft"
  ON public.projects
  FOR DELETE
  USING (owner_id = auth.uid() AND status = 'draft');

CREATE POLICY "projects_delete_admin"
  ON public.projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ────────────────────────────────────────────────────────────
-- 1.3 view_count: safe increment for published rows (RLS-safe)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_project_view(project_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.projects
  SET view_count = view_count + 1
  WHERE id = project_id
    AND status = 'published';
$$;

REVOKE ALL ON FUNCTION public.increment_project_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_project_view(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_project_view(uuid) TO authenticated;
