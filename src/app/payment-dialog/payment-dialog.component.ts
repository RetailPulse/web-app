import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CreateTransactionResponse, SalesTransactionRequest} from '../pos-system/pos-system.model';
import {StripeCardElement} from '@stripe/stripe-js';
import {
  catchError,
  finalize,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
  timer
} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef} from '@angular/material/dialog';
import {StripeService} from '../pos-system/stripe.service';
import {PosSystemService} from '../pos-system/pos-system.service';
import {CurrencyPipe, NgIf} from '@angular/common';

export interface PaymentDialogData {
  // Either pass pre-created PaymentIntent details OR sales transaction request to create inside dialog.
  // If clientSecret/paymentIntentId present, dialog will skip createTransaction and use them directly.
  clientSecret?: string;
  paymentIntentId?: string;
  salesTransactionRequest?: SalesTransactionRequest;
}

@Component({
  selector: 'app-payment-dialog',
  imports: [
    MatDialogContent,
    MatDialogActions,
    CurrencyPipe,
    NgIf
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.css'
})
export class PaymentDialogComponent implements OnInit, OnDestroy {
  @ViewChild('cardElement', { static: true }) cardElementRef!: ElementRef<HTMLElement>;

  stripe: any;
  card?: StripeCardElement;
  cardMounted = false;

  processing = false;
  errorMessage: string | null = null;
  status: string | null = null;
  success = false;

  private destroy$ = new Subject<void>();
  private pollCancel$ = new Subject<void>();

  // If the dialog created the transaction, we keep a reference to the response
  private createTransactionResponse?: CreateTransactionResponse;

  constructor(
    private dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private stripeService: StripeService,
    private posService: PosSystemService
  ) {}

  async ngOnInit() {
    // load stripe + elements
    this.stripe = await this.stripeService.getStripe();
    const elements = await this.stripeService.createElements();
    if (!elements) {
      this.errorMessage = 'Payment system failed to initialize';
      return;
    }

    // create & mount the card element (container is always present in dialog template)
    this.card = elements.create('card', {
      style: {
        base: { fontSize: '16px', color: '#32325d' }
      }
    });

    try {
      this.card.mount(this.cardElementRef.nativeElement);
      this.cardMounted = true;
      this.card.on('change', (ev: any) => {
        this.errorMessage = ev.error ? ev.error.message ?? null : null;
      });
    } catch (err) {
      console.error('Stripe card mount failed', err);
      this.errorMessage = 'Unable to initialize card input';
      this.cardMounted = false;
    }

    // If the dialog was given a clientSecret already, we don't create a transaction.
    // Otherwise we wait for the parent to call checkout OR we can create it here
    // if data.salesTransactionRequest is provided. We'll not auto-create unless data.salesTransactionRequest exists.
    if (this.data.salesTransactionRequest) {
      // Option: auto-create transaction as soon as dialog opens
      this.processing = true;
      this.posService.createTransaction(this.data.salesTransactionRequest)
        .pipe(
          tap(resp => this.createTransactionResponse = resp),
          finalize(() => this.processing = false),
          catchError(err => {
            this.errorMessage = 'Failed to create transaction';
            return throwError(() => err);
          })
        ).subscribe({
        next: () => {
          // success — ready for user to click Pay
        },
        error: (err) => {
          console.error('createTransaction in dialog failed', err);
        }
      });
    }
  }

  // Called when user clicks "Pay"
  pay() {
    // guard
    if (!this.cardMounted || !this.card || !this.stripe) {
      this.errorMessage = 'Payment system not ready. Try again.';
      return;
    }

    // Determine clientSecret/paymentIntentId from provided data OR from createTransactionResponse
    const clientSecret = this.data.clientSecret ?? this.createTransactionResponse?.paymentIntent?.clientSecret;
    const paymentIntentId = this.data.paymentIntentId ?? this.createTransactionResponse?.paymentIntent?.paymentIntentId;

    if (!clientSecret || !paymentIntentId) {
      this.errorMessage = 'Payment initialization missing. Please retry.';
      return;
    }

    this.processing = true;
    this.errorMessage = null;
    this.status = 'confirming';

    // confirmCardPayment returns a promise -> wrap with from()
    from(this.stripe.confirmCardPayment(clientSecret, { payment_method: { card: this.card } }))
      .pipe(
        switchMap((result: any) => {
          if (result.error) {
            this.processing = false;
            this.errorMessage = result.error.message ?? 'Payment failed';
            return throwError(() => result.error);
          }
          // start polling backend for final status
          this.status = 'polling';
          return this.startPollingPaymentStatus(paymentIntentId);
        }),
        finalize(() => {
          // keep as fallback; polling / success handlers will set processing=false as needed
          this.processing = false;
        })
      ).subscribe({
      next: (finalStatus: string) => {
        if (finalStatus === 'succeeded') {
          this.success = true;
          this.status = finalStatus;
          // Close dialog and return success data
          this.dialogRef.close({ success: true, status: finalStatus, transaction: this.createTransactionResponse });
        } else {
          // other statuses already handled by startPollingPaymentStatus to throw; defensive log
          this.dialogRef.close({ success: false, status: finalStatus });
        }
      },
      error: (err) => {
        console.error('Payment flow error', err);
        this.processing = false;
        // keep dialog open to allow retry or Cancel
      }
    });
  }

  // Poll backend for payment status. Returns Observable that resolves when final status reached or errors.
  private startPollingPaymentStatus(paymentIntentId: string): Observable<string> {
    const intervals = [0, 2000, 2000, 3000, 5000, 8000]; // quick backoff
    let attempt = 0;

    const check$ = () => this.posService.getPaymentStatus(paymentIntentId).pipe(
      map((r: any) => r.status),
      catchError(err => {
        console.error('poll error', err);
        return of('unknown');
      })
    );

    // create sequential polling using timer + check
    return new Observable<string>(subscriber => {
      const doCheck = () => {
        const delayMs = intervals[Math.min(attempt, intervals.length - 1)];
        const sub = timer(delayMs).pipe(switchMap(() => check$())).subscribe(status => {
          attempt++;
          this.status = status;
          if (status === 'succeeded') {
            subscriber.next(status);
            subscriber.complete();
          } else if (['requires_payment_method', 'canceled', 'failed'].includes(status)) {
            this.errorMessage = `Payment status: ${status}`;
            subscriber.error(new Error(`Payment ended with status ${status}`));
          } else {
            if (attempt >= 12) { // safety cap
              subscriber.error(new Error('Payment verification timed out'));
            } else {
              doCheck(); // schedule next
            }
          }
        }, err => subscriber.error(err));
        subscriber.add(() => sub.unsubscribe());
      };

      // start immediately
      doCheck();

      // teardown
      return () => {
        // nothing special here; any active sub will be unsubscribed by subscriber.add
      };
    }).pipe(
      takeUntil(this.destroy$)
    );
  }

  cancel() {
    // user cancels dialog
    this.pollCancel$.next();
    this.dialogRef.close({ success: false, cancelled: true });
  }

  ngOnDestroy() {
    // unmount stripe element
    try {
      if (this.card && this.cardMounted) {
        this.card.unmount();
      }
    } catch (e) {
      console.warn('Card unmount failed', e);
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.pollCancel$.next();
    this.pollCancel$.complete();
  }
}
