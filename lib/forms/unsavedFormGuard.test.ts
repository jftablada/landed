import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { protectUnsavedForm } from './unsavedFormGuard';

type Link = {
  href: string;
  target: string;
  hasAttribute: (name: string) => boolean;
};
class TestElement {
  constructor(
    private link: Link | null,
    private exitButton = false,
  ) {}
  closest(selector: string) {
    if (selector === 'button[data-leaves-page]')
      return this.exitButton ? this : null;
    return this.link;
  }
}

describe('unsaved form navigation guard', () => {
  let page: EventTarget;
  let doc: EventTarget;
  let blocked = vi.fn<() => void>();
  let cleanup: () => void;
  beforeEach(() => {
    page = Object.assign(new EventTarget(), {
      location: { href: 'https://landed.example/companies' },
    });
    doc = new EventTarget();
    vi.stubGlobal('window', page);
    vi.stubGlobal('document', doc);
    vi.stubGlobal('Element', TestElement);
    blocked = vi.fn<() => void>();
    cleanup = protectUnsavedForm(blocked);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function click(
    href: string,
    options: {
      target?: string;
      download?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
      button?: number;
    } = {},
  ) {
    const link = {
      href,
      target: options.target ?? '',
      hasAttribute: (name: string) => name === 'download' && !!options.download,
    };
    const event = new Event('click', { cancelable: true });
    Object.assign(event, {
      button: options.button ?? 0,
      ctrlKey: options.ctrlKey ?? false,
      metaKey: options.metaKey ?? false,
      shiftKey: options.shiftKey ?? false,
      altKey: options.altKey ?? false,
    });
    Object.defineProperty(event, 'target', { value: new TestElement(link) });
    doc.dispatchEvent(event);
    return event;
  }
  it('keeps the form in place when a same-tab link would leave it', () => {
    expect(click('/start').defaultPrevented).toBe(true);
    expect(blocked).toHaveBeenCalledOnce();
  });
  it('also protects same-tab external links', () => {
    expect(click('https://example.org/').defaultPrevented).toBe(true);
  });
  it('blocks an exit button before its sign-out handler can run', () => {
    const event = new Event('click', { cancelable: true });
    Object.assign(event, { button: 0 });
    Object.defineProperty(event, 'target', {
      value: new TestElement(null, true),
    });
    doc.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(blocked).toHaveBeenCalledOnce();
  });
  it('protects a reload or tab close with the browser’s normal warning', () => {
    const event = new Event('beforeunload', { cancelable: true });
    page.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
  it.each([
    ['/companies#saved-companies', {}],
    ['mailto:hello@getlanded.ca', {}],
    ['/start', { target: '_blank' }],
    ['/start', { download: true }],
    ['/start', { ctrlKey: true }],
    ['/start', { metaKey: true }],
    ['/start', { shiftKey: true }],
    ['/start', { altKey: true }],
    ['/start', { button: 1 }],
  ] as const)(
    'leaves safe or non-navigation click untouched: %s %j',
    (href, options) => {
      expect(click(href, options).defaultPrevented).toBe(false);
      expect(blocked).not.toHaveBeenCalled();
    },
  );
  it('stops guarding once the saved or cancelled form cleans up', () => {
    cleanup();
    expect(click('/start').defaultPrevented).toBe(false);
    const event = new Event('beforeunload', { cancelable: true });
    page.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
