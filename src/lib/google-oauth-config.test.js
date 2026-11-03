import { describe, expect, it } from 'bun:test';
import { googleOAuthConfig } from './google-oauth-config';

describe('Netlify Google OAuth', () => {
  it('starts on the hosted broker rather than the Netlify OAuth path', () => {
    expect(googleOAuthConfig('https://fbmstwo.netlify.app').oauthBrokerUrl)
      .toBe('https://prismnav-suite.lovable.app/~oauth/initiate');
  });
  it('returns to the exact production root, without changing the domain', () => {
    expect(googleOAuthConfig('https://fbmstwo.netlify.app').redirect_uri)
      .toBe('https://fbmstwo.netlify.app/');
  });
  it('preserves the managed helper defaults on Lovable hosting', () => {
    expect(googleOAuthConfig('https://prismnav-suite.lovable.app')).toEqual({
      redirect_uri: 'https://prismnav-suite.lovable.app/', oauthBrokerUrl: undefined,
    });
  });
});