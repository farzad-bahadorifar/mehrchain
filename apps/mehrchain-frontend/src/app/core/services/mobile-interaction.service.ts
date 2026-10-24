import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MobileInteractionService {
  private document = inject(DOCUMENT);

  constructor() {
    try {
      // Retire the unrequested text-size preference from the earlier T19 build.
      // Leave the root font browser-controlled so device text settings still apply.
      if (localStorage.getItem('mehrchain_text_size') !== null) {
        this.document.documentElement.style.removeProperty('font-size');
        localStorage.removeItem('mehrchain_text_size');
      }
    } catch {}
    const view = this.document.defaultView;
    if (!view?.matchMedia) return;
    const mobile = view.matchMedia('(hover: none) and (pointer: coarse)');
    const viewport = this.document.querySelector('meta[name="viewport"]');
    const original = viewport?.getAttribute('content') || '';
    const apply = () =>
      viewport?.setAttribute(
        'content',
        original + (mobile.matches ? ', maximum-scale=1, user-scalable=no' : ''),
      );
    apply();
    mobile.addEventListener('change', apply);
    // Safari gesture events are restricted to mobile app surfaces; ordinary
    // single-finger touches, selection, keyboard events and desktop zoom pass.
    const gesture = (event: Event) => {
      if (
        mobile.matches &&
        event.target instanceof Element &&
        event.target.closest('app-root') &&
        event.cancelable
      )
        event.preventDefault();
    };
    this.document.addEventListener('gesturestart', gesture, { passive: false });
    this.document.addEventListener('gesturechange', gesture, { passive: false });
    inject(DestroyRef).onDestroy(() => {
      mobile.removeEventListener('change', apply);
      viewport?.setAttribute('content', original);
      this.document.removeEventListener('gesturestart', gesture);
      this.document.removeEventListener('gesturechange', gesture);
    });
  }
}
