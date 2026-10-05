import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommitmentService } from '../services/commitment.service';

export const onboardingGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  await authService.ready;
  if (authService.isAuthenticated()) {
    return true;
  } else {
    return router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
  }
};
