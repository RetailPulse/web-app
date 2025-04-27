// role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OAuthAuthenticationService } from '../services/oauth-authentication.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(OAuthAuthenticationService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];

  if (!authService.getUserRole()) {
    router.navigate(['/access-denied']);
    return false;
  }
  return true;

};
