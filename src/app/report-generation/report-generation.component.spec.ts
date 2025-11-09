import { ReportGenerationComponent } from './report-generation.component';
import { InventoryTransactionService } from './inventory-transaction.service';
import { ProductService } from './product.service';
import { PdfService } from './pdf.service';
import { ReportService } from './report.service';

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('ReportGenerationComponent', () => {
  let component: ReportGenerationComponent;
  let fixture: ComponentFixture<ReportGenerationComponent>;

  let mockInventoryTransactionService: jasmine.SpyObj<InventoryTransactionService>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockPdfService: jasmine.SpyObj<PdfService>;
  let mockReportService: jasmine.SpyObj<ReportService>;

  beforeEach(async () => {
    mockInventoryTransactionService = jasmine.createSpyObj('InventoryTransactionService', [
      'fetchInventoryTransactions',
      'exportReport',
    ]);
    mockProductService = jasmine.createSpyObj('ProductService', ['exportReport']);
    mockPdfService = jasmine.createSpyObj('PdfService', ['generatePdf']);
    mockReportService = jasmine.createSpyObj('ReportService', ['listSummaries', 'downloadContent']);

    // Default: no summaries to render and no HTTP error
    mockReportService.listSummaries.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ReportGenerationComponent],
      providers: [
        { provide: InventoryTransactionService, useValue: mockInventoryTransactionService },
        { provide: ProductService, useValue: mockProductService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: ReportService, useValue: mockReportService }, // ✅ mock to avoid _HttpClient
        DatePipe,
        FormBuilder,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit -> loadSummaries()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dateRangeValidator', () => {
    it('should return null if end date is after start date', () => {
      const form = (component as any).fb.group({
        startDate: [new Date(2024, 4, 1)],
        endDate: [new Date(2024, 4, 2)],
      });
      expect(component.dateRangeValidator(form)).toBeNull();
    });

    it('should return error if end date is before start date', () => {
      const form = (component as any).fb.group({
        startDate: [new Date(2024, 4, 2)],
        endDate: [new Date(2024, 4, 1)],
      });
      expect(component.dateRangeValidator(form)).toEqual({ endBeforeStart: true });
    });
  });

  // describe('onSubmit', () => {
  //   it('should not proceed if form is invalid', () => {
  //     // make form invalid by setting validator error
  //     component.dateRangeForm.setErrors({ invalid: true });
  //     component.onSubmit();
  //     // loading remains false (default); most importantly, no exceptions
  //     expect(component.loading()).toBeFalse();
  //   });

  //   it('should set error if no report observable found', () => {
  //     // ✅ Must make the form valid, then use unknown category to hit error branch
  //     component.dateRangeForm.setValue({
  //       startDate: new Date(2024, 4, 1),
  //       endDate: new Date(2024, 4, 2),
  //       reportType: 'pdf',
  //       reportCategory: 'unknown',
  //     });

  //     component.onSubmit();

  //     expect(component.error()).toBe('No report observable found for the selected category.');
  //     expect(component.loading()).toBeFalse();
  //   });

  //   it('should call inventoryTransactionService.exportReport for inventoryTransaction', fakeAsync(() => {
  //     const blob = new Blob(['test'], { type: 'application/pdf' });
  //     mockInventoryTransactionService.exportReport.and.returnValue(of(blob));

  //     // Mock browser download plumbing
  //     spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
  //     const a = document.createElement('a');
  //     spyOn(a, 'click');
  //     spyOn(document, 'createElement').and.returnValue(a as any);
  //     spyOn(document.body, 'appendChild');
  //     spyOn(document.body, 'removeChild');

  //     // ✅ Make form valid
  //     component.dateRangeForm.setValue({
  //       startDate: new Date(2024, 4, 1),
  //       endDate: new Date(2024, 4, 2),
  //       reportType: 'pdf',
  //       reportCategory: 'inventoryTransaction',
  //     });

  //     component.onSubmit();
  //     tick();

  //     expect(mockInventoryTransactionService.exportReport).toHaveBeenCalled();
  //     expect(a.click).toHaveBeenCalled();
  //     expect(component.loading()).toBeFalse();
  //   }));

  //   it('should call productService.exportReport for products', fakeAsync(() => {
  //     const blob = new Blob(['test'], { type: 'application/pdf' });
  //     mockProductService.exportReport.and.returnValue(of(blob));

  //     // Mock browser download plumbing
  //     spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
  //     const a = document.createElement('a');
  //     spyOn(a, 'click');
  //     spyOn(document, 'createElement').and.returnValue(a as any);
  //     spyOn(document.body, 'appendChild');
  //     spyOn(document.body, 'removeChild');

  //     // ✅ Make form valid (even if date range not used by this category, fields are required)
  //     component.dateRangeForm.setValue({
  //       startDate: new Date(2024, 4, 1),
  //       endDate: new Date(2024, 4, 2),
  //       reportType: 'pdf',
  //       reportCategory: 'products',
  //     });

  //     component.onSubmit();
  //     tick();

  //     expect(mockProductService.exportReport).toHaveBeenCalledWith('pdf');
  //     expect(a.click).toHaveBeenCalled();
  //     expect(component.loading()).toBeFalse();
  //   }));

  //   it('should handle error from exportReport', fakeAsync(() => {
  //     mockInventoryTransactionService.exportReport.and.returnValue(throwError(() => new Error('fail')));

  //     component.dateRangeForm.setValue({
  //       startDate: new Date(2024, 4, 1),
  //       endDate: new Date(2024, 4, 2),
  //       reportType: 'pdf',
  //       reportCategory: 'inventoryTransaction',
  //     });

  //     component.onSubmit();
  //     tick();

  //     expect(component.error()).toBe('fail');
  //     expect(component.loading()).toBeFalse();
  //   }));
  // });

  describe('ngOnInit', () => {
    it('should update endDate validity when startDate changes', fakeAsync(() => {
      const endDateControl = component.dateRangeForm.get('endDate')!;
      spyOn(endDateControl, 'updateValueAndValidity');

      component.ngOnInit(); // re-wire valueChanges
      component.dateRangeForm.get('startDate')!.setValue(new Date());
      tick();

      expect(endDateControl.updateValueAndValidity).toHaveBeenCalled();
    }));
  });
});
