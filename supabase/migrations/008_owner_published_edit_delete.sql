-- Owners may update/delete published projects (status cannot change via owner update on published rows)
-- Admins already have projects_update_admin / projects_delete_admin

CREATE POLICY "projects_update_owner_published"
  ON public.projects
  FOR UPDATE
  USING (owner_id = auth.uid() AND status = 'published')
  WITH CHECK (owner_id = auth.uid() AND status = 'published');

DROP POLICY IF EXISTS "projects_delete_owner_draft" ON public.projects;

CREATE POLICY "projects_delete_owner"
  ON public.projects
  FOR DELETE
  USING (owner_id = auth.uid());
