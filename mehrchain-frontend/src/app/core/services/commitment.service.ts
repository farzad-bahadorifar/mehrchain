import { Injectable, computed, signal, effect } from '@angular/core';
import { Commitment } from '../models/commitment.model';

@Injectable({
  providedIn: 'root'
})
export class CommitmentService {
  private STORAGE_KEY = 'mehrchain_data_v1';


  // State
  private commitmentsSignal = signal<Commitment[]>([]);

  constructor() {
    this.loadFromStorage();
    effect(() => {
      const data = this.commitmentsSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    });
  }

  // Selectors
  readonly commitments = this.commitmentsSignal.asReadonly();
  readonly hasAnyCommitment = computed(() => this.commitmentsSignal().length > 0);

  readonly overallStreak = computed(() => {
    const list = this.commitmentsSignal();
    return list.length > 0 ? Math.max(...list.map(c => c.currentStreak)) : 0;
  });

  // Actions
  private loadFromStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.commitmentsSignal.set(parsed);
      } catch (e) {
        console.error('Data load failed', e);
      }
    }
  }

  addCommitment(data: Partial<Commitment>) {
    const newCommitment: Commitment = {
      id: Date.now(),
      title: data.title!,
      totalDays: data.totalDays || 21,
      currentDay: 1,
      currentStreak: 0,
      isCompletedToday: false,
      category: data.category as any,
      why: data.why,
      rippleEffects: data.rippleEffects,
      startDate: new Date().toISOString()
    };

    this.commitmentsSignal.update(list => [newCommitment, ...list]);
  }

  completeCommitment(id: number) {
    const todayStr = new Date().toDateString();
    this.commitmentsSignal.update(list =>
      list.map(c => {
        if (c.id === id && !c.isCompletedToday) {
          return {
            ...c,
            isCompletedToday: true,
            currentStreak: c.currentStreak + 1,
            currentDay: Math.min(c.currentDay + 1, c.totalDays),
            lastCompletedDate: todayStr
          };
        }
        return c;
      })
    );
  }

  resetData() {
    this.commitmentsSignal.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}