import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { createMockAuthService } from '../mock/auth.service.mock';
import { authGuard } from './auth.guard';
import { AuthFacade } from '../services/auth.facade';

describe('authGuard', () => {
  let executeGuard: authGuard;

  beforeEach(() => {
    const mockAuthService = createMockAuthService();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: mockAuthService }, // Mock OauthAuthenticationService
        authGuard, // Provide the mock OAuthService
      ],
    });

    executeGuard = TestBed.inject(authGuard);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
}); 
