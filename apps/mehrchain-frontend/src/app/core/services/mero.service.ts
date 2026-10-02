import { Injectable, signal } from '@angular/core';

export type MeroState =
  | 'idle'
  | 'content'
  | 'happy'
  | 'waiting'
  | 'celebrating'
  | 'sleepy'
  | 'missing';

@Injectable({
  providedIn: 'root',
})
export class MeroService {
  readonly state = signal<MeroState>('idle');

  setState(newState: MeroState) {
    this.state.set(newState);
  }

  getAvatar() {
    return 'assets/mero.png';
  }
}
