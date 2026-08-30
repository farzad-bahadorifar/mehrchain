import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

@Component({
  selector: 'mc-button',
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="handleClick($event)"
      [class]="classes()"
    >
      @if (loading()) {
        <span
          class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        ></span>
      }
      <ng-content></ng-content>
    </button>
  `,
})
export class McButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  fullWidth = input<boolean>(false);
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  clicked = output<MouseEvent>();

  classes = computed(() => {
    const base =
      'inline-flex items-center justify-center font-bold transition-all duration-200 ease-out active:scale-95 focus:outline-none select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    // Width
    const width = this.fullWidth() ? 'w-full' : '';

    // Sizes
    let sizeStyle = '';
    switch (this.size()) {
      case 'sm':
        sizeStyle = 'px-3 py-1.5 text-xs rounded-xl gap-1.5';
        break;
      case 'md':
        sizeStyle = 'px-4 py-2.5 text-sm rounded-xl gap-2';
        break;
      case 'lg':
        sizeStyle = 'px-6 py-3.5 text-base rounded-2xl gap-2.5 shadow-sm';
        break;
      case 'icon':
        sizeStyle = 'w-9 h-9 p-0 rounded-full gap-0';
        break;
    }

    // Variants
    let variantStyle = '';
    switch (this.variant()) {
      case 'primary':
        variantStyle =
          'bg-primary text-primary-foreground hover:bg-accent shadow-soft hover:shadow-float';
        break;
      case 'secondary':
        variantStyle =
          'bg-muted/80 text-foreground hover:bg-muted border border-border/50';
        break;
      case 'outline':
        variantStyle =
          'border-2 border-border text-foreground hover:border-primary/40 hover:bg-primary/5';
        break;
      case 'ghost':
        variantStyle =
          'text-muted-foreground hover:text-foreground hover:bg-muted/50';
        break;
      case 'danger':
        variantStyle =
          'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-950/70';
        break;
    }

    return `${base} ${width} ${sizeStyle} ${variantStyle}`.trim();
  });

  handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
