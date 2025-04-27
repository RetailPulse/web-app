// mocks/auth-service.mock.ts
import {AuthFacade} from '../services/auth.facade';

export const createMockAuthService = (): jasmine.SpyObj<AuthFacade> => {

  const mockAuthService = jasmine.createSpyObj<AuthFacade>('AuthFacade', [
    'initialize',
    'login',
    'logout',
    'isAuthenticated',
    'getUserRole',
    'getUsername',
    'getAccessToken',
    'getDecodedToken',
  ]);

  // Add properties for isAuthenticated and accessToken
  mockAuthService.initialize.and.returnValue(Promise.resolve());
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
