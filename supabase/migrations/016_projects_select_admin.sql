-- ADMIN 은 심사·관리용으로 모든 projects 행 SELECT (다른 사용자 초안 포함)
-- /dashboard/admin/projects 등이 createClient() 로 조회할 때 RLS 통과

CREATE POLICY "projects_select_admin"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'ADMIN'
    )
  );
