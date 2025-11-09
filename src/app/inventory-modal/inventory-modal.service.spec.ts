// inventory-modal.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { InventoryModalService } from './inventory-modal.service';
import { InventoryTransaction } from './inventory-modal.model';
import { ConfigService } from '../services/config.service';

describe('InventoryModalService', () => {
  let service: InventoryModalService;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  let configSpy: jasmine.SpyObj<ConfigService>;

  const mockTransactions: InventoryTransaction[] = [
    { productId: 1, quantity: 10, source: 2, destination: 3 },
    { productId: 2, quantity: 5, source: 2, destination: 4 },
  ];

  beforeEach(() => {
    // Spy for HttpClient
    httpSpy = jasmine.createSpyObj('HttpClient', ['post']);

    // Spy for ConfigService; provide apiConfig with the base URL used by the service
    configSpy = jasmine.createSpyObj('ConfigService', [], {
      apiConfig: { inventory_api_url: 'http://localhost/' },
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpSpy },
        { provide: ConfigService, useValue: configSpy },
        InventoryModalService,
      ],
    });

    service = TestBed.inject(InventoryModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return success message if all transactions succeed', (done) => {
    const mockResponses = [
      new HttpResponse({ status: 200, body: mockTransactions[0] }),
      new HttpResponse({ status: 200, body: mockTransactions[1] }),
    ];

    httpSpy.post.and.returnValues(of(mockResponses[0]), of(mockResponses[1]));

    service.createInventoryTransaction(mockTransactions).subscribe({
      next: (msg) => {
        expect(msg).toBe('All transactions were successfully inserted.');
        expect(httpSpy.post).toHaveBeenCalledTimes(2);
        done();
      },
      error: (err) => {
        fail(`Should not error, but got: ${err?.message}`);
        done();
      },
    });
  });

  it('should throw error if any transaction fails (non-200 status)', (done) => {
    const mockResponses = [
      new HttpResponse({ status: 200, body: mockTransactions[0] }),
      new HttpResponse({ status: 400, body: mockTransactions[1] }),
    ];

    httpSpy.post.and.returnValues(of(mockResponses[0]), of(mockResponses[1]));

    service.createInventoryTransaction(mockTransactions).subscribe({
      next: () => {
        fail('Should have errored');
        done();
      },
      error: (err) => {
        // catchError in the service wraps this as `Error: <original message>`
        expect(err.message).toContain('Some transactions failed to insert');
        done();
      },
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
      },
    });
  });

  it('should error for empty transaction list', (done) => {
    service.createInventoryTransaction([]).subscribe({
      next: () => {
        fail('Should have errored for empty input');
        done();
      },
      error: (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('No transactions to process.');
        done();
      },
    });
  });
});
