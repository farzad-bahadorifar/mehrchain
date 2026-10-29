import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MeroCustomizationService } from '../../../core/services/mero-customization.service';
import type { MascotMood } from './mero-model';
import { MeroRendererService, MeroRenderState } from './mero-renderer.service';

export type MeroSize = 'xs' | 'sm' | 'md' | 'lg' | 'hero';

@Component({
  selector: 'app-mero',
  imports: [CommonModule],
  templateUrl: './mero.html',
  styleUrl: './mero.css',
})
export class MeroComponent {
  private customizationService = inject(MeroCustomizationService, { optional: true });
  private readonly renderer = inject(MeroRendererService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private renderTarget?: ReturnType<MeroRendererService['attach']>;
  private readonly pixels = signal(128);
  readonly renderState = signal<MeroRenderState>('loading');
  readonly ready = computed(() => this.renderState() === 'ready');

  // Inputs
  size = input<MeroSize>('md');
  mood = input<MascotMood>('reference');
  showGlow = input<boolean>(true);
  customGradient = input<string | null>(null);
  // Undefined uses the account selection. A draft preview never writes that selection.
  previewColor = input<string | null | undefined>(undefined);

  constructor() {
    effect(() => {
      const options = {
        mood: this.mood(),
        glow: this.showGlow() ? 1 : 0.75,
        size: this.pixels(),
        glowColor:
          this.previewColor() === undefined
            ? (this.customizationService?.effectiveGlowColor() ?? null)
            : (this.previewColor() ?? null),
      };
      this.renderTarget?.update(options);
    });
    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      this.pixels.set(canvas.getBoundingClientRect().width || 128);
      this.renderTarget = this.renderer.attach(
        canvas,
        {
          mood: this.mood(),
          glow: this.showGlow() ? 1 : 0.75,
          size: this.pixels(),
          glowColor:
            this.previewColor() === undefined
              ? (this.customizationService?.effectiveGlowColor() ?? null)
              : (this.previewColor() ?? null),
        },
        (state) => this.renderState.set(state),
      );
      this.zone.runOutsideAngular(() => {
        const resize =
          typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(([entry]) => this.pixels.set(Math.max(1, entry.contentRect.width)))
            : undefined;
        resize?.observe(canvas);
        this.pixels.set(canvas.getBoundingClientRect().width || 128);
        const visibility =
          typeof IntersectionObserver !== 'undefined'
            ? new IntersectionObserver(([entry]) =>
                this.renderTarget?.setVisible(entry.isIntersecting),
              )
            : undefined;
        if (visibility) visibility.observe(canvas);
        else this.renderTarget?.setVisible(true);
        this.destroyRef.onDestroy(() => {
          resize?.disconnect();
          visibility?.disconnect();
          this.renderTarget?.destroy();
        });
      });
    });
  }

  // Effective glow gradient
  effectiveGradient = computed<string>(() => {
    if (this.customGradient()) {
      return this.customGradient()!;
    }
    return (
      this.customizationService?.effectiveGlowGradient() ??
      'radial-gradient(circle, rgba(254, 240, 138, 0.8) 0%, rgba(245, 158, 11, 0.35) 45%, transparent 72%)'
    );
  });

  // Size mapping classes
  sizeClasses = computed(() => {
    switch (this.size()) {
      case 'xs':
        return 'w-10 h-10';
      case 'sm':
        return 'w-14 h-14';
      case 'md':
        return 'w-20 h-20';
      case 'lg':
        return 'w-32 h-32';
      case 'hero':
        return 'w-56 h-56 sm:w-64 sm:h-64';
      default:
        return 'w-20 h-20';
    }
  });
}
