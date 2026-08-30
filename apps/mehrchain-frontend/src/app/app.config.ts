import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIonicAngular } from '@ionic/angular';
import { authInterceptor } from './core/interceptors/auth.interceptor';
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
  Bell,
  Clock,
  Calendar,
  ArrowLeft,
  LogOut,
  Trash2,
  Mail,
  User,
  Link,
  Zap,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideIonicAngular({ mode: 'ios' }),
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
        Bell,
        Clock,
        Calendar,
        ArrowLeft,
        LogOut,
        Trash2,
        Mail,
        User,
        Link,
        Zap,
      }),
    ),
  ],
};
