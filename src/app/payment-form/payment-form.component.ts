import {
  Component,
  HostListener,
  signal,
  inject,
  computed,
  Output,
  EventEmitter
} from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, interval, Subscription } from 'rxjs';
import { ConfigService } from '../services/config.service';

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

interface PaymentData {
  amount: number;
  currency: string;
  customer_email: string;
  transaction_id: string;
  description: string;
  payment_type: string;
}

@Component({
  selector: 'app-payment-form',
  imports: [],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css'
})
export class PaymentFormComponent {
  @Output() closed = new EventEmitter<void>();

  loading = signal(false);
  confirming = signal(false);
  error = signal<string | null>(null);
  status = signal<'idle' | 'processing' | 'success' | 'failed'>('idle');

  amountCents = signal(0);
  currency = signal('SGD');

  payLabel = computed(() =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.currency()
    }).format(this.amountCents())
  );

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement?: StripePaymentElement;
  private clientSecret = '';
  private paymentIntentId = '';
  private pollSubscription?: Subscription;

  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly stripePublicKey = this.config.environment.stripePublicKey;
  private readonly paymentsApiUrl = this.config.apiConfig.payments_api_url + 'api/payments';

  constructor() {
    this.initPayment();
  }

  private async initPayment(): Promise<void> {
    try {
      if (this.paymentElement) return;

      const state = (history.state ?? {}) as Partial<PaymentData>;

      const body: PaymentData = {
        amount: state.amount ?? 2000,
        currency: state.currency ?? 'SGD',
        customer_email: state.customer_email ?? 'aungtuntun@gmail.com',
        transaction_id: state.transaction_id ?? '1234567890',
        description: state.description ?? 'Test Payment',
        payment_type: state.payment_type ?? 'card'
      };

      this.amountCents.set(body.amount);
      this.currency.set(body.currency);
      this.loading.set(true);

      const response = await firstValueFrom(
        this.http.post<PaymentIntentResponse>(`${this.paymentsApiUrl}/create-payment-intent`, body)
      );

      this.clientSecret = response.clientSecret;
      this.paymentIntentId = response.paymentIntentId;

      const stripe = await loadStripe(this.stripePublicKey);
      if (!stripe) {
        this.error.set('Failed to load Stripe Service.');
        this.loading.set(false);
        return;
      }

      this.stripe = stripe;
      this.elements = this.stripe.elements({ clientSecret: this.clientSecret });
      this.paymentElement = this.elements.create('payment', { layout: 'accordion' });

      this.loading.set(false);
      setTimeout(() => {
        const container = document.querySelector('#payment-element');
        if (container && this.paymentElement) {
          this.paymentElement.mount('#payment-element');
        }
      });
    } catch (error: any) {
      this.error.set(error?.message ?? 'Failed to initialize payment.');
    } finally {
      this.loading.set(false);
    }
  }

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.confirming.set(true);
    this.error.set(null);
    this.status.set('processing');

    try {
      const { error: submitError } = await this.elements.submit();
      if (submitError) {
        this.error.set(submitError.message ?? 'Payment details invalid.');
        this.confirming.set(false);
        return;
      }

      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        clientSecret: this.clientSecret,
        redirect: 'if_required'
      });

      if (error) {
        this.error.set(error.message ?? 'Payment confirmation failed.');
        return;
      }

      this.startPollingPaymentStatus();
    } catch (error: any) {
      this.error.set(error?.message ?? 'Payment confirmation failed.');
      this.status.set('failed');
    } finally {
      this.confirming.set(false);
    }
  }

  async cancelPayment(): Promise<void> {
    if (!this.stripe || !this.elements || !this.clientSecret) return;

    if (this.paymentIntentId) {
      this.http
        .post(`${this.paymentsApiUrl}/cancel-payment/${this.paymentIntentId}`, {
          client_secret: this.clientSecret
        })
        .subscribe();
    }

    this.close();
  }

  private startPollingPaymentStatus(): void {
    this.pollSubscription = interval(2000).subscribe(async () => {
      try {
        const result = await firstValueFrom(
          this.http.get<{ status: string }>(
            `${this.paymentsApiUrl}/payment-status/${this.paymentIntentId}`
          )
        );

        if (result.status === 'SUCCEEDED') {
          this.status.set('success');
          this.stopPollingPaymentStatus();
          setTimeout(() => this.close(), 2000);
        } else if (result.status === 'FAILED' || result.status === 'CANCELED') {
          this.status.set('failed');
          this.stopPollingPaymentStatus();
        }
      } catch (error) {
        console.error('Polling failed: ', error);
      }
    });
  }

  private stopPollingPaymentStatus(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  close(): void {
    this.stopPollingPaymentStatus();
    if (this.paymentElement) {
      this.paymentElement.unmount();
      this.paymentElement = undefined;
    }
    this.closed.emit();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event) {
    this.close();
  }

  ngOnDestroy(): void {
    this.close();
  }
}