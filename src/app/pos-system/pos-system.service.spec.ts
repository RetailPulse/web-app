import { PosSystemService } from './pos-system.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import {
  Transaction,
  SalesDetails,
  SalesTransactionRequest,
  SalesTransactionResponse,
  SuspendedTransactionRequest,
  TaxResult,
  TransientTransaction,
  CreateTransactionResponse,
  PaymentIntentResponse
} from './pos-system.model';
import { TransactionAdapter } from './transaction-adapter';

describe('PosSystemService', () => {
  let service: PosSystemService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['post', 'delete']);
    service = new PosSystemService(httpSpy);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateSalesTax', () => {
    it('should map transaction and post to calculateSalesTax', (done) => {
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
              vendorCode: 'VEND1'
            },
            quantity: 2
          }
        ],
        timestamp: new Date()
      };
      const mapped: SalesDetails[] = TransactionAdapter.mapTransactionToSalesDetails(transaction);
      const taxResult: TaxResult = {
        subTotalAmount: '20.00',
        taxType: 'GST',
        taxRate: '10',
        taxAmount: '2.00',
        totalAmount: '22.00',
        salesDetails: mapped
      };
      httpSpy.post.and.returnValue(of(taxResult));
      service.calculateSalesTax(transaction).subscribe(result => {
        expect(result).toEqual(taxResult);
        expect(httpSpy.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/calculateSalesTax$/),
          mapped
        );
        done();
      });
    });

    it('should handle http error', (done) => {
      const transaction: Transaction = { items: [], timestamp: new Date() };
      httpSpy.post.and.returnValue(throwError(() => new Error('fail')));
      service.calculateSalesTax(transaction).subscribe({
        next: () => fail('Should error'),
        error: (err) => {
          expect(err.message).toBe('Failed to calculate sales tax.');
          done();
        }
      });
    });
  });

  describe('createTransaction', () => {
    it('should post and return CreateTransactionResponse', (done) => {
      const req: SalesTransactionRequest = {
        businessEntityId: 1,
        taxAmount: '1.00',
        totalAmount: '11.00',
        salesDetails: [{ productId: 1, quantity: 2, salesPricePerUnit: '5.00' }]
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
        transactionDateTime: '2024-05-09T12:00:00Z'
      };

      const paymentIntent: PaymentIntentResponse = {
        paymentIntentId: 'pi_123',
        clientSecret: 'secret_abc'
      };

      const resp: CreateTransactionResponse = {
        transaction,
        paymentIntent
      };

      httpSpy.post.and.returnValue(of(resp));
      service.createTransaction(req).subscribe(result => {
        expect(result).toEqual(resp);
        expect(httpSpy.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/createTransaction$/),
          req
        );
        done();
      });
    });

    it('should handle http error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => new Error('fail')));
      service.createTransaction({} as any).subscribe({
        next: () => fail('Should error'),
        error: (err) => {
          expect(err.message).toBe('Failed to create transaction.');
          done();
        }
      });
    });
  });

  describe('suspendTransaction', () => {
    it('should post and return TransientTransaction[]', (done) => {
      const req: SuspendedTransactionRequest = {
        businessEntityId: 1,
        salesDetails: []
      };
      const resp: TransientTransaction[] = [{
        transactionId: 'abc',
        businessEntityId: 1,
        subTotalAmount: '10.00',
        taxType: 'GST',
        taxRate: '10',
        taxAmount: '1.00',
        totalAmount: '11.00',
        salesDetails: [],
        transactionDateTime: '2024-05-09T12:00:00Z'
      }];
      httpSpy.post.and.returnValue(of(resp));
      service.suspendTransaction(req).subscribe(result => {
        expect(result).toEqual(resp);
        expect(httpSpy.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/suspend$/),
          req
        );
        done();
      });
    });

    it('should handle http error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => new Error('fail')));
      service.suspendTransaction({} as any).subscribe({
        next: () => fail('Should error'),
        error: (err) => {
          expect(err.message).toBe('Failed to suspend transaction.');
          done();
        }
      });
    });
  });

  describe('resumeTransaction', () => {
    it('should delete and return TransientTransaction[]', (done) => {
      const resp: TransientTransaction[] = [{
        transactionId: 'abc',
        businessEntityId: 1,
        subTotalAmount: '10.00',
        taxType: 'GST',
        taxRate: '10',
        taxAmount: '1.00',
        totalAmount: '11.00',
        salesDetails: [],
        transactionDateTime: '2024-05-09T12:00:00Z'
      }];
      httpSpy.delete.and.returnValue(of(resp));
      service.resumeTransaction(1, 'abc').subscribe(result => {
        expect(result).toEqual(resp);
        expect(httpSpy.delete).toHaveBeenCalledWith(
          jasmine.stringMatching(/suspended-transactions\/abc$/)
        );
        done();
      });
    });

    it('should handle http error', (done) => {
      httpSpy.delete.and.returnValue(throwError(() => new Error('fail')));
      service.resumeTransaction(1, 'abc').subscribe({
        next: () => fail('Should error'),
        error: (err) => {
          expect(err.message).toBe('Failed to resume transaction.');
          done();
        }
      });
    });
  });

  // Edge: test with empty/null/undefined input for calculateSalesTax
  it('should handle empty items in calculateSalesTax', (done) => {
    const transaction: Transaction = { items: [], timestamp: new Date() };
    httpSpy.post.and.returnValue(of({}));
    service.calculateSalesTax(transaction).subscribe(result => {
      expect(result).toBeDefined();
      done();
    });
  });
});