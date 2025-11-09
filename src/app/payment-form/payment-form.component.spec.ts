import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentFormComponent } from './payment-form.component';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ConfigService } from '../services/config.service';

// ✅ Mock ConfigService
const mockConfigService = {
  environment: { stripePublicKey: 'pk_test_12345' },
  apiConfig: { payments_api_url: 'http://localhost:3000/' }
};

// ✅ Mock HttpClient (fake backend)
const mockHttpClient = {
  post: jasmine.createSpy('post').and.returnValue(of({
    clientSecret: 'secret_abc',
    paymentIntentId: 'pi_123'
  })),
  get: jasmine.createSpy('get').and.returnValue(of({ status: 'SUCCEEDED' }))
};

// ✅ Mock Stripe (works with Jasmine)
function mockLoadStripe() {
  return Promise.resolve({
    elements: () => ({
      create: () => ({
        mount: jasmine.createSpy('mount'),
        unmount: jasmine.createSpy('unmount')
      }),
      submit: jasmine.createSpy('submit').and.resolveTo({}),
    }),
    confirmPayment: jasmine.createSpy('confirmPayment').and.resolveTo({}),
  });
}

// @ts-ignore  Replace global loadStripe with mock
(globalThis as any).loadStripe = mockLoadStripe;

describe('PaymentFormComponent', () => {
  let component: PaymentFormComponent;
  let fixture: ComponentFixture<PaymentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
