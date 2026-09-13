CREATE TABLE public.fda_recalls (
  recall_number TEXT PRIMARY KEY,
  product_description TEXT NOT NULL DEFAULT '',
  drug_name TEXT NOT NULL DEFAULT '',
  ndc_codes TEXT[] NOT NULL DEFAULT '{}',
  lot_numbers TEXT NOT NULL DEFAULT '',
  reason_for_recall TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT 'Class III',
  recalling_firm TEXT NOT NULL DEFAULT '',
  recall_initiation_date TEXT NOT NULL DEFAULT '',
  report_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  distribution_pattern TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fda_recalls_first_seen_idx ON public.fda_recalls (first_seen_at DESC);

GRANT SELECT ON public.fda_recalls TO authenticated;
GRANT ALL ON public.fda_recalls TO service_role;

ALTER TABLE public.fda_recalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY fda_recalls_read ON public.fda_recalls
  FOR SELECT TO authenticated USING (true);
