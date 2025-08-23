import { OAuthAuthenticationService, DecodedToken } from './oauth-authentication.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

describe('OAuthAuthenticationService', () => {
  let service: OAuthAuthenticationService;
  let mockOAuthService: jasmine.SpyObj<OAuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let originalEnv: any;

  beforeEach(() => {
    mockOAuthService = jasmine.createSpyObj('OAuthService', [
      'configure',
      'setupAutomaticSilentRefresh',
      'loadDiscoveryDocumentAndTryLogin',
      'hasValidAccessToken',
      'getAccessToken',
      'initCodeFlow',
      'logOut'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Save and patch environment for each test
    originalEnv = { ...environment };
    environment.authEnabled = true;
    environment.devModeRole = 'ADMIN';
    environment.devModeUser = 'devuser';

    service = new OAuthAuthenticationService(mockRouter, mockOAuthService);
  });

  afterEach(() => {
    Object.assign(environment, originalEnv);
  });

  describe('initializeAuth', () => {
    it('should resolve immediately if auth is disabled', async () => {
      environment.authEnabled = false;
      const result = await service.initializeAuth();
      expect(result).toBeUndefined();
    });

    it('should navigate to /login if no valid token', async () => {
      mockOAuthService.loadDiscoveryDocumentAndTryLogin.and.returnValue(Promise.resolve(true));
      mockOAuthService.hasValidAccessToken.and.returnValue(false);
      await service.initializeAuth();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should log token if valid token exists', async () => {
      mockOAuthService.loadDiscoveryDocumentAndTryLogin.and.returnValue(Promise.resolve(true));
      mockOAuthService.hasValidAccessToken.and.returnValue(true);
      spyOn(console, 'log');
      await service.initializeAuth();
      expect(console.log).toHaveBeenCalledWith('Token: \r\n' + service.accessToken);
    });

    it('should handle error and navigate to /login', async () => {
      mockOAuthService.loadDiscoveryDocumentAndTryLogin.and.returnValue(Promise.reject('fail'));
      spyOn(console, 'log');
      await service.initializeAuth();
      expect(console.log).toHaveBeenCalledWith('Error during OAuth configuration', 'fail');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('login', () => {
    it('should call initCodeFlow if auth enabled', () => {
      environment.authEnabled = true;
      service.login();
      expect(mockOAuthService.initCodeFlow).toHaveBeenCalled();
    });

    it('should not call initCodeFlow if auth disabled', () => {
      environment.authEnabled = false;
      spyOn(console, 'log');
      service.login();
      expect(mockOAuthService.initCodeFlow).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Authentication is disabled');
    });
  });

  describe('logout', () => {
    it('should call logOut and navigate to /login if auth enabled', () => {
      environment.authEnabled = true;
      service.logout();
      expect(mockOAuthService.logOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not call logOut if auth disabled', () => {
      environment.authEnabled = false;
      spyOn(console, 'log');
      service.logout();
      expect(mockOAuthService.logOut).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Authentication is disabled');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if auth disabled', () => {
      environment.authEnabled = false;
      spyOn(console, 'log');
      expect(service.isAuthenticated).toBeTrue();
      expect(console.log).toHaveBeenCalledWith('Authentication is disabled');
    });

    it('should return hasValidAccessToken if auth enabled', () => {
      environment.authEnabled = true;
      mockOAuthService.hasValidAccessToken.and.returnValue(true);
      expect(service.isAuthenticated).toBeTrue();
      mockOAuthService.hasValidAccessToken.and.returnValue(false);
      expect(service.isAuthenticated).toBeFalse();
    });
  });

  describe('getUserRole', () => {
    it('should return devModeRole if auth disabled', () => {
      environment.authEnabled = false;
      environment.devModeRole = 'ADMIN';
      expect(service.getUserRole()).toEqual(['ADMIN']);
    });

    it('should return UNAUTHORIZED if no accessToken', () => {
      spyOnProperty(service, 'accessToken').and.returnValue('');
      expect(service.getUserRole()).toEqual(['UNAUTHORIZED']);
    });

    it('should return UNAUTHORIZED if token decode fails', () => {
      spyOnProperty(service, 'accessToken').and.returnValue('badtoken');
      (service as any).jwtDecode = () => { throw new Error('decode error'); };
      spyOn(console, 'error');
      expect(service.getUserRole()).toEqual(['UNAUTHORIZED']);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUsername', () => {
    it('should return devModeUser if auth disabled', () => {
      environment.authEnabled = false;
      environment.devModeUser = 'devuser';
      expect(service.getUsername()).toBe('devuser');
    });

    it('should return UNAUTHORIZED if no accessToken', () => {
      spyOnProperty(service, 'accessToken').and.returnValue('');
      expect(service.getUsername()).toBe('UNAUTHORIZED');
    });
  });

  describe('accessToken', () => {
    it('should return dummy-access-token if auth disabled', () => {
      environment.authEnabled = false;
      expect(service.accessToken).toBe('dummy-access-token');
    });

    it('should return token from oauthService if auth enabled', () => {
      environment.authEnabled = true;
      mockOAuthService.getAccessToken.and.returnValue('real-token');
      expect(service.accessToken).toBe('real-token');
    });
  });

  describe('getDecodedToken', () => {
    it('should return dummy token if auth disabled', () => {
      environment.authEnabled = false;
      environment.devModeRole = 'ADMIN';
      environment.devModeUser = 'devuser';
      const decoded = service.getDecodedToken();
      expect(decoded.sub).toBe('devuser');
    });
  });
});