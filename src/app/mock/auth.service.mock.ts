// mocks/auth-service.mock.ts
import { AuthService } from '../services/auth.service';

export const createMockAuthService = (): jasmine.SpyObj<AuthService> => {

  const mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
    'login',
    'logout',
    'initializeAuth',
    'isAuthenticated',    
    'getUserRole',
    'getUsername',
    'accessToken',
    'getDecodedToken',
  ]);

  // Add properties for isAuthenticated and accessToken
  mockAuthService.initializeAuth.and.returnValue(Promise.resolve());    
  mockAuthService.getUserRole.and.returnValue(['ADMIN']);
  mockAuthService.getUsername.and.returnValue('superadmin');
  mockAuthService.getDecodedToken.and.returnValue({
          roles: ['ADMIN'],
          sub: 'superadmin',
        });

  Object.defineProperty(mockAuthService, 'isAuthenticated', {
    value: true, // Set the value to `true`
    writable: false, // Make it read-only
    configurable: true, // Allow redefining if needed
  });

  Object.defineProperty(mockAuthService, 'accessToken', {
    value: 'dummy-access-token', // Set the dummy token value
    writable: false, // Make it read-only
    configurable: true, // Allow redefining if needed
  });
  
  return mockAuthService;
};