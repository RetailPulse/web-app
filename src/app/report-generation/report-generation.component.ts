import {InventoryTransactionModel} from './inventory-transaction.model';
import {InventoryTransactionService} from './inventory-transaction.service';
import {PdfService} from './pdf.service';
import {ProductService} from './product.service'; // Added ProductService import

import {Component, DestroyRef, inject, signal, OnInit} from '@angular/core'; // Added OnInit
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatError} from '@angular/material/form-field';
import {CommonModule} from '@angular/common';
import {MatNativeDateModule, MatOptionModule} from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import {ReportSummaryDto} from './report-summary.dto';
import {ReportService} from './report.service';
import {MatTableModule} from '@angular/material/table';

@Component({
  selector: 'app-report-generation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatError,
    MatDatepickerModule,
    MatSelectModule,
    MatOptionModule,
    MatNativeDateModule,
    MatTableModule
  ],
  providers: [DatePipe],
  templateUrl: './report-generation.component.html',
  styleUrls: ['./report-generation.component.css'],
})
export class ReportGenerationComponent implements OnInit {
  // Implemented OnInit
  dateFormat = 'dd-MM-yyyy HH:mm:ss';
  dateRangeForm: FormGroup;
  loading = signal(false);
  inventoryTransactions = signal<InventoryTransactionModel[] | undefined>(
    undefined
  );
  error = signal('');
  private destroyRef = inject(DestroyRef);

  summaries = signal<ReportSummaryDto[] | null>(null);
  summariesLoading = signal(false);
  summariesError = signal<string | null>(null);

  // Options array for report type dropdown
  reportTypeOptions = [
    {value: 'pdf', label: 'PDF'},
    {value: 'excel', label: 'Excel'},
  ];

  reportCategoryOptions = [
    {value: 'inventoryTransaction', label: 'Inventory Transaction'},
    {value: 'products', label: 'Products'},
  ];

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private inventoryTransactionService: InventoryTransactionService,
    private productService: ProductService, // Added ProductService injection
    private reportService: ReportService,
    private pdfService: PdfService
  ) {
    this.dateRangeForm = this.fb.group(
      {
        startDate: [new Date(), Validators.required],
        endDate: [new Date(), Validators.required],
        reportType: ['pdf', Validators.required],
        // Set default to the first report category option
        reportCategory: [
          this.reportCategoryOptions[0].value,
          Validators.required,
        ],
      },
      {validator: this.dateRangeValidator}
    );
  }

  // Added ngOnInit lifecycle hook
  ngOnInit(): void {
    // Watch for startDate changes to update endDate validation
    this.dateRangeForm.get('startDate')?.valueChanges.subscribe(() => {
      this.dateRangeForm.get('endDate')?.updateValueAndValidity();
    });
    this.loadSummaries();
  }

  dateRangeValidator(form: FormGroup) {
    const start = form.get('startDate')?.value;
    const end = form.get('endDate')?.value;
    return start && end && start > end ? {endBeforeStart: true} : null;
  }

  isSelectDateRange() {
    const dateRangeCategories = ['inventoryTransaction'];
    return dateRangeCategories.some(category =>
      category.toLowerCase() === this.dateRangeForm.value.reportCategory.toLowerCase()
    );
  }

  private makeDownloadFilename(reportCategory: string, reportType: string): string {
    const currentDateTime = this.datePipe.transform(new Date(), 'yyyyMMdd_HHmmss') ?? '';
    const extension = reportType === 'excel' ? '.xlsx' : '.pdf';
    // Use category to produce a readable file name
    const categoryPart = reportCategory ? reportCategory.replace(/\s+/g, '_') : 'report';
    return `Report_${categoryPart}_${currentDateTime}${extension}`;
  }

  onSubmit() {
    if (this.dateRangeForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.inventoryTransactions.set(undefined);

    const startDateParam =
      this.datePipe.transform(
        this.dateRangeForm.value.startDate,
        this.dateFormat
      ) ?? '';
    const endDateParam =
      this.datePipe.transform(
        this.dateRangeForm.value.endDate,
        this.dateFormat
      ) ?? '';

    const reportType = this.dateRangeForm.value.reportType;
    const reportCategory = this.dateRangeForm.value.reportCategory;

    // Select the proper service based on the selected report category
    let reportObservable;
    if (reportCategory === 'inventoryTransaction') {
      reportObservable = this.inventoryTransactionService.exportReport(
        startDateParam,
        endDateParam,
        this.dateFormat,
        reportType
      );
    } else if (reportCategory === 'products') {
      reportObservable = this.productService.exportReport(reportType);
    }

    if (!reportObservable) {
      this.error.set('No report observable found for the selected category.');
      this.loading.set(false);
      return;
    }

    const subscription = reportObservable.subscribe({
      next: (blob: Blob) => {
        try {
          // Create a URL for the Blob and trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          // Use dynamic filename based on selected category
          const filename = this.makeDownloadFilename(reportCategory, reportType);
          a.download = filename;

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          window.URL.revokeObjectURL(url);

          // Immediately refresh summaries so the newly generated report appears
          // (server-side persistence should already be complete if blob returned)
          this.loadSummaries();
        } catch (err) {
          console.error('Error handling downloaded blob', err);
        }
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
      complete: () => {
        // ensure loading is cleared
        this.loading.set(false);
      },
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  loadSummaries(): void {
    this.summariesLoading.set(true);
    this.summariesError.set(null);
    this.reportService.listSummaries().subscribe({
      next: (data) => {
        this.summaries.set(data ?? []);
        this.summariesLoading.set(false);
      },
      error: (err) => {
        this.summariesError.set('Failed to load reports.');
        this.summariesLoading.set(false);
        console.error(err);
      }
    });
  }

  download(id: string): void {
    this.reportService.downloadContent(id).subscribe({
      next: (res) => {
        const blob = res.body!;
        // Try filename from Content-Disposition; fallback to .zip/.pdf/etc.
        const cd = res.headers.get('Content-Disposition') || '';
        const match = /filename\*?=(?:UTF-8'')?([^;]+)/i.exec(cd);
        const filename = match ? decodeURIComponent(match[1].replace(/"/g, '')) : `report-${id}`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        // optionally surface a toast or set summariesError
      }
    });
  }

}
