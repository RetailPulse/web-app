import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { createMockAuthService } from '../mock/auth.service.mock';
import { ConfirmationService } from 'primeng/api';

import { ProfileComponent } from './profile.component';
import {AuthFacade} from '../services/auth.facade';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    // Mock OauthAuthenticationService
    const mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: mockAuthService }, // Mock OauthAuthenticationService
        ConfirmationService,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
