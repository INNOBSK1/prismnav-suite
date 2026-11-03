export const NETLIFY_PRODUCTION_ORIGIN = 'https://fbmstwo.netlify.app';
export const HOSTED_GOOGLE_BROKER_URL = 'https://prismnav-suite.lovable.app/~oauth/initiate';

export function googleOAuthConfig(origin: string) {
  return {
    redirect_uri: `${origin}/`,
    oauthBrokerUrl: origin === NETLIFY_PRODUCTION_ORIGIN ? HOSTED_GOOGLE_BROKER_URL : undefined,
  };
}