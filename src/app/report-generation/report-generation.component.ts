import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core'; // Added OnInit
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { InventoryTransactionModel } from './inventory-transaction.model';
import { InventoryTransactionService } from './inventory-transaction.service';
import { PdfService } from './pdf.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

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

  // Options array for report type dropdown
  reportTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
  ];

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private inventoryTransactionService: InventoryTransactionService,
    private pdfService: PdfService
  ) {
    this.dateRangeForm = this.fb.group(
      {
        startDate: [new Date(), Validators.required],
        endDate: [new Date(), Validators.required],
        reportType: ['pdf', Validators.required],
      },
      { validator: this.dateRangeValidator }
    );
  }

  // Added ngOnInit lifecycle hook
  ngOnInit(): void {
    // Watch for startDate changes to update endDate validation
    this.dateRangeForm.get('startDate')?.valueChanges.subscribe(() => {
      this.dateRangeForm.get('endDate')?.updateValueAndValidity();
    });
  }

  dateRangeValidator(form: FormGroup) {
    const start = form.get('startDate')?.value;
    const end = form.get('endDate')?.value;
    return start && end && start > end ? { endBeforeStart: true } : null;
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

    const subscription = this.inventoryTransactionService
      .exportReport(
        startDateParam,
        endDateParam,
        this.dateFormat,
        this.dateRangeForm.value.reportType
      )
      .subscribe({
        next: (blob: Blob) => {
          // Create a URL for the Blob and trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          // Use yyyyMMdd_HHmmss format for the filename
          const currentDateTime =
            this.datePipe.transform(new Date(), 'yyyyMMdd_HHmmss') ?? '';
          const reportType = this.dateRangeForm.value.reportType;
          const extension = reportType === 'excel' ? '.xlsx' : '.pdf';
          a.download = `Report_InventoryTransaction_${currentDateTime}${extension}`;

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          window.URL.revokeObjectURL(url);
        },
        error: (err: Error) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        },
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
