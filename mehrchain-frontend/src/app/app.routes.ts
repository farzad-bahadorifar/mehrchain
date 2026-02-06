import { Routes } from '@angular/router';
import { OnboardingComponent } from './features/onboarding/onboarding';

export const routes: Routes = [
  { path: '', component: OnboardingComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'journey',
    loadComponent: () => import('./features/journey/journey').then(m => m.Journey)
  }
];