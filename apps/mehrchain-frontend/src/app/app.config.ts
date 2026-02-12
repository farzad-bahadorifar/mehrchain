import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import {
  LucideAngularModule,
  Home,
  Plus,
  Flame,
  Check,
  Sparkles,
  Heart,
  Leaf,
  Users,
  TrendingUp,
  ArrowRight,
  X,
  Globe,
  Lock,
  CheckCircle2,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    importProvidersFrom(
      LucideAngularModule.pick({
        Home,
        Plus,
        Flame,
        Check,
        Sparkles,
        Heart,
        Leaf,
        Users,
        TrendingUp,
        ArrowRight,
        X,
        Globe,
        Lock,
        CheckCircle2,
      }),
    ),
  ],
};
