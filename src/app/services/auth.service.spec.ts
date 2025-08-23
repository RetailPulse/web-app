import { TestBed } from '@angular/core/testing';

import { OAuthService } from 'angular-oauth2-oidc';
import { AuthFacade } from './auth.facade';

describe('AuthService', () => {
  let service: AuthFacade;

  beforeEach(() => {

    let mockOAuthService = jasmine.createSpyObj('OAuthService', [
      'configure',
      'setupAutomaticSilentRefresh',
      'loadDiscoveryDocumentAndLogin',
      'logOut',
      'hasValidAccessToken',
      'getAccessToken',
      'getIdentityClaims',
      'getAccessTokenExpiration'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        { provide: OAuthService, useValue: mockOAuthService }, // Provide the mock OAuthService
      ],
    });
    service = TestBed.inject(AuthFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
