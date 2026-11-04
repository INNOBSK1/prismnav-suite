import { createLovableAuth } from '@lovable.dev/cloud-auth-js';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { googleAuthConfig } from './google-auth-config';

export async function signInWithGoogle() {
  const config = googleAuthConfig(window.location.origin);
  const options = {
    redirect_uri: config.redirectUri,
    extraParams: { prompt: 'select_account' },
  };

  if (!config.oauthBrokerUrl) {
    return lovable.auth.signInWithOAuth('google', options);
  }

  // Use the same managed provider and backend through its hosted proxy.
  // Do not point the SDK's relative broker endpoint at Netlify.
  const auth = createLovableAuth({ oauthBrokerUrl: config.oauthBrokerUrl });
  const result = await auth.signInWithOAuth('google', options);
  if (result.error || result.redirected) return result;

  const { error } = await supabase.auth.setSession(result.tokens);
  if (error) return { error };
  return result;
}