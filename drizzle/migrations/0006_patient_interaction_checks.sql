CREATE TABLE public.patient_interaction_checks (user_id uuid NOT NULL DEFAULT auth.uid(), patient_id text NOT NULL, fingerprint text NOT NULL, result jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, patient_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_interaction_checks TO authenticated;
GRANT ALL ON public.patient_interaction_checks TO service_role;
ALTER TABLE public.patient_interaction_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own interaction checks" ON public.patient_interaction_checks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);