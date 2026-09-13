CREATE TABLE public.ai_briefings (
  cache_key text PRIMARY KEY,
  kind text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_briefings TO service_role;

ALTER TABLE public.ai_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_briefings_service_all ON public.ai_briefings FOR ALL TO service_role USING (true) WITH CHECK (true);