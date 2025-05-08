import { ReportGenerationComponent } from './report-generation.component';
import { InventoryTransactionService } from './inventory-transaction.service';
import { InventoryTransactionModel } from './inventory-transaction.model';
import { ProductService } from './product.service';
import { PdfService } from './pdf.service';

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of, throwError, Subscription } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('ReportGenerationComponent', () => {
  let component: ReportGenerationComponent;
  let fixture: ComponentFixture<ReportGenerationComponent>;
  let mockInventoryTransactionService: jasmine.SpyObj<InventoryTransactionService>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockPdfService: jasmine.SpyObj<PdfService>;

  const mockTransactions: InventoryTransactionModel[] = [
    {
      transactionId: 'T1',
      product: {
        sku: 'SKU1',
        description: 'Product 1',
        category: 'Cat1',
        subCategory: 'Sub1',
        brand: 'Brand1'
      },
      productPricing: {
        quantity: 10,
        costPricePerUnit: 5,
        totalCost: 50
      },
      source: { name: 'Src', location: 'Loc', type: 'Type' },
      destination: { name: 'Dest', location: 'Loc', type: 'Type' },
      transactionDateTime: '2024-05-09T12:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockInventoryTransactionService = jasmine.createSpyObj('InventoryTransactionService', [
      'fetchInventoryTransactions', 'exportReport'
    ]);
    mockProductService = jasmine.createSpyObj('ProductService', ['exportReport']);
    mockPdfService = jasmine.createSpyObj('PdfService', ['generatePdf']);

    await TestBed.configureTestingModule({
      imports: [ReportGenerationComponent],
      providers: [
        { provide: InventoryTransactionService, useValue: mockInventoryTransactionService },
        { provide: ProductService, useValue: mockProductService },
        { provide: PdfService, useValue: mockPdfService },
        DatePipe,
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dateRangeValidator', () => {
    it('should return null if end date is after start date', () => {
      const form = component['fb'].group({
        startDate: [new Date(2024, 4, 1)],
        endDate: [new Date(2024, 4, 2)]
      });
      expect(component.dateRangeValidator(form)).toBeNull();
    });

    it('should return error if end date is before start date', () => {
      const form = component['fb'].group({
        startDate: [new Date(2024, 4, 2)],
        endDate: [new Date(2024, 4, 1)]
      });
      expect(component.dateRangeValidator(form)).toEqual({ endBeforeStart: true });
    });
  });

  describe('onSubmit', () => {
    it('should not proceed if form is invalid', () => {
      component.dateRangeForm.setErrors({ invalid: true });
      component.onSubmit();
      expect(component.loading()).toBeFalse();
    });

    it('should set error if no report observable found', () => {
      component.dateRangeForm.patchValue({ reportCategory: 'unknown' });
      component.onSubmit();
      expect(component.error()).toBe('No report observable found for the selected category.');
      expect(component.loading()).toBeFalse();
    });

    it('should call inventoryTransactionService.exportReport for inventoryTransaction', fakeAsync(() => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      mockInventoryTransactionService.exportReport.and.returnValue(of(blob));
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      const a = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(a);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(a, 'click');

      component.dateRangeForm.patchValue({
        startDate: new Date(2024, 4, 1),
        endDate: new Date(2024, 4, 2),
        reportType: 'pdf',
        reportCategory: 'inventoryTransaction'
      });
      component.onSubmit();
      tick();
      expect(component.loading()).toBeFalse();
    }));

    it('should call productService.exportReport for products', fakeAsync(() => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      mockProductService.exportReport.and.returnValue(of(blob));
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      const a = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(a);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(a, 'click');

      component.dateRangeForm.patchValue({
        reportType: 'pdf',
        reportCategory: 'products'
      });
      component.onSubmit();
      tick();
      expect(mockProductService.exportReport).toHaveBeenCalled();
      expect(a.click).toHaveBeenCalled();
      expect(component.loading()).toBeFalse();
    }));

    it('should handle error from exportReport', fakeAsync(() => {
      mockInventoryTransactionService.exportReport.and.returnValue(throwError(() => new Error('fail')));
      component.dateRangeForm.patchValue({
        reportCategory: 'inventoryTransaction'
      });
      component.onSubmit();
      tick();
      expect(component.error()).toBe('fail');
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('ngOnInit', () => {
    it('should update endDate validity when startDate changes', fakeAsync(() => {
      const endDateControl = component.dateRangeForm.get('endDate');
      spyOn(endDateControl!, 'updateValueAndValidity');
      component.ngOnInit();
      component.dateRangeForm.get('startDate')!.setValue(new Date());
      tick();
      expect(endDateControl!.updateValueAndValidity).toHaveBeenCalled();
    }));
  });
});