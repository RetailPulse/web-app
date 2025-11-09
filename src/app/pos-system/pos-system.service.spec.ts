// pos-system.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { PosSystemService } from './pos-system.service';
import {
  Transaction,
  SalesDetails,
  SalesTransactionRequest,
  SalesTransactionResponse,
  SuspendedTransactionRequest,
  TaxResult,
  TransientTransaction,
  CreateTransactionResponse,
  PaymentIntentResponse,
} from './pos-system.model';
import { TransactionAdapter } from './transaction-adapter';
import { ConfigService } from '../services/config.service';

describe('PosSystemService', () => {
  let service: PosSystemService;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  let configSpy: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    // Silence console noise that your service intentionally emits in error paths.
    spyOn(console, 'error').and.stub();
    spyOn(console, 'log').and.stub();

    httpSpy = jasmine.createSpyObj('HttpClient', ['post', 'delete', 'get']);

    // Ensure the base URL ends with a trailing slash so concatenations work as expected.
    configSpy = jasmine.createSpyObj('ConfigService', [], {
      apiConfig: { sales_api_url: 'http://localhost/' },
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpSpy },
        { provide: ConfigService, useValue: configSpy },
        PosSystemService,
      ],
    });

    service = TestBed.inject(PosSystemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateSalesTax', () => {
    it('should map transaction and POST to /calculateSalesTax', (done) => {
      const transaction: Transaction = {
        items: [
          {
            product: {
              id: 1,
              sku: 'SKU001',
              brand: 'BrandA',
              category: 'CatA',
              subcategory: 'SubA',
              description: 'desc',
              rrp: 10,
              active: true,
              barcode: '1234567890',
              origin: 'CountryA',
              uom: 'pcs',
              vendorCode: 'VEND1',
            },
            quantity: 2,
          },
        ],
        timestamp: new Date(),
      };

      const mapped: SalesDetails[] =
        TransactionAdapter.mapTransactionToSalesDetails(transaction);

      const taxResult: TaxResult = {
        subTotalAmount: '20.00',
        taxType: 'GST',
        taxRate: '10',
        taxAmount: '2.00',
        totalAmount: '22.00',
        salesDetails: mapped,
      };

      httpSpy.post.and.returnValue(of(taxResult));

      service.calculateSalesTax(transaction).subscribe({
        next: (result) => {
          expect(result).toEqual(taxResult);
          expect(httpSpy.post).toHaveBeenCalledTimes(1);
          expect(httpSpy.post.calls.argsFor(0)[0]).toMatch(/\/api\/sales\/calculateSalesTax$/);
          expect(httpSpy.post.calls.argsFor(0)[1]).toEqual(mapped);
          done();
        },
        error: (err) => {
          fail(`Should not error: ${err?.message}`);
          done();
        },
      });
    });

    it('should handle http error and rethrow friendly message', (done) => {
      const transaction: Transaction = { items: [], timestamp: new Date() };
      httpSpy.post.and.returnValue(throwError(() => new Error('fail')));

      service.calculateSalesTax(transaction).subscribe({
        next: () => {
          fail('Should error');
          done();
        },
        error: (err) => {
          expect(err.message).toBe('Failed to calculate sales tax.');
          done();
        },
      });
    });
  });

  describe('createTransaction', () => {
    it('should POST and return CreateTransactionResponse', (done) => {
      const req: SalesTransactionRequest = {
        businessEntityId: 1,
        taxAmount: '1.00',
        totalAmount: '11.00',
        salesDetails: [{ productId: 1, quantity: 2, salesPricePerUnit: '5.00' }],
      };

      const transaction: SalesTransactionResponse = {
        salesTransactionId: 1,
        businessEntityId: 1,
        subTotalAmount: '10.00',
        taxType: 'GST',
        taxRate: '10',
        taxAmount: '1.00',
        totalAmount: '11.00',
        salesDetails: req.salesDetails,
        transactionDateTime: '2024-05-09T12:00:00Z',
      };

      const paymentIntent: PaymentIntentResponse = {
        clientSecret: 'secret_abc',
        paymentId: 1001,
        paymentIntentId: 'pi_123',
        paymentEventDate: '2025-10-31T12:00:00Z',
      };

      const resp: CreateTransactionResponse = {
        transaction,
        paymentIntent,
      };

      httpSpy.post.and.returnValue(of(resp));

      service.createTransaction(req).subscribe({
        next: (result) => {
          expect(result).toEqual(resp);
          expect(httpSpy.post).toHaveBeenCalledTimes(1);
          expect(httpSpy.post.calls.argsFor(0)[0]).toMatch(/\/api\/sales\/createTransaction$/);
          expect(httpSpy.post.calls.argsFor(0)[1]).toEqual(req);
          done();
        },
        error: (err) => {
          fail(`Should not error: ${err?.message}`);
          done();
        },
      });
    });

    it('should handle http error and rethrow friendly message', (done) => {
      httpSpy.post.and.returnValue(throwError(() => new Error('fail')));

      // Cast as any to avoid building a verbose valid request for the error path
      service.createTransaction({} as any).subscribe({
        next: () => {
          fail('Should error');
          done();
        },
        error: (err) => {
          expect(err.message).toBe('Failed to create transaction.');
          done();
        },
      });
    });
  });

  describe('suspendTransaction', () => {
    it('should POST and return TransientTransaction[]', (done) => {
      const req: SuspendedTransactionRequest = {
        businessEntityId: 1,
        salesDetails: [],
      };

      const resp: TransientTransaction[] = [
        {
          transactionId: 'abc',
          businessEntityId: 1,
          subTotalAmount: '10.00',
          taxType: 'GST',
          taxRate: '10',
          taxAmount: '1.00',
          totalAmount: '11.00',
          salesDetails: [],
          transactionDateTime: '2024-05-09T12:00:00Z',
        },
      ];

      httpSpy.post.and.returnValue(of(resp));

      service.suspendTransaction(req).subscribe({
        next: (result) => {
          expect(result).toEqual(resp);
          expect(httpSpy.post).toHaveBeenCalledTimes(1);
          expect(httpSpy.post.calls.argsFor(0)[0]).toMatch(/\/api\/sales\/suspend$/);
          expect(httpSpy.post.calls.argsFor(0)[1]).toEqual(req);
          done();
        },
        error: (err) => {
          fail(`Should not error: ${err?.message}`);
          done();
        },
      });
    });

    it('should handle http error and rethrow friendly message', (done) => {
      httpSpy.post.and.returnValue(throwError(() => new Error('fail')));

      service.suspendTransaction({} as any).subscribe({
        next: () => {
          fail('Should error');
          done();
        },
        error: (err) => {
          expect(err.message).toBe('Failed to suspend transaction.');
          done();
        },
      });
    });
  });

  describe('resumeTransaction', () => {
    it('should DELETE and return TransientTransaction[]', (done) => {
      const resp: TransientTransaction[] = [
        {
          transactionId: 'abc',
          businessEntityId: 1,
          subTotalAmount: '10.00',
          taxType: 'GST',
          taxRate: '10',
          taxAmount: '1.00',
          totalAmount: '11.00',
          salesDetails: [],
          transactionDateTime: '2024-05-09T12:00:00Z',
        },
      ];

      httpSpy.delete.and.returnValue(of(resp));

      service.resumeTransaction(1, 'abc').subscribe({
        next: (result) => {
          expect(result).toEqual(resp);
          expect(httpSpy.delete).toHaveBeenCalledTimes(1);
          expect(httpSpy.delete.calls.argsFor(0)[0]).toMatch(
            /\/api\/sales\/1\/suspended-transactions\/abc$/
          );
          done();
        },
        error: (err) => {
          fail(`Should not error: ${err?.message}`);
          done();
        },
      });
    });

    it('should handle http error and rethrow friendly message', (done) => {
      httpSpy.delete.and.returnValue(throwError(() => new Error('fail')));

      service.resumeTransaction(1, 'abc').subscribe({
        next: () => {
          fail('Should error');
          done();
        },
        error: (err) => {
          expect(err.message).toBe('Failed to resume transaction.');
          done();
        },
      });
    });
  });

  describe('getPaymentStatus', () => {
    it('should GET and return status object', (done) => {
      const mock = { status: 'succeeded' };
      httpSpy.get.and.returnValue(of(mock));

      service.getPaymentStatus(42).subscribe({
        next: (result) => {
          expect(result).toEqual(mock);
          expect(httpSpy.get).toHaveBeenCalledTimes(1);
          expect(httpSpy.get.calls.argsFor(0)[0]).toMatch(/\/api\/sales\/transactionStatus\/42$/);
          done();
        },
        error: (err) => {
          fail(`Should not error: ${err?.message}`);
          done();
        },
      });
    });

    it('should handle http error and rethrow friendly message', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getPaymentStatus(42).subscribe({
        next: () => {
          fail('Should error');
          done();
        },
        error: (err) => {
          expect(err.message).toBe('Failed to get payment status.');
          done();
        },
      });
    });
  });

  // Edge: empty items (maps to empty salesDetails and still posts)
  it('calculateSalesTax should handle empty items gracefully', (done) => {
    const transaction: Transaction = { items: [], timestamp: new Date() };
    const mapped: SalesDetails[] =
      TransactionAdapter.mapTransactionToSalesDetails(transaction); // should be []

    const taxResult: Partial<TaxResult> = { salesDetails: mapped };
    httpSpy.post.and.returnValue(of(taxResult as TaxResult));

    service.calculateSalesTax(transaction).subscribe({
      next: (result) => {
        expect(result).toEqual(taxResult as TaxResult);
        expect(Array.isArray((result as any).salesDetails)).toBeTrue();
        expect((result as any).salesDetails.length).toBe(0);
        done();
      },
      error: (err) => {
        fail(`Should not error: ${err?.message}`);
        done();
      },
    });
  });
});
