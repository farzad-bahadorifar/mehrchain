export interface Commitment {
  id: string; // تغییر به string برای پشتیبانی از UUID در دیتابیس
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