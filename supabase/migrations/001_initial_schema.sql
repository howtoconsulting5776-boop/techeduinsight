-- ============================================================
-- 001_initial_schema.sql
-- TechEdu Insight - Initial Schema, Triggers, and RLS Policies
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.user_role AS ENUM ('GUEST', 'MEMBER', 'PREMIUM', 'TEACHER', 'ADMIN');
CREATE TYPE public.project_status AS ENUM ('draft', 'published');
CREATE TYPE public.video_role AS ENUM ('MEMBER', 'PREMIUM');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role        public.user_role NOT NULL DEFAULT 'MEMBER',
  display_name text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- projects
CREATE TABLE public.projects (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  deploy_url     text,
  iframe_allowed boolean NOT NULL DEFAULT false,
  thumbnail_path text,
  tags           text[],
  status         public.project_status NOT NULL DEFAULT 'draft',
  view_count     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- videos
CREATE TABLE public.videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id    text NOT NULL,
  title         text NOT NULL,
  required_role public.video_role NOT NULL DEFAULT 'MEMBER',
  category      text,
  sort_order    integer NOT NULL DEFAULT 0,
  duration_sec  integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- watch_history
CREATE TABLE public.watch_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  video_id     uuid NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  progress_pct integer NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

-- ============================================================
-- TRIGGER: auto-create profile on new auth user
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'MEMBER',
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- profiles policies
-- ────────────────────────────────────────────────────────────

-- SELECT: own row only
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: own row, but role column must not change
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT: blocked for normal users — only the trigger (service role) may insert
CREATE POLICY "profiles_insert_service_only"
  ON public.profiles
  FOR INSERT
  WITH CHECK (false);

-- ────────────────────────────────────────────────────────────
-- projects policies
-- ────────────────────────────────────────────────────────────

-- SELECT: published rows visible to everyone; owner sees own drafts too
CREATE POLICY "projects_select_published_or_owner"
  ON public.projects
  FOR SELECT
  USING (
    status = 'published'
    OR owner_id = auth.uid()
  );

-- INSERT: authenticated users only
CREATE POLICY "projects_insert_authenticated"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- UPDATE: owner only
CREATE POLICY "projects_update_owner"
  ON public.projects
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: owner only
CREATE POLICY "projects_delete_owner"
  ON public.projects
  FOR DELETE
  USING (owner_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- videos policies
-- ────────────────────────────────────────────────────────────

-- SELECT: MEMBER-level videos → any authenticated user
--         PREMIUM-level videos → PREMIUM / TEACHER / ADMIN only
CREATE POLICY "videos_select_by_role"
  ON public.videos
  FOR SELECT
  USING (
    CASE required_role
      WHEN 'MEMBER'  THEN auth.uid() IS NOT NULL
      WHEN 'PREMIUM' THEN (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('PREMIUM', 'TEACHER', 'ADMIN')
        )
      )
      ELSE false
    END
  );

-- INSERT / UPDATE / DELETE: ADMIN only
CREATE POLICY "videos_write_admin"
  ON public.videos
  FOR ALL
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

-- ────────────────────────────────────────────────────────────
-- watch_history policies
-- ────────────────────────────────────────────────────────────

-- SELECT / INSERT / UPDATE: own rows only
CREATE POLICY "watch_history_own"
  ON public.watch_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
