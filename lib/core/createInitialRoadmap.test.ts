import { describe, expect, it, vi } from 'vitest';

import {
  SavedIntakeGenerationError,
  saveIntakeAndGenerateRoadmap,
} from './createInitialRoadmap';

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('first roadmap creation', () => {
  it('saves one intake and generates its roadmap', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ intake_id: 'intake-1' }))
      .mockResolvedValueOnce(jsonResponse({ roadmap_id: 'roadmap-1' }, 201));
    const onIntakeSaved = vi.fn();

    await expect(
      saveIntakeAndGenerateRoadmap(
        { province: 'ON' },
        null,
        fetcher as unknown as typeof fetch,
        onIntakeSaved,
      ),
    ).resolves.toBe('roadmap-1');

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(onIntakeSaved).toHaveBeenCalledWith('intake-1');
    expect(fetcher.mock.calls[1][0]).toBe('/api/roadmap/generate');
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
      intake_id: 'intake-1',
    });
  });

  it('retries generation against the saved intake without creating another', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ intake_id: 'intake-1' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Temporary failure' }, 503))
      .mockResolvedValueOnce(jsonResponse({ roadmap_id: 'roadmap-1' }, 201));
    const onIntakeSaved = vi.fn();

    await expect(
      saveIntakeAndGenerateRoadmap(
        { province: 'ON' },
        null,
        fetcher as unknown as typeof fetch,
        onIntakeSaved,
      ),
    ).rejects.toMatchObject({
      intakeId: 'intake-1',
      message: 'Temporary failure',
    } satisfies Partial<SavedIntakeGenerationError>);

    await expect(
      saveIntakeAndGenerateRoadmap(
        { province: 'ON' },
        'intake-1',
        fetcher as unknown as typeof fetch,
        onIntakeSaved,
      ),
    ).resolves.toBe('roadmap-1');

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls.filter(([url]) => url === '/api/intake'))
      .toHaveLength(1);
    expect(onIntakeSaved).toHaveBeenCalledTimes(1);
  });

  it('keeps the saved intake id when the generation request cannot connect', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ intake_id: 'intake-1' }))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(
      saveIntakeAndGenerateRoadmap(
        { province: 'ON' },
        null,
        fetcher as unknown as typeof fetch,
      ),
    ).rejects.toMatchObject({
      intakeId: 'intake-1',
      message: 'Network unavailable',
    });
  });

  it('does not attempt generation when saving the intake fails', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      jsonResponse({ error: 'Missing required intake fields' }, 400),
    );

    await expect(
      saveIntakeAndGenerateRoadmap(
        { province: 'ON' },
        null,
        fetcher as unknown as typeof fetch,
      ),
    ).rejects.toThrow('Missing required intake fields');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
