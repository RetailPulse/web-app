import { TestBed } from '@angular/core/testing';

import { OAuthService } from 'angular-oauth2-oidc';
import {OAuthAuthenticationService} from './oauth-authentication.service';

describe('AuthService', () => {
  let service: OAuthAuthenticationService;

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
        OAuthAuthenticationService,
        { provide: OAuthService, useValue: mockOAuthService }, // Provide the mock OAuthService
      ],
    });
    service = TestBed.inject(OAuthAuthenticationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
