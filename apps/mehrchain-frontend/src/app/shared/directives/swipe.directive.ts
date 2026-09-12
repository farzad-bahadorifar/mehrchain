import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appSwipe]',
  standalone: true,
})
export class SwipeDirective {
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  private startX = 0;
  private startY = 0;
  private startTime = 0;

  // Minimum horizontal movement required (pixels)
  private readonly minDistance = 45;
  // Maximum vertical deviation allowed to consider it a horizontal swipe
  private readonly maxVerticalDrift = 75;
  // Maximum duration in ms for a swipe gesture
  private readonly maxDuration = 500;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement | null;
    // Don't intercept swipe when interacting with text inputs or textareas
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      this.startX = 0;
      this.startY = 0;
      this.startTime = 0;
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.startTime = Date.now();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.startX || !this.startY || !this.startTime) {
      return;
    }

    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.maxDuration) {
      this.reset();
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX >= this.minDistance && absDeltaY <= this.maxVerticalDrift) {
      if (deltaX < 0) {
        // Swiped Left (User pulled screen towards left -> Next step)
        this.swipeLeft.emit();
      } else {
        // Swiped Right (User pulled screen towards right -> Previous step / Back)
        this.swipeRight.emit();
      }
    }

    this.reset();
  }

  private reset(): void {
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
  }
}
