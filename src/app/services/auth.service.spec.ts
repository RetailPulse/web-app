import { TestBed } from '@angular/core/testing';

import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  
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
        AuthService,
        { provide: OAuthService, useValue: mockOAuthService }, // Provide the mock OAuthService        
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
