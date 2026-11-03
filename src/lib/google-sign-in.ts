import { createLovableAuth } from '@lovable.dev/cloud-auth-js';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { googleOAuthConfig } from './google-oauth-config';

// Netlify does not serve Lovable's managed OAuth endpoints. Use the same
// project's Lovable-hosted broker, retaining the existing Auth client.
export async function signInWithGoogle() {
  const { redirect_uri, oauthBrokerUrl } = googleOAuthConfig(window.location.origin);
  const options = { redirect_uri, extraParams: { prompt: 'select_account' } };
  if (!oauthBrokerUrl) return lovable.auth.signInWithOAuth('google', options);

  const result = await createLovableAuth({ oauthBrokerUrl }).signInWithOAuth('google', options);
  if (result.error || result.redirected) return result;

  // The helper returns tokens in embedded contexts; full-page returns are
  // restored by the existing Auth client's URL-session handling instead.
  const { error } = await supabase.auth.setSession(result.tokens);
  return error ? { error } : result;
}