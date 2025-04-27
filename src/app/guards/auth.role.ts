// role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {AuthFacade} from '../services/auth.facade';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthFacade);
  const router = inject(Router);

  if (!authService.getUserRole()) {
    router.navigate(['/access-denied']);
    return false;
  }
  return true;
};
