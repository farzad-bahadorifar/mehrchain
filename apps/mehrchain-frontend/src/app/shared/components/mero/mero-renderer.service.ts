import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectionToken, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import type { MascotMood } from './mero-model';
import { meroPerformancePolicy } from './mero-performance';
import type { createMeroScene } from './mero-scene';

export const MERO_SCENE_LOADER = new InjectionToken<() => Promise<typeof import('./mero-scene')>>(
  'Mero scene loader',
  { providedIn: 'root', factory: () => () => import('./mero-scene') },
);

export interface MeroRenderOptions {
  interactive?: boolean;
  mood: MascotMood;
  glow: number;
  size: number;
  glowColor?: string | null;
}

export type MeroRenderState = 'loading' | 'ready' | 'unavailable';

interface MeroTarget {
  context: CanvasRenderingContext2D;
  options: MeroRenderOptions;
  visible: boolean;
  dirty: boolean;
  state: MeroRenderState;
  presentedKey?: string;
  notify: (state: MeroRenderState) => void;
  cleanupPointer?: () => void;
  lightHandle?: HTMLElement;
  halo?: HTMLElement | null;
}

@Injectable({ providedIn: 'root' })
export class MeroRendererService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly loadScene = inject(MERO_SCENE_LOADER);
  private readonly targets = new Set<MeroTarget>();
  // Eight bounded canvas copies, at most ~4.5 MiB at the standard pixel cap.
  // Only visual options are cached: no user data or persistent storage.
  private readonly snapshots = new Map<string, HTMLCanvasElement>();
  private scene?: ReturnType<typeof createMeroScene>;
  private releaseTimer?: ReturnType<typeof setTimeout>;
  private loading = false;
  private unavailable = false;
  private destroyed = false;
  private frame?: number;
  private lastFrame = -Infinity;
  private slowFrames = 0;
  private animationDisabled = false;
  private readonly motion = this.browser
    ? this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
    : undefined;
  private readonly policy = meroPerformancePolicy(
    this.browser
      ? (() => {
          const device = this.document.defaultView!.navigator as Navigator & {
            deviceMemory?: number;
            connection?: { saveData?: boolean };
          };
          return {
            cores: device.hardwareConcurrency,
            memory: device.deviceMemory,
            saveData: device.connection?.saveData,
          };
        })()
      : {},
  );

  private light?: {
    target: MeroTarget;
    overlay: HTMLElement;
    pointerId: number | null;
    x: number;
    y: number;
    destinationX: number;
    destinationY: number;
    offsetX: number;
    offsetY: number;
    amount: number;
    lastTime?: number;
  };

  constructor() {
    if (this.browser) {
      this.document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.motion?.addEventListener('change', this.onMotionChange);
      this.document.defaultView?.addEventListener('blur', this.onWindowBlur);
    }
  }

  attach(
    canvas: HTMLCanvasElement,
    options: MeroRenderOptions,
    notify: MeroTarget['notify'],
    lightHandle?: HTMLElement,
  ) {
    let context: CanvasRenderingContext2D | null = null;
    try {
      if (
        this.browser &&
        !this.destroyed &&
        (typeof WebGL2RenderingContext !== 'undefined' || this.snapshots.size > 0)
      )
        context = canvas.getContext('2d');
    } catch {
      // An unavailable canvas must never prevent the rest of the page loading.
    }
    const target: MeroTarget | undefined = context
      ? { context, options, visible: false, dirty: true, state: 'loading', notify }
      : undefined;
    if (target) {
      this.cancelRelease();
      this.targets.add(target);
      this.restore(target);
      if (typeof WebGL2RenderingContext === 'undefined') this.unavailable = true;
      if (this.unavailable && target.state !== 'ready') this.setState(target, 'unavailable');

      target.lightHandle = lightHandle;
      target.halo = canvas.parentElement?.querySelector<HTMLElement>('.mero-belly-glow');
      this.bindLight(target, lightHandle ?? canvas);
    } else notify('unavailable');
    return {
      update: (next: MeroRenderOptions) => {
        if (!target || !this.targets.has(target)) return;
        target.options = next;
        this.updateHandle(target);
        if (!next.interactive && this.light?.target === target) this.clearLight();
        target.dirty = true;
        if (target.presentedKey !== this.key(next)) {
          if (!this.restore(target)) {
            target.presentedKey = undefined;
            this.setState(target, this.unavailable ? 'unavailable' : 'loading');
          }
        }
        this.schedule();
      },
      setVisible: (visible: boolean) => {
        if (!target || !this.targets.has(target) || target.visible === visible) return;
        target.visible = visible;
        if (!visible && this.light?.target === target) this.clearLight();
        this.updateHandle(target);
        target.dirty = true;
        if (visible) this.schedule();
        else if (![...this.targets].some((item) => item.visible)) this.cancelFrame();
      },
      destroy: () => {
        if (target) {
          if (this.light?.target === target) this.clearLight();
          target.cleanupPointer?.();
          this.targets.delete(target);
        }
        if (this.targets.size === 0) {
          this.cancelFrame();
          this.releaseWhenIdle();
        }
      },
    };
  }

  private updateHandle(target: MeroTarget) {
    if (target.lightHandle) {
      target.lightHandle.style.display =
        target.options.interactive &&
        target.visible &&
        target.state === 'ready' &&
        !this.unavailable
          ? 'block'
          : 'none';
    }
  }

  private localPoint(target: MeroTarget, x: number, y: number) {
    const rect = target.context.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return (
      this.scene?.localPoint(
        ((x - rect.left) / rect.width) * 2 - 1,
        1 - ((y - rect.top) / rect.height) * 2,
      ) ?? null
    );
  }

  private anchor(target: MeroTarget) {
    const rect = target.context.canvas.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height * (0.5 + 61 / 504) };
  }

  private bindLight(target: MeroTarget, handle: HTMLElement) {
    const down = (event: PointerEvent) => {
      if (
        !target.options.interactive ||
        !target.visible ||
        target.state !== 'ready' ||
        this.unavailable ||
        this.light ||
        event.button !== 0 ||
        event.isPrimary === false
      )
        return;
      const point = this.localPoint(target, event.clientX, event.clientY);
      if (
        !point ||
        Math.pow(Math.abs(point.x / 0.7), 2 / 0.92) +
          Math.pow(Math.abs((point.y + 61 / 180) / (100 / 180)), 2 / 0.92) >
          1
      )
        return;
      const anchor = this.anchor(target);
      const overlay = this.document.createElement('div');
      overlay.className = 'mero-detached-light';
      overlay.setAttribute('aria-hidden', 'true');
      // A body-level, non-interactive layer escapes card/shell/canvas clipping.
      overlay.style.cssText =
        'position:fixed;pointer-events:none;z-index:10000;left:0;top:0;' +
        'border-radius:50%;transform:translate(-50%,-50%);opacity:0;';
      this.document.body.appendChild(overlay);
      this.light = {
        target,
        overlay,
        pointerId: event.pointerId,
        x: anchor.x,
        y: anchor.y,
        destinationX: anchor.x,
        destinationY: anchor.y,
        amount: 0,
        offsetX: anchor.x - event.clientX,
        offsetY: anchor.y - event.clientY,
      };
      try {
        handle.setPointerCapture?.(event.pointerId);
      } catch {
        /* Document listeners remain active. */
      }
      handle.style.cursor = 'grabbing';
      event.preventDefault();
      event.stopPropagation();
      this.schedule();
    };
    const move = (event: PointerEvent) => {
      const light = this.light;
      if (!light || light.target !== target || event.pointerId !== light.pointerId) return;
      light.destinationX = event.clientX + light.offsetX;
      light.destinationY = event.clientY + light.offsetY;
      event.preventDefault();
      this.schedule();
    };
    const end = (event: PointerEvent) => {
      const light = this.light;
      if (!light || light.target !== target || event.pointerId !== light.pointerId) return;
      light.pointerId = null;
      handle.style.cursor = 'grab';
      try {
        if (handle.hasPointerCapture?.(event.pointerId))
          handle.releasePointerCapture(event.pointerId);
      } catch {
        /* Capture may already have been released by the browser. */
      }
      if (this.motion?.matches) this.clearLight();
      this.schedule();
    };
    // Do not let the onboarding touch-swipe recognizer turn a light drag into navigation.
    const stopTouch = (event: TouchEvent) => event.stopPropagation();
    handle.addEventListener('pointerdown', down);
    handle.addEventListener('lostpointercapture', end);
    handle.addEventListener('touchstart', stopTouch);
    this.document.addEventListener('pointermove', move, { passive: false });
    this.document.addEventListener('pointerup', end);
    this.document.addEventListener('pointercancel', end);
    target.cleanupPointer = () => {
      handle.removeEventListener('pointerdown', down);
      handle.removeEventListener('lostpointercapture', end);
      handle.removeEventListener('touchstart', stopTouch);
      this.document.removeEventListener('pointermove', move);
      this.document.removeEventListener('pointerup', end);
      this.document.removeEventListener('pointercancel', end);
    };
  }

  private advanceLight(time: number) {
    const light = this.light;
    if (!light) return;
    const anchor = this.anchor(light.target);
    const dt = Math.min(0.05, Math.max(0, (time - (light.lastTime ?? time - 16)) / 1000));
    light.lastTime = time;
    const returning = light.pointerId === null;
    const blend = this.motion?.matches ? 1 : 1 - Math.exp(-(returning ? 9 : 25) * dt);
    light.x += ((returning ? anchor.x : light.destinationX) - light.x) * blend;
    light.y += ((returning ? anchor.y : light.destinationY) - light.y) * blend;
    const size = light.target.context.canvas.getBoundingClientRect().width;
    const distance = Math.hypot(light.x - anchor.x, light.y - anchor.y);
    light.amount = Math.min(1, distance / Math.max(1, size * 0.25));
    if (light.target.halo) light.target.halo.style.opacity = String(0.8 * (1 - light.amount));
    const selected = light.target.options.glowColor;
    const color = selected && /^#[0-9a-f]{6}$/i.test(selected) ? selected : '#fff6ad';
    Object.assign(light.overlay.style, {
      left: light.x + 'px',
      top: light.y + 'px',
      width: size * 0.9 + 'px',
      height: size * 0.72 + 'px',
      opacity: String(light.amount),
      background:
        'radial-gradient(ellipse, ' +
        color +
        ' 0%, ' +
        color +
        ' 38%, ' +
        color +
        'cc 50%, ' +
        color +
        '44 64%, ' +
        color +
        '00 74%)',
    });
    if (returning && distance < 0.3) this.clearLight();
  }

  private lightState(target: MeroTarget) {
    if (this.light?.target !== target) return null;
    const point = this.localPoint(target, this.light.x, this.light.y);
    return point ? { x: point.x, y: point.y, amount: this.light.amount } : null;
  }

  private clearLight() {
    const light = this.light;
    if (!light) return;
    this.light = undefined;
    light.overlay.remove();
    light.target.halo?.style.removeProperty('opacity');
    light.target.dirty = true;
    const handle = light.target.lightHandle ?? light.target.context.canvas;
    handle.style.cursor = 'grab';
    if (light.pointerId !== null) {
      try {
        if (handle.hasPointerCapture?.(light.pointerId))
          handle.releasePointerCapture(light.pointerId);
      } catch {
        /* The target may already be detached. */
      }
    }
  }

  private key(options: MeroRenderOptions) {
    return JSON.stringify([options.mood, options.glow, options.glowColor ?? null]);
  }

  private setState(target: MeroTarget, state: MeroRenderState) {
    if (target.state === state) return;
    target.state = state;
    this.updateHandle(target);
    target.notify(state);
  }

  private restore(target: MeroTarget) {
    const key = this.key(target.options);
    const snapshot = this.snapshots.get(key);
    if (!snapshot) return false;
    try {
      const canvas = target.context.canvas;
      canvas.width = snapshot.width;
      canvas.height = snapshot.height;
      target.context.drawImage(snapshot, 0, 0);
      target.presentedKey = key;
      this.snapshots.delete(key);
      this.snapshots.set(key, snapshot);
      this.setState(target, 'ready');
      return true;
    } catch {
      return false;
    }
  }

  private remember(target: MeroTarget) {
    const key = this.key(target.options);
    const source = target.context.canvas;
    // Reuse larger matching frames across sizes; CSS keeps the same square framing.
    if ((this.snapshots.get(key)?.width ?? 0) >= source.width) return;
    try {
      const snapshot = this.document.createElement('canvas');
      snapshot.width = source.width;
      snapshot.height = source.height;
      const context = snapshot.getContext('2d');
      if (!context) return;
      context.drawImage(source, 0, 0);
      this.snapshots.delete(key);
      this.snapshots.set(key, snapshot);
      if (this.snapshots.size > 8) this.snapshots.delete(this.snapshots.keys().next().value!);
    } catch {
      // Snapshot caching is optional, including on memory-constrained devices.
    }
  }

  private cancelRelease() {
    if (this.releaseTimer !== undefined) clearTimeout(this.releaseTimer);
    this.releaseTimer = undefined;
  }

  private releaseWhenIdle() {
    if (this.destroyed || this.targets.size || this.loading || !this.scene) return;
    this.cancelRelease();
    this.zone.runOutsideAngular(() => {
      this.releaseTimer = setTimeout(() => {
        this.releaseTimer = undefined;
        this.scene?.dispose();
        this.scene = undefined;
      }, 1500);
    });
  }

  private readonly onVisibilityChange = () => {
    if (this.document.hidden) {
      this.clearLight();
      this.cancelFrame();
    } else {
      this.targets.forEach((target) => (target.dirty = true));
      this.schedule();
    }
  };

  private readonly onWindowBlur = () => {
    this.clearLight();
    this.schedule();
  };

  private readonly onMotionChange = () => {
    if (this.motion?.matches && this.light?.pointerId === null) this.clearLight();
    this.targets.forEach((target) => (target.dirty = true));
    this.schedule();
  };

  private animated(target: MeroTarget) {
    return (
      this.policy.animate &&
      !this.animationDisabled &&
      !this.motion?.matches &&
      target.options.size >= 96 &&
      target.options.mood === 'happy'
    );
  }

  private schedule() {
    if (
      !this.browser ||
      this.destroyed ||
      this.loading ||
      this.unavailable ||
      this.document.hidden ||
      ![...this.targets].some((target) => target.visible)
    )
      return;
    if (!this.scene) {
      if (!this.loading) {
        this.loading = true;
        // Keep Three.js out of the initial application bundle and load only in view.
        void this.loadScene()
          .then(({ createMeroScene }) => {
            if (
              !this.destroyed &&
              [...this.targets].some((target) => target.visible) &&
              !this.document.hidden
            ) {
              this.scene = createMeroScene(this.policy.detail, () => this.fail());
            }
          })
          .catch(() => {
            if (!this.destroyed) this.fail();
          })
          .finally(() => {
            this.loading = false;
            this.releaseWhenIdle();
            this.schedule();
          });
      }
      return;
    }
    if (this.frame !== undefined) return;
    this.zone.runOutsideAngular(() => {
      this.frame = requestAnimationFrame(this.render);
    });
  }

  private readonly render = (time: number) => {
    this.frame = undefined;
    if (!this.scene || this.document.hidden) return;
    const orbActive = !!this.light;
    const moving =
      orbActive || [...this.targets].some((target) => target.visible && this.animated(target));
    const dirty = [...this.targets].some((target) => target.visible && target.dirty);
    if (!dirty && time - this.lastFrame < this.policy.frameInterval) {
      if (moving) this.schedule();
      return;
    }
    const started = performance.now();
    try {
      this.advanceLight(time);
      for (const target of this.targets) {
        if (
          !target.visible ||
          (!target.dirty && !this.animated(target) && this.light?.target !== target)
        )
          continue;
        const pixels = Math.max(
          1,
          Math.min(
            this.policy.maxPixels,
            Math.round(
              target.options.size *
                Math.min(
                  this.document.defaultView?.devicePixelRatio || 1,
                  this.animationDisabled ? 1 : this.policy.pixelRatio,
                ),
            ),
          ),
        );
        this.scene.draw(
          target.context,
          pixels,
          target.options.mood,
          target.options.glow,
          time / 1000,
          this.animated(target),
          target.options.glowColor ?? null,
          this.lightState(target),
        );
        if (this.unavailable) return;
        if (target.dirty && this.light?.target !== target) this.remember(target);
        target.dirty = false;
        target.presentedKey = this.key(target.options);
        this.setState(target, 'ready');
      }
    } catch {
      this.fail();
      return;
    }
    this.lastFrame = time;
    // Hints are imperfect. Sustained expensive frames also disable animation.
    this.slowFrames = performance.now() - started > 24 ? this.slowFrames + 1 : 0;
    if (this.slowFrames >= 5 && !this.animationDisabled) {
      this.animationDisabled = true;
      this.targets.forEach((target) => (target.dirty = true));
      this.schedule();
    } else if (moving) this.schedule();
  };

  private fail() {
    this.clearLight();
    this.unavailable = true;
    this.cancelFrame();
    this.cancelRelease();
    // The WebGL context is offscreen: each target still owns its last valid 2D frame.
    this.targets.forEach((target) => {
      if (target.presentedKey !== this.key(target.options) && !this.restore(target)) {
        this.setState(target, 'unavailable');
      }
    });
    this.targets.forEach((target) => this.updateHandle(target));
    this.scene?.dispose();
    this.scene = undefined;
  }

  private cancelFrame() {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }

  ngOnDestroy() {
    this.clearLight();
    this.targets.forEach((target) => target.cleanupPointer?.());
    this.destroyed = true;
    this.cancelFrame();
    this.cancelRelease();
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.motion?.removeEventListener('change', this.onMotionChange);
    this.document.defaultView?.removeEventListener('blur', this.onWindowBlur);
    this.scene?.dispose();
    this.scene = undefined;
    this.targets.clear();
    this.snapshots.clear();
  }
}
