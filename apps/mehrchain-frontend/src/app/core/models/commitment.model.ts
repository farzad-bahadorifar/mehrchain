export interface Commitment {
  id: number;
  title: string;
  totalDays: number;
  currentDay: number;
  currentStreak: number;
  isCompletedToday: boolean;
  category: 'health' | 'growth' | 'community' | 'environment';
  why?: string;
  rippleEffects?: string[];
  startDate: string;
  lastCompletedDate?: string;
  history?: string[];
}
