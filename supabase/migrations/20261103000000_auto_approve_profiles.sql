-- Every authenticated user is approved by default. Keep consent as a separate requirement:
-- account_can_access() still requires a persisted consent row, and profile column grants
-- continue to prevent clients from changing approval or subscription fields.
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT true;
UPDATE public.profiles SET is_approved = true WHERE is_approved IS DISTINCT FROM true;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, trial_start_date, trial_end_date, is_approved)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    now(),
    now() + interval '7 days',
    true
  );
  RETURN NEW;
END;
$$;
