import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CommitmentService } from '../services/commitment.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const commitmentService = inject(CommitmentService);

  if (commitmentService.hasAnyCommitment()) {
    return true;
  } else {
    return router.createUrlTree(['/']);
  }
};
