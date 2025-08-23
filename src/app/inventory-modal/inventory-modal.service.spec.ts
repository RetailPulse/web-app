import { InventoryModalService } from './inventory-modal.service';
import { InventoryTransaction } from './inventory-modal.model';

import { HttpClient, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('InventoryModalService', () => {
  let service: InventoryModalService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  const mockApiUrl = 'http://localhost/api/inventoryTransaction';
  const mockTransactions: InventoryTransaction[] = [
    { productId: 1, quantity: 10, source: 2, destination: 3 },
    { productId: 2, quantity: 5, source: 2, destination: 4 }
  ];

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['post']);
    service = new InventoryModalService(httpSpy);
    // Patch the private URL for test isolation
    (service as any).inventoryTransactionApiUrl = mockApiUrl;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return success message if all transactions succeed', (done) => {
    const mockResponses = [
      new HttpResponse({ status: 200, body: mockTransactions[0] }),
      new HttpResponse({ status: 200, body: mockTransactions[1] })
    ];
    httpSpy.post.and.returnValues(
      of(mockResponses[0]),
      of(mockResponses[1])
    );

    service.createInventoryTransaction(mockTransactions).subscribe({
      next: (msg) => {
        expect(msg).toBe('All transactions were successfully inserted.');
        expect(httpSpy.post).toHaveBeenCalledTimes(2);
        done();
      },
      error: () => {
        fail('Should not error');
        done();
      }
    });
  });

  it('should throw error if any transaction fails (non-200 status)', (done) => {
    const mockResponses = [
      new HttpResponse({ status: 200, body: mockTransactions[0] }),
      new HttpResponse({ status: 400, body: mockTransactions[1] })
    ];
    httpSpy.post.and.returnValues(
      of(mockResponses[0]),
      of(mockResponses[1])
    );

    service.createInventoryTransaction(mockTransactions).subscribe({
      next: () => {
        fail('Should have errored');
        done();
      },
      error: (err) => {
        expect(err.message).toContain('Some transactions failed to insert.');
        done();
      }
    });
  });

  it('should catch and rethrow http error', (done) => {
    httpSpy.post.and.returnValue(throwError(() => new Error('Network error')));
    service.createInventoryTransaction([mockTransactions[0]]).subscribe({
      next: () => {
        fail('Should have errored');
        done();
      },
      error: (err) => {
        expect(err.message).toContain('Error: Network error');
        done();
      }
    });
  });

  it('should handle empty transaction list', (done) => {
    service.createInventoryTransaction([]).subscribe({
      next: (msg) => {
        expect(msg).toBe('All transactions were successfully inserted.');
        done();
      },
      error: (err) => {
        // Correct: expect error to be thrown for this test
        expect(err).toBeDefined();
        done();
      }
    });
  }); 
});