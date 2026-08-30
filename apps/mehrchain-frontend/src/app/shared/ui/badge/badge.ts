import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'primary' | 'neutral' | 'outline' | 'success';
export type BadgeSize = 'xs' | 'sm';

@Component({
  selector: 'mc-badge',
  imports: [CommonModule],
  template: `
    <span [class]="classes()">
      <ng-content></ng-content>
    </span>
  `,
})
export class McBadgeComponent {
  variant = input<BadgeVariant>('primary');
  size = input<BadgeSize>('xs');

  classes = computed(() => {
    const base =
      'inline-flex items-center gap-1 font-bold uppercase tracking-wider select-none';

    let sizeStyle = '';
    switch (this.size()) {
      case 'xs':
        sizeStyle = 'px-2 py-0.5 text-[10px] rounded-md';
        break;
      case 'sm':
        sizeStyle = 'px-2.5 py-1 text-xs rounded-lg';
        break;
    }

    let variantStyle = '';
    switch (this.variant()) {
      case 'primary':
        variantStyle = 'bg-primary/10 text-primary';
        break;
      case 'neutral':
        variantStyle = 'bg-muted text-muted-foreground';
        break;
      case 'outline':
        variantStyle = 'border border-border text-foreground';
        break;
      case 'success':
        variantStyle =
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
        break;
    }

    return `${base} ${sizeStyle} ${variantStyle}`.trim();
  });
}
