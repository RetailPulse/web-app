import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from '../app.routes';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { createMockAuthService } from '../mock/auth.service.mock';
import { ConfirmationService } from 'primeng/api';

import { SidebarComponent } from './sidebar.component';
import {AuthFacade} from '../services/auth.facade';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    // Mock OauthAuthenticationService
    const mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        provideAnimations(),
        provideAnimationsAsync(),
        { provide: AuthFacade, useValue: mockAuthService }, // Mock OauthAuthenticationService
        ConfirmationService,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
