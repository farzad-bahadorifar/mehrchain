import { Injectable, signal } from '@angular/core';

export type MeroState = 'idle' | 'happy' | 'waiting' | 'celebrating';

@Injectable({
  providedIn: 'root',
})
export class MeroService {
  readonly state = signal<MeroState>('idle');

  setState(newState: MeroState) {
    this.state.set(newState);
  }

  getAvatar() {
    switch (this.state()) {
      case 'happy':
        return '🥰';
      case 'celebrating':
        return '🤩';
      case 'waiting':
        return '👀';
      default:
        return '🙂';
    }
  }
}
