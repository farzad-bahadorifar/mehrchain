import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommitmentService } from '../services/commitment.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const commitmentService = inject(CommitmentService);

  if (authService.isAuthenticated() && commitmentService.hasAnyCommitment()) {
    return true;
  } else {
    return router.createUrlTree(['/']);
  }
};
