CREATE TABLE public.consents (
  user_id uuid PRIMARY KEY,
  terms_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own consent" ON public.consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.accept_signup_terms()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in before accepting terms'; END IF;
  INSERT INTO public.consents (user_id, terms_version) VALUES (auth.uid(), '2026-10-28') ON CONFLICT (user_id) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_signup_terms() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_signup_terms() TO authenticated;
CREATE OR REPLACE FUNCTION public.account_can_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN public.consents c ON c.user_id = p.id WHERE p.id = auth.uid() AND p.is_approved = true);
$$;
REVOKE ALL ON FUNCTION public.account_can_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.account_can_access() TO authenticated;
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT false;
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, full_name, avatar_url, bio), UPDATE (full_name, avatar_url, bio) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.downloads;
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.downloads;
CREATE POLICY "Approved users insert own downloads" ON public.downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.account_can_access());
CREATE POLICY "Approved users read own downloads" ON public.downloads FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.account_can_access());
GRANT SELECT, INSERT ON public.downloads TO authenticated;
GRANT ALL ON public.downloads TO service_role;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, trial_start_date, trial_end_date, is_approved)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'), now(), now() + interval '7 days', false);
  RETURN NEW;
END;
$$;