import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core'; // Added OnInit
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { MatNativeDateModule } from '@angular/material/core';

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
    MatNativeDateModule
  ],
  providers: [DatePipe],
  templateUrl: './report-generation.component.html',
  styleUrls: ['./report-generation.component.css']
})
export class ReportGenerationComponent implements OnInit { // Implemented OnInit
  dateFormat = 'dd-MM-yyyy HH:mm:ss';
  dateRangeForm: FormGroup;
  loading = signal(false);
  inventoryTransactions = signal<InventoryTransactionModel[] | undefined>(undefined);
  error = signal('');
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private inventoryTransactionService: InventoryTransactionService,
    private pdfService: PdfService
  ) {
    this.dateRangeForm = this.fb.group({
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required]
    }, { validator: this.dateRangeValidator });
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

    const startDateParam = this.datePipe.transform(this.dateRangeForm.value.startDate, this.dateFormat) ?? '';
    const endDateParam = this.datePipe.transform(this.dateRangeForm.value.endDate, this.dateFormat) ?? '';

    const subscription = this.inventoryTransactionService
      .fetchInventoryTransactions(startDateParam, endDateParam, this.dateFormat)
      .subscribe({
        next: (transactions: InventoryTransactionModel[]) => {
          this.inventoryTransactions.set(transactions);
          this.pdfService.generatePdf(startDateParam, endDateParam, transactions);
        },
        error: (err: Error) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
