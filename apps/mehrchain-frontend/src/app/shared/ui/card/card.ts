import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export type CardVariant = 'elevated' | 'flat' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'mc-card',
  imports: [CommonModule],
  template: `
    <div [class]="classes()">
      <ng-content></ng-content>
    </div>
  `,
})
export class McCardComponent {
  variant = input<CardVariant>('elevated');
  padding = input<CardPadding>('md');

  classes = computed(() => {
    const base = 'relative overflow-hidden transition-all duration-300';

    // Padding
    let padStyle = '';
    switch (this.padding()) {
      case 'none':
        padStyle = 'p-0';
        break;
      case 'sm':
        padStyle = 'p-3';
        break;
      case 'md':
        padStyle = 'p-5';
        break;
      case 'lg':
        padStyle = 'p-6 sm:p-7';
        break;
    }

    // Variants
    let variantStyle = '';
    switch (this.variant()) {
      case 'elevated':
        variantStyle =
          'bg-card rounded-[1.5rem] shadow-soft border border-border/50 hover:shadow-lg';
        break;
      case 'flat':
        variantStyle = 'bg-muted/40 rounded-2xl border border-border/40';
        break;
      case 'interactive':
        variantStyle =
          'bg-card rounded-2xl shadow-sm border border-border/50 hover:border-primary/40 hover:shadow-md cursor-pointer active:scale-98';
        break;
    }

    return `${base} ${padStyle} ${variantStyle}`.trim();
  });
}
