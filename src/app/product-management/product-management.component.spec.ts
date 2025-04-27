import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { OauthAuthenticationService } from '../services/oauth-authentication.service';

import { createMockAuthService } from '../mock/auth.service.mock';
import { ConfirmationService } from 'primeng/api';

import { ProductManagementComponent } from './product-management.component';
import { HttpClientModule } from '@angular/common/http';
import {BusinessEntityService} from '../business-entity-management/business-entity.service';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [HttpClientModule], // Add this
    providers: [BusinessEntityService] // Ensure this service is included
  }).compileComponents();
});

describe('ProductManagementComponent', () => {
  let component: ProductManagementComponent;
  let fixture: ComponentFixture<ProductManagementComponent>;

  beforeEach(async () => {
    // Mock OauthAuthenticationService
    const mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [ProductManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OauthAuthenticationService, useValue: mockAuthService }, // Mock OauthAuthenticationService
        ConfirmationService,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

