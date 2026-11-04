export const NETLIFY_PRODUCTION_ORIGIN = 'https://fbmstwo.netlify.app';
const HOSTED_GOOGLE_BROKER = 'https://prismnav-suite.lovable.app/~oauth/initiate';

// Netlify serves the app, but does not provide Lovable's managed OAuth proxy.
export function googleAuthConfig(origin: string) {
  return {
    redirectUri: `${origin}/`,
    oauthBrokerUrl: origin === NETLIFY_PRODUCTION_ORIGIN
      ? HOSTED_GOOGLE_BROKER
      : undefined,
  };
}