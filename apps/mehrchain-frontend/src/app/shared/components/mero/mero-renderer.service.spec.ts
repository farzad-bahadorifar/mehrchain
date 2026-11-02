import { TestBed } from '@angular/core/testing';
import { MERO_SCENE_LOADER, MeroRendererService, MeroRenderOptions } from './mero-renderer.service';
import type { createMeroScene } from './mero-scene';

describe('Mero shared rendering lifecycle', () => {
  let service: MeroRendererService;
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let factory: ReturnType<typeof vi.fn<typeof createMeroScene>>;
  let loader: ReturnType<typeof vi.fn<() => Promise<{ createMeroScene: typeof createMeroScene }>>>;
  let scene: {
    mascot: ReturnType<typeof createMeroScene>['mascot'];
    localPoint: ReturnType<typeof createMeroScene>['localPoint'];
    camera: ReturnType<typeof createMeroScene>['camera'];
    draw: ReturnType<typeof vi.fn<ReturnType<typeof createMeroScene>['draw']>>;
    dispose: ReturnType<typeof vi.fn<() => void>>;
  };
  let visibility: ReturnType<typeof vi.spyOn>;
  let motion: EventTarget & { matches: boolean };
  const options: MeroRenderOptions = { mood: 'reference', glow: 1, size: 128 };

  beforeEach(() => {
    frames = new Map();
    nextFrame = 0;
    const mockMascot = {
      model: {
        position: { x: 0, y: 0, z: 0 },
      },
      setLightState: vi.fn(),
      setGlowColor: vi.fn(),
      setGlow: vi.fn(),
      setMood: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    } as unknown as ReturnType<typeof createMeroScene>['mascot'];

    const mockCamera = {
      right: 1.4,
      top: 1.4,
    } as unknown as ReturnType<typeof createMeroScene>['camera'];

    scene = {
      mascot: mockMascot,
      camera: mockCamera,
      localPoint: (x, y) =>
        ({ x: x * 1.4, y: y * 1.4, z: 0.7 }) as ReturnType<
          ReturnType<typeof createMeroScene>['localPoint']
        >,
      draw: vi.fn((target, size) => {
        target.canvas.width = size;
        target.canvas.height = size;
      }),
      dispose: vi.fn(),
    };
    factory = vi.fn<typeof createMeroScene>().mockReturnValue(scene);
    loader = vi.fn().mockResolvedValue({ createMeroScene: factory });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MERO_SCENE_LOADER,
          useValue: loader,
        },
      ],
    });
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8);
    visibility = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    motion = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal('matchMedia', () => motion);
    vi.stubGlobal('WebGL2RenderingContext', class {});
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      return { canvas: this, drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    });
    service = TestBed.inject(MeroRendererService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function attach(next = options) {
    const canvas = document.createElement('canvas');
    const parent = document.createElement('div');
    parent.appendChild(canvas);
    const halo = document.createElement('div');
    halo.className = 'mero-belly-glow';
    parent.appendChild(halo);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
    } as DOMRect);
    const ready = vi.fn();
    return { handle: service.attach(canvas, next, ready), ready, canvas };
  }

  async function visible(handle: ReturnType<typeof service.attach>) {
    handle.setVisible(true);
    await vi.waitFor(() => expect(frames.size).toBe(1));
  }

  function frame(time = 100) {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  }

  it('does not initialize until visible; shares one renderer and renders static avatars on demand', async () => {
    const first = attach();
    const second = attach();
    expect(factory).not.toHaveBeenCalled();
    await visible(first.handle);
    second.handle.setVisible(true);
    frame();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(scene.draw).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
    first.handle.update({ ...options, mood: 'sad' });
    frame(200);
    expect(scene.draw).toHaveBeenCalledTimes(3);
    first.handle.destroy();
    expect(scene.dispose).not.toHaveBeenCalled();
    vi.useFakeTimers();
    second.handle.destroy();
    expect(scene.dispose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it('stops hidden views and tabs and redraws on return', async () => {
    const { handle } = attach({ ...options, mood: 'happy' });
    await visible(handle);
    frame();
    expect(frames.size).toBe(1);
    handle.setVisible(false);
    expect(frames.size).toBe(0);
    await visible(handle);
    visibility.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    visibility.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    frame(200);
    expect(scene.draw).toHaveBeenCalledTimes(2);
  });

  it('does not animate small happy avatars or reduced-motion views', async () => {
    const { handle } = attach({ ...options, mood: 'happy', size: 40 });
    await visible(handle);
    frame();
    expect(scene.draw.mock.calls[0][5]).toBe(false);
    expect(frames.size).toBe(0);
    motion.matches = true;
    motion.dispatchEvent(new Event('change'));
    handle.update({ ...options, mood: 'happy' });
    frame(200);
    expect(scene.draw.mock.calls[1][5]).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('caps animation rate and disables it after sustained expensive rendering', async () => {
    const { handle } = attach({ ...options, mood: 'happy' });
    await visible(handle);
    frame(100);
    frame(110);
    expect(scene.draw).toHaveBeenCalledTimes(1);
    let elapsed = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => (elapsed += 30));
    for (let i = 0; i < 5; i++) frame(200 + i * 50);
    frame(500);
    expect(scene.draw.mock.lastCall?.[5]).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('keeps the last real frame on context loss and releases GPU resources', async () => {
    const { handle, ready } = attach();
    await visible(handle);
    frame();
    expect(ready).toHaveBeenLastCalledWith('ready');
    factory.mock.calls[0][1]();
    expect(ready).toHaveBeenCalledTimes(1);
    expect(ready).toHaveBeenLastCalledWith('ready');
    expect(scene.dispose).toHaveBeenCalledOnce();
    handle.update(options);
    expect(frames.size).toBe(0);
  });

  it('reports unavailability without starting Three.js when WebGL2 is unavailable', () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    const { handle, ready } = attach();
    handle.setVisible(true);
    expect(frames.size).toBe(0);
    expect(factory).not.toHaveBeenCalled();
    expect(ready).toHaveBeenLastCalledWith('unavailable');
  });

  it('waits for module loading and the first copied frame before revealing Mero', async () => {
    let loaded!: (module: { createMeroScene: typeof createMeroScene }) => void;
    loader.mockReturnValue(new Promise((resolve) => (loaded = resolve)));
    const { handle, ready } = attach();
    handle.setVisible(true);
    expect(loader).toHaveBeenCalledOnce();
    handle.update({ ...options, size: 224 });
    expect(frames.size).toBe(0);
    expect(ready).not.toHaveBeenCalled();
    loaded({ createMeroScene: factory });
    await vi.waitFor(() => expect(frames.size).toBe(1));
    expect(ready).not.toHaveBeenCalled();
    frame();
    expect(ready).toHaveBeenLastCalledWith('ready');
  });

  it('restores matching model frames synchronously and reuses the scene during navigation', async () => {
    const first = attach({ ...options, glowColor: '#06b6d4' });
    await visible(first.handle);
    frame();
    vi.useFakeTimers();
    first.handle.destroy();
    vi.advanceTimersByTime(1000);
    const second = attach({ ...options, glowColor: '#06b6d4', size: 40 });
    expect(second.ready).toHaveBeenLastCalledWith('ready');
    expect(second.canvas.width).toBe(first.canvas.width);
    second.handle.setVisible(true);
    frame(200);
    vi.advanceTimersByTime(1500);
    expect(factory).toHaveBeenCalledOnce();
    expect(scene.dispose).not.toHaveBeenCalled();
    second.handle.destroy();
    vi.advanceTimersByTime(1500);
    expect(scene.dispose).toHaveBeenCalledOnce();
    const third = attach({ ...options, glowColor: '#06b6d4' });
    expect(third.ready).toHaveBeenLastCalledWith('ready');
    expect(attach({ ...options, mood: 'sad', glowColor: '#06b6d4' }).ready).not.toHaveBeenCalled();
    expect(attach({ ...options, glowColor: '#f43f5e' }).ready).not.toHaveBeenCalled();
  });

  it('bounds frame caching and never shows a cached frame for another color', async () => {
    const first = attach({ ...options, glowColor: '#000000' });
    await visible(first.handle);
    frame();
    for (let index = 1; index <= 8; index++) {
      first.handle.update({ ...options, glowColor: `#00000${index}` });
      expect(first.ready).toHaveBeenLastCalledWith('loading');
      frame(index * 100 + 100);
    }
    expect(attach({ ...options, glowColor: '#000000' }).ready).not.toHaveBeenCalled();
    expect(attach({ ...options, glowColor: '#000008' }).ready).toHaveBeenLastCalledWith('ready');
  });

  it('reports initialization and drawing failure without showing a substitute character', async () => {
    scene.draw.mockImplementation(() => {
      throw new Error('GPU unavailable');
    });
    const { handle, ready } = attach();
    await visible(handle);
    frame();
    expect(ready).toHaveBeenLastCalledWith('unavailable');
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it('does not construct a scene if the page is left before the module loads', async () => {
    const { handle, ready } = attach();
    handle.setVisible(true);
    handle.destroy();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(factory).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('does not construct or schedule a scene after service destruction during module loading', async () => {
    let loaded!: (module: { createMeroScene: typeof createMeroScene }) => void;
    loader.mockReturnValue(new Promise((resolve) => (loaded = resolve)));
    const { handle, ready } = attach();
    handle.setVisible(true);
    expect(loader).toHaveBeenCalledOnce();
    service.ngOnDestroy();
    loaded({ createMeroScene: factory });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(factory).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('handles a rejected lazy module without retry loops or blocking the page', async () => {
    loader.mockRejectedValue(new Error('Module unavailable'));
    const { handle, ready } = attach();
    handle.setVisible(true);
    await vi.waitFor(() => expect(ready).toHaveBeenLastCalledWith('unavailable'));
    expect(loader).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it('passes each target color independently and redraws a static target on selection changes', async () => {
    const first = attach({ ...options, glowColor: '#06b6d4' });
    const second = attach({ ...options, glowColor: '#f43f5e' });
    await visible(first.handle);
    await visible(second.handle);
    frame();
    expect(scene.draw.mock.calls.slice(-2).map((call) => call[6])).toEqual(['#06b6d4', '#f43f5e']);
    first.handle.update({ ...options, glowColor: null });
    frame(200);
    expect(scene.draw.mock.lastCall?.[6]).toBeNull();
  });

  it('uses low geometry, bounded resolution, and no animation on constrained devices', async () => {
    service.ngOnDestroy();
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(4);
    service = TestBed.runInInjectionContext(() => new MeroRendererService());
    const { handle } = attach({ ...options, mood: 'happy', size: 512 });
    await visible(handle);
    frame();
    expect(factory).toHaveBeenCalledWith('low', expect.any(Function));
    expect(scene.draw.mock.lastCall?.[1]).toBe(256);
    expect(scene.draw.mock.lastCall?.[5]).toBe(false);
    expect(frames.size).toBe(0);
  });
  function pointer(target: EventTarget, type: string, x = 200, y = 224, id = 1) {
    const event = new MouseEvent(type, {
      clientX: x,
      clientY: y,
      button: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperties(event, { pointerId: { value: id }, isPrimary: { value: true } });
    target.dispatchEvent(event);
    return event;
  }

  it('allows only opted-in belly starts and carries the whole light beyond its canvas', async () => {
    const passive = attach();
    const active = attach({ ...options, interactive: true });
    await visible(passive.handle);
    await visible(active.handle);
    frame();
    pointer(passive.canvas, 'pointerdown');
    expect(document.querySelector('.mero-detached-light')).toBeNull();
    pointer(active.canvas, 'pointerdown', 200, 120);
    expect(document.querySelector('.mero-detached-light')).toBeNull();
    expect(pointer(active.canvas, 'pointerdown').defaultPrevented).toBe(true);
    pointer(document, 'pointermove', 850, 700);
    for (let i = 1; i < 15; i++) frame(100 + i * 50);
    const overlay = document.querySelector<HTMLElement>('.mero-detached-light')!;
    expect(overlay.parentElement).toBe(document.body);
    expect(parseFloat(overlay.style.left)).toBeGreaterThan(800);
    expect(parseFloat(overlay.style.top)).toBeGreaterThan(650);
    expect(overlay.style.width).toBe('180px');
    expect(overlay.style.pointerEvents).toBe('none');
    expect(
      (active.canvas.parentElement!.querySelector('.mero-belly-glow') as HTMLElement).style.opacity,
    ).toBe('0');
    expect(scene.draw.mock.lastCall?.[7]).toEqual(expect.objectContaining({ amount: 1 }));
    passive.handle.update({ ...options, glowColor: '#06b6d4' });
    frame(900);
    expect(
      [...scene.draw.mock.calls].reverse().find((call) => call[6] === '#06b6d4')?.[7],
    ).toBeNull();
    pointer(document, 'pointerup');
    for (let i = 1; i < 35; i++) frame(900 + i * 50);
    expect(document.querySelector('.mero-detached-light')).toBeNull();
    expect(scene.draw.mock.lastCall?.[7]).toBeNull();
    expect(
      (active.canvas.parentElement!.querySelector('.mero-belly-glow') as HTMLElement).style.opacity,
    ).toBe('');
    expect(frames.size).toBe(0);
  });

  it('ignores a second pointer and safely returns after cancellation or capture loss', async () => {
    const active = attach({ ...options, interactive: true });
    await visible(active.handle);
    frame();
    pointer(active.canvas, 'pointerdown');
    pointer(document, 'pointermove', 800, 700, 2);
    frame(150);
    expect(document.querySelector<HTMLElement>('.mero-detached-light')!.style.opacity).toBe('0');
    pointer(document, 'pointerup', 200, 224, 2);
    pointer(document, 'pointermove', 800, 700);
    frame(200);
    expect(
      Number(document.querySelector<HTMLElement>('.mero-detached-light')!.style.opacity),
    ).toBeGreaterThan(0);
    pointer(document, 'pointercancel');
    for (let i = 1; i < 35; i++) frame(200 + i * 50);
    expect(document.querySelector('.mero-detached-light')).toBeNull();
    pointer(active.canvas, 'pointerdown');
    pointer(active.canvas, 'lostpointercapture');
    frame(2000);
    expect(document.querySelector('.mero-detached-light')).toBeNull();
  });

  it.each(['hidden view', 'hidden tab', 'destroy', 'opt out', 'context loss', 'window blur'])(
    'cleans up an active light on %s',
    async (reason) => {
      const active = attach({ ...options, interactive: true });
      await visible(active.handle);
      frame();
      pointer(active.canvas, 'pointerdown');
      pointer(document, 'pointermove', 800, 700);
      frame(150);
      if (reason === 'hidden view') active.handle.setVisible(false);
      if (reason === 'hidden tab') {
        visibility.mockReturnValue(true);
        document.dispatchEvent(new Event('visibilitychange'));
      }
      if (reason === 'destroy') active.handle.destroy();
      if (reason === 'opt out') active.handle.update(options);
      if (reason === 'context loss') factory.mock.calls[0][1]();
      if (reason === 'window blur') window.dispatchEvent(new Event('blur'));
      expect(document.querySelector('.mero-detached-light')).toBeNull();
      pointer(document, 'pointermove', 900, 900);
      expect(document.querySelector('.mero-detached-light')).toBeNull();
    },
  );

  it('keeps reduced motion direct and restores immediately on release', async () => {
    motion.matches = true;
    const active = attach({ ...options, interactive: true });
    await visible(active.handle);
    frame();
    pointer(active.canvas, 'pointerdown');
    pointer(document, 'pointermove', 800, 700);
    frame(150);
    expect(
      parseFloat(document.querySelector<HTMLElement>('.mero-detached-light')!.style.left),
    ).toBeGreaterThan(790);
    expect(scene.draw.mock.lastCall?.[5]).toBe(false);
    pointer(document, 'pointerup');
    frame(200);
    expect(document.querySelector('.mero-detached-light')).toBeNull();
    expect(scene.draw.mock.lastCall?.[7]).toBeNull();
    expect(frames.size).toBe(0);
  });
});
