import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { createMockAuthService } from '../mock/auth.service.mock';
import { ConfirmationService } from 'primeng/api'; 

import { BusinessEntityManagementComponent } from './business-entity-management.component';

describe('BusinessEntityManagementComponent', () => {
  let component: BusinessEntityManagementComponent;
  let fixture: ComponentFixture<BusinessEntityManagementComponent>;

  beforeEach(async () => {
    // Mock AuthService
    const mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [BusinessEntityManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService }, // Mock AuthService
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
