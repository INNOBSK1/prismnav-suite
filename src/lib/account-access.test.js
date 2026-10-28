import { describe, expect, it } from 'bun:test';
import { accountCanAccess } from './account-access';

describe('account access', () => {
  it('requires manual approval for every new account', () => {
    expect(accountCanAccess(false, true)).toBe(false);
    expect(accountCanAccess(null, true)).toBe(false);
    expect(accountCanAccess(true, true)).toBe(true);
  });
  it('requires policy acceptance even with approval', () => {
    expect(accountCanAccess(true, false)).toBe(false);
    expect(accountCanAccess(true, true)).toBe(true);
  });
});