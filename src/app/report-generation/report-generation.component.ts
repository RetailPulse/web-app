import {Component, DestroyRef, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePickerModule} from 'primeng/datepicker';
import {FloatLabel} from 'primeng/floatlabel';
import {DatePipe} from '@angular/common';
import {InventoryTransactionModel} from './inventory-transaction.model';
import {InventoryTransactionService} from './inventory-transaction.service';
import {PdfService} from './pdf.service';

@Component({
  selector: 'app-report-generation',
  standalone: true,
  imports: [FormsModule, DatePickerModule, FloatLabel],
  providers: [DatePipe],
  templateUrl: './report-generation.component.html',
  styleUrl: './report-generation.component.css'
})
export class ReportGenerationComponent {
  dateFormat: string = 'dd-MM-yyyy HH:mm:ss';
  startDate = signal<Date>(new Date());
  endDate = signal<Date>(new Date());

  inventoryTransactions = signal<InventoryTransactionModel[] | undefined>(undefined);
  error = signal('');
  private destroyRef = inject(DestroyRef);

  constructor(private datePipe: DatePipe,
              private inventoryTransactionService: InventoryTransactionService,
              private pdfService: PdfService) {
  }

  onSubmit() {
    const startDateParam = this.datePipe.transform(this.startDate(), this.dateFormat) ?? '';
    const endDateParam = this.datePipe.transform(this.endDate(), this.dateFormat) ?? '';

    const subscription = this.inventoryTransactionService.fetchInventoryTransactions(
      startDateParam ?? '',
      endDateParam ?? '',
      this.dateFormat
    ).subscribe({
      next: (inventoryTransactions: InventoryTransactionModel[]) => {
        this.inventoryTransactions.set(inventoryTransactions);
      },
      error: (error: Error) => {
        this.error.set(error.message);
      },
      complete: () => {
        this.pdfService.generatePdf(startDateParam, endDateParam, this.inventoryTransactions() ?? []);
      }
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });

  }

}
