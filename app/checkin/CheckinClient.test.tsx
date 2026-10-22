import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effects: [] as (() => void | (() => void))[],
  push: vi.fn(),
  cleanup: vi.fn(),
  guard: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: harness.push }),
  useSearchParams: () => new URLSearchParams('journey=qa-journey'),
}));
vi.mock('@/lib/forms/unsavedFormGuard', () => ({
  protectUnsavedForm: harness.guard,
}));
// Exercise the client event handlers without adding a DOM test dependency.
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    useState: <T,>(initial: T | (() => T)) => {
      const index = harness.cursor++;
      if (!(index in harness.slots))
        harness.slots[index] =
          typeof initial === 'function' ? (initial as () => T)() : initial;
      return [
        harness.slots[index] as T,
        (value: T | ((previous: T) => T)) => {
          harness.slots[index] =
            typeof value === 'function'
              ? (value as (previous: T) => T)(harness.slots[index] as T)
              : value;
        },
      ];
    },
    useRef: <T,>(initial: T) => {
      const index = harness.cursor++;
      if (!(index in harness.slots))
        harness.slots[index] = { current: initial };
      return harness.slots[index];
    },
    useEffect: (effect: () => void | (() => void)) => {
      harness.effects.push(effect);
    },
  };
});

vi.mock('@/app/components/AuthenticatedNav', () => ({ default: () => null }));
vi.mock(
  '@/lib/core/canadianProvinces',
  async () => import('../../lib/core/canadianProvinces'),
);
vi.mock(
  '@/lib/checkin/checkinForm',
  async () => import('../../lib/checkin/checkinForm'),
);
import CheckinClient from './CheckinClient';
import CheckinReview from './CheckinReview';

type Node = ReactElement<Record<string, unknown>>;
function all(node: unknown): Node[] {
  if (Array.isArray(node)) return node.flatMap(all);
  if (!node || typeof node !== 'object' || !('props' in node)) return [];
  const item = node as Node;
  return [item, ...all(item.props.children)];
}
function render() {
  harness.cursor = 0;
  harness.effects = [];
  return CheckinClient();
}
function find(tree: unknown, predicate: (node: Node) => boolean) {
  const node = all(tree).find(predicate);
  if (!node) throw new Error('Expected element missing');
  return node;
}
function submit() {
  const form = find(render(), (node) => node.type === 'form');
  (form.props.onSubmit as (event: { preventDefault: () => void }) => void)({
    preventDefault() {},
  });
}
function change(id: string, value: string) {
  const tree = render();
  const input = find(tree, (node) => node.props.id === id);
  (input.props.onChange as (event: { target: { value: string } }) => void)({
    target: { value },
  });
  (find(tree, (node) => node.type === 'form').props.onChange as () => void)();
}
const snapshot = {
  province: 'ON',
  confirmed_cash: 8000,
  essential_burn: 3000,
  debt_minimums: 500,
  ei_status: 'not_applied',
  ei_monthly_amount: null,
  activity_since: '2026-10-20T12:00:00Z',
};
async function loaded() {
  render();
  harness.effects.at(-1)!();
  await vi.waitFor(() =>
    expect(all(render()).some((node) => node.type === 'form')).toBe(true),
  );
}
function completeSearch() {
  for (const [id, value] of [
    ['applications-submitted', '18'],
    ['employer-responses', '1'],
    ['interviews-secured', '0'],
    ['offers-received', '0'],
    ['biggest-barrier', "Applied but wasn't hearing back"],
  ])
    change(id, value);
}

describe('guided check-in interaction', () => {
  beforeEach(() => {
    harness.slots = [];
    harness.cursor = 0;
    harness.effects = [];
    vi.clearAllMocks();
    harness.guard.mockReturnValue(harness.cleanup);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => snapshot }),
    );
  });
  it('does not submit incomplete activity or submit just by moving between steps', async () => {
    await loaded();
    submit();
    expect(
      find(render(), (node) => node.props.role === 'alert').props.children,
    ).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(find(render(), node => node.type === 'form').props.noValidate).toBe(true);
    completeSearch();
    submit();
    submit();
    expect(all(render()).some((node) => node.type === CheckinReview)).toBe(
      true,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('retains answers when going back and posts the existing payload only on review', async () => {
    await loaded();
    completeSearch();
    submit();
    submit();
    const review = find(render(), (node) => node.type === CheckinReview);
    (review.props.onEdit as (step: number) => void)(0);
    expect(
      find(render(), (node) => node.props.id === 'applications-submitted').props
        .value,
    ).toBe('18');
    submit();
    submit();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roadmap_id: 'new-roadmap' }),
    } as Response);
    submit();
    submit();
    await vi.waitFor(() =>
      expect(harness.push).toHaveBeenCalledWith('/roadmap/new-roadmap'),
    );
    const call = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => url === '/api/checkin')!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({
      journey_id: 'qa-journey',
      changes: {},
      applications_submitted: 18,
      employer_responses: 1,
      interviews_secured: 0,
      offers_received: 0,
      biggest_barrier: "Applied but wasn't hearing back",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('preserves answers and permits retry after an update fails', async () => {
    await loaded();
    completeSearch();
    submit();
    submit();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Please try again.' }),
    } as Response);
    submit();
    await vi.waitFor(() =>
      expect(
        find(render(), (node) => node.props.role === 'alert'),
      ).toBeDefined(),
    );
    expect(
      find(render(), (node) => node.type === 'form').props['aria-busy'],
    ).toBe(false);
    expect(
      find(render(), (node) => node.type === CheckinReview).props.activity,
    ).toMatchObject({ applicationsSubmitted: '18' });
  });
  it('blocks leaving dirty answers and allows an explicit discard', async () => {
    await loaded();
    submit();
    completeSearch();
    render();
    harness.effects[0]();
    expect(harness.guard).toHaveBeenCalledOnce();
    harness.guard.mock.calls[0][0]();
    const alert = find(render(), (node) => node.props.id === 'checkin-message');
    expect(find(alert, node => node.type === 'p').props.children).toBe('Your answers haven’t been submitted. Finish your check-in or discard your answers before leaving.');
    const discard = find(alert, (node) => node.type === 'button');
    (discard.props.onClick as () => void)();
    expect(harness.cleanup).toHaveBeenCalled();
    expect(harness.push).toHaveBeenCalledWith('/start');
  });
});
