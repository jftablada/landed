import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TestEnvironmentBanner from './TestEnvironmentBanner';

afterEach(() => { vi.unstubAllEnvs(); });

describe('test site identification', () => {
  it('labels the isolated preview', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(renderToStaticMarkup(<TestEnvironmentBanner />)).toContain('Test site');
  });

  it('keeps the banner out of production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(renderToStaticMarkup(<TestEnvironmentBanner />)).toBe('');
  });
});
