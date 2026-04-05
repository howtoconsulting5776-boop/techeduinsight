-- Prefer new-tab preview by default (lower rate of blank iframe / X-Frame-Options failures).
-- Apply after 003 if you already ran it; safe to run on fresh DBs too.
ALTER TABLE public.projects
  ALTER COLUMN iframe_allowed SET DEFAULT false;
