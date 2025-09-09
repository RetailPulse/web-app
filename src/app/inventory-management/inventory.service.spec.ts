import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InventoryService } from './inventory.service';
import { InventoryTransaction } from '../inventory-modal/inventory-modal.model';
import { Inventory } from './inventory.model';
import { apiConfig } from '../../environments/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

  const inventoryTransactionApiUrl = `${apiConfig.inventory_api_url}api/inventoryTransaction`;
  const inventoryApiUrl = `${apiConfig.inventory_api_url}api/inventory`;

  const mockTransactions: InventoryTransaction[] = [
    { productId: 1, quantity: 10, source: 100, destination: 200 },
    { productId: 2, quantity: 5, source: 101, destination: 201 }
  ];

  const mockInventory: Inventory[] = [
    { productId: 1, businessEntityId: 100, quantity: 50, totalCostPrice: 500 },
    { productId: 2, businessEntityId: 101, quantity: 20, totalCostPrice: 200 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InventoryService
      ]
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getInventoryTransaction', () => {
    it('should GET inventory transactions', () => {
      service.getInventoryTransaction().subscribe(transactions => {
        expect(transactions).toEqual(mockTransactions);
      });
      const req = httpMock.expectOne(inventoryTransactionApiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockTransactions);
    });

    it('should return empty array if no transactions', () => {
      service.getInventoryTransaction().subscribe(transactions => {
        expect(transactions).toEqual([]);
      });
      const req = httpMock.expectOne(inventoryTransactionApiUrl);
      req.flush([]);
    });

    it('should handle null response as empty array', () => {
      service.getInventoryTransaction().subscribe(transactions => {
        expect(transactions).toEqual([]);
      });
      const req = httpMock.expectOne(inventoryTransactionApiUrl);
    });

    it('should handle error response', () => {
      service.getInventoryTransaction().subscribe({
        next: () => fail('should error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });
      const req = httpMock.expectOne(inventoryTransactionApiUrl);
      req.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle network error', () => {
      service.getInventoryTransaction().subscribe({
        next: () => fail('should error'),
        error: (err) => {
          expect(err.status).toBe(0);
        }
      });
      const req = httpMock.expectOne(inventoryTransactionApiUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('getInventoryByBusinessEntity', () => {
    it('should GET inventory by business entity', () => {
      service.getInventoryByBusinessEntity(100).subscribe(inventory => {
        expect(inventory).toEqual([mockInventory[0]]);
      });
      const req = httpMock.expectOne(`${inventoryApiUrl}/businessEntityId/100`);
      expect(req.request.method).toBe('GET');
      req.flush([mockInventory[0]]);
    });

    it('should return empty array if no inventory', () => {
      service.getInventoryByBusinessEntity(999).subscribe(inventory => {
        expect(inventory).toEqual([]);
      });
      const req = httpMock.expectOne(`${inventoryApiUrl}/businessEntityId/999`);
      req.flush([]);
    });

    it('should handle null response as empty array', () => {
      service.getInventoryByBusinessEntity(100).subscribe(inventory => {
        expect(inventory).toEqual([]);
      });
      const req = httpMock.expectOne(`${inventoryApiUrl}/businessEntityId/100`);
    });

    it('should handle error response', () => {
      service.getInventoryByBusinessEntity(100).subscribe({
        next: () => fail('should error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });
      const req = httpMock.expectOne(`${inventoryApiUrl}/businessEntityId/100`);
      req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      service.getInventoryByBusinessEntity(100).subscribe({
        next: () => fail('should error'),
        error: (err) => {
          expect(err.status).toBe(0);
        }
      });
      const req = httpMock.expectOne(`${inventoryApiUrl}/businessEntityId/100`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle invalid businessEntityId (negative)', () => {
      service.getInventoryByBusinessEntity(-1).subscribe({
        next: () => fail('should error'),
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });
      const req = httpMock.expectOne(`${inventoryApiUrl}/businessEntityId/-1`);
      req.flush({ message: 'Invalid ID' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});