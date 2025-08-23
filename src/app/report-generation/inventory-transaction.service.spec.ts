import { InventoryTransactionService } from './inventory-transaction.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { apiConfig } from '../../environments/environment';
import { InventoryTransactionModel } from './inventory-transaction.model';
import { ProductModel } from './product.model';
import { ProductPricingModel } from './product-pricing.model';
import { BusinessEntityModel } from './business-entity.model';

describe('InventoryTransactionService', () => {
  let service: InventoryTransactionService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  const mockProduct: ProductModel = {
    sku: 'SKU1',
    description: 'desc',
    category: 'cat',
    subCategory: 'sub',
    brand: 'brand'
  };

  const mockPricing: ProductPricingModel = {
    quantity: 1,
    costPricePerUnit: 10,
    totalCost: 10
  };

  const mockBusinessEntity: BusinessEntityModel = {
    name: 'Entity',
    location: 'Loc',
    type: 'Shop'
  };

  const mockTransactions: InventoryTransactionModel[] = [
    {
      transactionId: 'T1',
      product: mockProduct,
      productPricing: mockPricing,
      source: mockBusinessEntity,
      destination: { ...mockBusinessEntity, name: 'Dest' },
      transactionDateTime: '2024-05-09T12:00:00Z'
    }
  ];

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get']);
    service = new InventoryTransactionService(httpSpy);
  });

  describe('fetchInventoryTransactions', () => {
    it('should fetch inventory transactions with correct params', (done) => {
      httpSpy.get.and.returnValue(of(mockTransactions));
      service.fetchInventoryTransactions('2024-05-01', '2024-05-09', 'YYYY-MM-DD').subscribe(result => {
        expect(result).toEqual(mockTransactions);
        expect(httpSpy.get).toHaveBeenCalledWith(
          apiConfig.backend_api_url + 'api/reports/inventory-transactions',
          jasmine.objectContaining({
            params: jasmine.any(HttpParams)
          })
        );
        done();
      });
    });

    it('should handle http error', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('fail')));
      service.fetchInventoryTransactions('2024-05-01', '2024-05-09', 'YYYY-MM-DD').subscribe({
        next: () => fail('Should error'),
        error: (err) => {
          expect(err.message).toBe('Failed to fetch inventory transactions.');
          done();
        }
      });
    });

    it('should handle empty result', (done) => {
      httpSpy.get.and.returnValue(of([]));
      service.fetchInventoryTransactions('2024-05-01', '2024-05-09', 'YYYY-MM-DD').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle missing params gracefully', (done) => {
      httpSpy.get.and.returnValue(of([]));
      service.fetchInventoryTransactions('', '', '').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle null params gracefully', (done) => {
      httpSpy.get.and.returnValue(of([]));
      service.fetchInventoryTransactions(null as any, null as any, null as any).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle invalid date/time format', (done) => {
      httpSpy.get.and.returnValue(of([]));
      service.fetchInventoryTransactions('bad-date', 'bad-date', 'bad-format').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('exportReport', () => {
    it('should export report and return blob', (done) => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      httpSpy.get.and.returnValue(of(blob));
      service.exportReport('2024-05-01', '2024-05-09', 'YYYY-MM-DD', 'pdf').subscribe(result => {
        expect(result).toEqual(blob);
        expect(httpSpy.get).toHaveBeenCalledWith(
          apiConfig.backend_api_url + 'api/reports/inventory-transactions/export',
          jasmine.objectContaining({
            params: jasmine.any(HttpParams),
            responseType: 'blob'
          })
        );
        done();
      });
    });

    it('should handle http error on export', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('fail')));
      service.exportReport('2024-05-01', '2024-05-09', 'YYYY-MM-DD', 'pdf').subscribe({
        next: () => fail('Should error'),
        error: (err) => {
          expect(err.message).toBe('Failed to fetch inventory transactions.');
          done();
        }
      });
    });

    it('should handle missing params gracefully', (done) => {
      const blob = new Blob([''], { type: 'application/pdf' });
      httpSpy.get.and.returnValue(of(blob));
      service.exportReport('', '', '', '').subscribe(result => {
        expect(result).toEqual(blob);
        done();
      });
    });

    it('should handle null params for exportReport gracefully', (done) => {
      const blob = new Blob([''], { type: 'application/pdf' });
      httpSpy.get.and.returnValue(of(blob));
      service.exportReport(null as any, null as any, null as any, null as any).subscribe(result => {
        expect(result).toEqual(blob);
        done();
      });
    });
  });
});