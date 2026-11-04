import { describe, expect, it } from 'bun:test';
import { googleAuthConfig } from './google-auth-config';

describe('Google sign-in hosting configuration', () => {
  it('returns production users to the exact Netlify root', () => {
    expect(googleAuthConfig('https://fbmstwo.netlify.app').redirectUri)
      .toBe('https://fbmstwo.netlify.app/');
  });

  it('starts Netlify sign-in on the existing hosted broker, not Netlify', () => {
    const config = googleAuthConfig('https://fbmstwo.netlify.app');
    expect(config.oauthBrokerUrl)
      .toBe('https://prismnav-suite.lovable.app/~oauth/initiate');
    expect(new URL(config.oauthBrokerUrl).origin)
      .not.toBe('https://fbmstwo.netlify.app');
  });

  it('preserves the managed helper on Lovable preview and hosting', () => {
    expect(googleAuthConfig('https://prismnav-suite.lovable.app')).toEqual({
      redirectUri: 'https://prismnav-suite.lovable.app/',
      oauthBrokerUrl: undefined,
    });
  });
});