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
  _cleanupPointer?: () => void;
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

  // --- Belly light drag state ---
  private draggingTarget?: MeroTarget;
  private isDragging = false;

  constructor() {
    if (this.browser) {
      this.document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.motion?.addEventListener('change', this.onMotionChange);
    }
  }

  attach(canvas: HTMLCanvasElement, options: MeroRenderOptions, notify: MeroTarget['notify']) {
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

      // --- Belly light pointer events ---
      const canvasEl = canvas;
      const ndcFromPointer = (e: PointerEvent): [number, number] => {
        const rect = canvasEl.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        return [x, y];
      };

      const unprojectToModelLocal = (ndcX: number, ndcY: number): { x: number; y: number; z: number } | null => {
        if (!this.scene) return null;
        const camera = this.scene.camera;
        const model = this.scene.mascot.model;
        // For orthographic camera, NDC maps linearly to world coordinates
        const worldX = ndcX * (camera.right as number);
        const worldY = ndcY * (camera.top as number);
        // Transform from world to model-local (model has idle animation offset)
        const localX = worldX - model.position.x;
        const localY = worldY - model.position.y;
        return { x: localX, y: localY, z: 0.55 };
      };

      const onPointerDown = (e: PointerEvent) => {
        if (this.isDragging || !this.scene) return;
        const [ndcX, ndcY] = ndcFromPointer(e);
        // Check if pointer is near belly region
        if (Math.abs(ndcX) <= 0.55 && ndcY >= -0.75 && ndcY <= 0.25) {
          this.isDragging = true;
          this.draggingTarget = target;
          try {
            canvasEl.setPointerCapture?.(e.pointerId);
          } catch {
            // Pointer capture is optional and may fail on untracked pointer IDs
          }
          canvasEl.style.cursor = 'grabbing';
          const local = unprojectToModelLocal(ndcX, ndcY);
          if (local && this.scene) {
            this.scene.mascot.setLightDragTarget(local);
          }
          this.schedule();
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!this.isDragging || !this.scene || this.draggingTarget !== target) return;
        const [ndcX, ndcY] = ndcFromPointer(e);
        const local = unprojectToModelLocal(ndcX, ndcY);
        if (local) {
          this.scene.mascot.setLightDragTarget(local);
        }
        this.schedule();
      };

      const onPointerEnd = () => {
        if (!this.isDragging || this.draggingTarget !== target) return;
        this.isDragging = false;
        this.draggingTarget = undefined;
        canvasEl.style.cursor = 'grab';
        if (this.scene) {
          this.scene.mascot.setLightDragTarget(null);
        }
        this.schedule();
      };

      canvasEl.addEventListener('pointerdown', onPointerDown);
      canvasEl.addEventListener('pointermove', onPointerMove);
      canvasEl.addEventListener('pointerup', onPointerEnd);
      canvasEl.addEventListener('pointercancel', onPointerEnd);
      canvasEl.addEventListener('lostpointercapture', onPointerEnd);

      target._cleanupPointer = () => {
        canvasEl.removeEventListener('pointerdown', onPointerDown);
        canvasEl.removeEventListener('pointermove', onPointerMove);
        canvasEl.removeEventListener('pointerup', onPointerEnd);
        canvasEl.removeEventListener('pointercancel', onPointerEnd);
        canvasEl.removeEventListener('lostpointercapture', onPointerEnd);
      };
    } else notify('unavailable');
    return {
      update: (next: MeroRenderOptions) => {
        if (!target || !this.targets.has(target)) return;
        target.options = next;
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
        target.dirty = true;
        if (visible) this.schedule();
        else if (![...this.targets].some((item) => item.visible)) this.cancelFrame();
      },
      destroy: () => {
        if (target) {
          target._cleanupPointer?.();
          this.targets.delete(target);
        }
        if (this.targets.size === 0) {
          this.cancelFrame();
          this.releaseWhenIdle();
        }
      },
    };
  }

  private key(options: MeroRenderOptions) {
    return JSON.stringify([options.mood, options.glow, options.glowColor ?? null]);
  }

  private setState(target: MeroTarget, state: MeroRenderState) {
    if (target.state === state) return;
    target.state = state;
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
    if (this.document.hidden) this.cancelFrame();
    else {
      this.targets.forEach((target) => (target.dirty = true));
      this.schedule();
    }
  };

  private readonly onMotionChange = () => {
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
    const orbActive = this.isDragging || (this.scene.mascot.getExtractAmount() > 0.005);
    const moving = orbActive || [...this.targets].some((target) => target.visible && this.animated(target));
    const dirty = [...this.targets].some((target) => target.visible && target.dirty);
    if (!dirty && time - this.lastFrame < this.policy.frameInterval) {
      if (moving) this.schedule();
      return;
    }
    const started = performance.now();
    try {
      for (const target of this.targets) {
        if (!target.visible || (!target.dirty && !this.animated(target) && !orbActive)) continue;
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
        );
        if (this.unavailable) return;
        if (target.dirty) this.remember(target);
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
    this.unavailable = true;
    this.cancelFrame();
    this.cancelRelease();
    // The WebGL context is offscreen: each target still owns its last valid 2D frame.
    this.targets.forEach((target) => {
      if (target.presentedKey !== this.key(target.options) && !this.restore(target)) {
        this.setState(target, 'unavailable');
      }
    });
    this.scene?.dispose();
    this.scene = undefined;
  }

  private cancelFrame() {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.cancelFrame();
    this.cancelRelease();
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.motion?.removeEventListener('change', this.onMotionChange);
    this.scene?.dispose();
    this.scene = undefined;
    this.targets.clear();
    this.snapshots.clear();
  }
}
