import { Routes } from '@angular/router';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { onboardingGuard } from './core/guards/onboarding-guard';

export const routes: Routes = [
  { path: '', component: OnboardingComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
    canActivate: [onboardingGuard],
  },
  {
    path: 'journey',
    loadComponent: () => import('./features/journey/journey').then((m) => m.Journey),
    canActivate: [onboardingGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
    canActivate: [onboardingGuard],
  },
  { path: '**', redirectTo: '' },
];
