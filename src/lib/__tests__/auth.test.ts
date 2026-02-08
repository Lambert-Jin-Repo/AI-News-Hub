import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCronAuth } from '../auth';

describe('verifyCronAuth', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when CRON_SECRET is not set', () => {
    vi.stubEnv('CRON_SECRET', '');
    const request = new Request('http://localhost', {
      headers: { 'x-cron-secret': 'anything' },
    });
    expect(verifyCronAuth(request)).toBe(false);
  });

  it('returns false when header is missing', () => {
    vi.stubEnv('CRON_SECRET', 'my-secret');
    const request = new Request('http://localhost');
    expect(verifyCronAuth(request)).toBe(false);
  });

  it('returns false when header does not match', () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');
    const request = new Request('http://localhost', {
      headers: { 'x-cron-secret': 'wrong-secret' },
    });
    expect(verifyCronAuth(request)).toBe(false);
  });

  it('returns true when header matches CRON_SECRET', () => {
    vi.stubEnv('CRON_SECRET', 'my-secret-123');
    const request = new Request('http://localhost', {
      headers: { 'x-cron-secret': 'my-secret-123' },
    });
    expect(verifyCronAuth(request)).toBe(true);
  });

  it('returns false for length mismatch (timing attack defence)', () => {
    vi.stubEnv('CRON_SECRET', 'short');
    const request = new Request('http://localhost', {
      headers: { 'x-cron-secret': 'much-longer-secret-value' },
    });
    expect(verifyCronAuth(request)).toBe(false);
  });
});
