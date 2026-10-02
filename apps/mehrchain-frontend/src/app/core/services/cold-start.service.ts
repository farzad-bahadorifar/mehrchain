import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColdStartService {
  private activeRequestsCount = signal<number>(0);
  readonly isColdStarting = signal<boolean>(false);
  private timer: any = null;

  /**
   * Starts tracking a potentially long-running remote request (e.g. Render free tier cold start).
   * If any tracked request is still pending after delayMs (default 5000ms), isColdStarting becomes true.
   */
  startRequest(delayMs = 5000): void {
    const current = this.activeRequestsCount();
    this.activeRequestsCount.set(current + 1);

    if (!this.timer && !this.isColdStarting()) {
      this.timer = setTimeout(() => {
        if (this.activeRequestsCount() > 0) {
          this.isColdStarting.set(true);
        }
      }, delayMs);
    }
  }

  /**
   * Finishes tracking an active request.
   * When all requests complete, cold start message is dismissed and timers are cleared.
   */
  finishRequest(): void {
    const current = this.activeRequestsCount();
    const next = Math.max(0, current - 1);
    this.activeRequestsCount.set(next);

    if (next === 0) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.isColdStarting.set(false);
    }
  }

  /**
   * Wraps an async Promise execution with cold start tracking.
   */
  async trackPromise<T>(promise: Promise<T>, delayMs = 5000): Promise<T> {
    this.startRequest(delayMs);
    try {
      return await promise;
    } finally {
      this.finishRequest();
    }
  }
}
