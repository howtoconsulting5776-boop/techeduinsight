-- 관리자는 모든 댓글 삭제 가능 (작성자 본인 삭제는 기존 comments_delete_own 과 OR)

CREATE POLICY "comments_delete_admin"
  ON public.project_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'ADMIN'
    )
  );
