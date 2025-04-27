import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { createMockAuthService } from '../mock/auth.service.mock';
import { ConfirmationService } from 'primeng/api';

import { LogoutButtonComponent } from './logout-button.component';
import {AuthFacade} from '../services/auth.facade';

describe('LogoutButtonComponent', () => {
  let component: LogoutButtonComponent;
  let fixture: ComponentFixture<LogoutButtonComponent>;

  beforeEach(async () => {
    // Mock OauthAuthenticationService
    const mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [LogoutButtonComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: mockAuthService }, // Mock OauthAuthenticationService
        ConfirmationService,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoutButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
