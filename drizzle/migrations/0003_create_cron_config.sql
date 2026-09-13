CREATE TABLE public.cron_config (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  cron_secret TEXT NOT NULL,
  CONSTRAINT cron_config_single_row CHECK (id)
);

ALTER TABLE public.cron_config ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.cron_config TO service_role;
