-- Default new projects to allow iframe embed on the detail page.
ALTER TABLE public.projects
  ALTER COLUMN iframe_allowed SET DEFAULT true;

-- Existing rows: use inline iframe preview (turn off per-row in DB if a site blocks frames)
UPDATE public.projects
SET iframe_allowed = true;
