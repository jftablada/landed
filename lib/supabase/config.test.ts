import { afterEach, describe, expect, it } from 'vitest';
import { getSupabaseAnonKey, getSupabaseUrl } from './config';

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalTestUrl = process.env.NEXT_PUBLIC_SUPABASE_TEST_URL;
const originalTestKey = process.env.NEXT_PUBLIC_SUPABASE_TEST_KEY;

afterEach(() => {
  for (const [name, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: originalUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: originalKey,
    NEXT_PUBLIC_SUPABASE_TEST_URL: originalTestUrl,
    NEXT_PUBLIC_SUPABASE_TEST_KEY: originalTestKey,
  })) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('Supabase environment selection', () => {
  it('uses the existing configuration when no test override is present', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://production.example';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'production-key';
    delete process.env.NEXT_PUBLIC_SUPABASE_TEST_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_TEST_KEY;

    expect(getSupabaseUrl()).toBe('https://production.example');
    expect(getSupabaseAnonKey()).toBe('production-key');
  });

  it('uses the isolated test project when test values are present', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://production.example';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'production-key';
    process.env.NEXT_PUBLIC_SUPABASE_TEST_URL = 'https://test.example';
    process.env.NEXT_PUBLIC_SUPABASE_TEST_KEY = 'test-key';

    expect(getSupabaseUrl()).toBe('https://test.example');
    expect(getSupabaseAnonKey()).toBe('test-key');
  });
});
