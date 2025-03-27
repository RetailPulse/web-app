import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {inject} from '@angular/core';

function hasRequiredRole(userRoles: Array<string>, expectedRoles: Array<string>): boolean {
  return expectedRoles.some(role => userRoles.includes(role));
}

export const authGuard: CanActivateFn = (route, state) => {
  
  // Inject the Services
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as Array<string>;
  const userRoles = authService.getUserRole();
  console.log('User Roles: ' + userRoles);
  console.log('Expected Roles: ' + expectedRoles);

  if (authService.isAuthenticated && hasRequiredRole(userRoles, expectedRoles)) {      
    return true;
  } else {
    // Redirect to the login page
    // sessionStorage.setItem('errorMessages', 'You are not authorized to access this page.');
    router.navigate(['/login']);
    return false;
  }
};
