import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { createMockAuthService } from '../mock/auth.service.mock';
import { ConfirmationService } from 'primeng/api';

import { BusinessEntityManagementComponent } from './business-entity-management.component';
import {AuthFacade} from '../services/auth.facade';

describe('BusinessEntityManagementComponent', () => {
  let component: BusinessEntityManagementComponent;
  let fixture: ComponentFixture<BusinessEntityManagementComponent>;

  beforeEach(async () => {
    // Mock OauthAuthenticationService
    const mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [BusinessEntityManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: mockAuthService }, // Mock OauthAuthenticationService
        ConfirmationService,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessEntityManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
