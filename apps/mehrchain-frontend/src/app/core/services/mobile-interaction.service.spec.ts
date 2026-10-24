import { TestBed } from '@angular/core/testing';
import { MobileInteractionService } from './mobile-interaction.service';

describe('mobile interaction policy', () => {
  let originalViewport: string | null;
  let viewport: HTMLMetaElement;
  let matches = true;
  let change: (() => void) | undefined;
  const remove = vi.fn();
  beforeEach(() => {
    localStorage.clear();
    originalViewport =
      document.querySelector('meta[name="viewport"]')?.getAttribute('content') || null;
    viewport = document.querySelector('meta[name="viewport"]') || document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content =
      'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content';
    if (!viewport.isConnected) document.head.appendChild(viewport);
    matches = true;
    remove.mockClear();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(
        () =>
          ({
            get matches() {
              return matches;
            },
            addEventListener: (_: string, listener: () => void) => {
              change = listener;
            },
            removeEventListener: remove,
          }) as unknown as MediaQueryList,
      ),
    );
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.style.fontSize = '';
    if (originalViewport === null) viewport.remove();
    else viewport.content = originalViewport;
  });
  it('restricts mobile scale while preserving safe areas and removes restrictions for desktop', () => {
    TestBed.inject(MobileInteractionService);
    expect(viewport.content).toContain('maximum-scale=1');
    expect(viewport.content).toContain('interactive-widget=resizes-content');
    expect(viewport.content).toContain('viewport-fit=cover');
    matches = false;
    change?.();
    expect(viewport.content).not.toContain('user-scalable=no');
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledOnce();
  });
  it('retires the old text-size preference without applying it to the page', () => {
    localStorage.setItem('mehrchain_text_size', '200');
    document.documentElement.style.fontSize = '200%';
    TestBed.inject(MobileInteractionService);
    expect(document.documentElement.style.fontSize).toBe('');
    expect(localStorage.getItem('mehrchain_text_size')).toBeNull();
    expect(viewport.content).toContain('maximum-scale=1');
  });
  it('limits Safari gesture cancellation to mobile app surfaces and cleans up', () => {
    TestBed.inject(MobileInteractionService);
    const root = document.createElement('app-root');
    document.body.appendChild(root);
    const pinch = new Event('gesturestart', { bubbles: true, cancelable: true });
    root.dispatchEvent(pinch);
    expect(pinch.defaultPrevented).toBe(true);
    const touch = new Event('touchmove', { bubbles: true, cancelable: true });
    root.dispatchEvent(touch);
    expect(touch.defaultPrevented).toBe(false);
    TestBed.resetTestingModule();
    const after = new Event('gesturestart', { bubbles: true, cancelable: true });
    root.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
    root.remove();
  });
});
