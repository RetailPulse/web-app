import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { InventoryTransactionModel } from './inventory-transaction.model';
import { ConfigService } from '../services/config.service';

@Injectable({ providedIn: 'root' })
export class InventoryTransactionService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly config: ConfigService = inject(ConfigService);
  private readonly baseUrl = this.config.apiConfig.report_api_url + 'api/reports/inventory-transactions';

  fetchInventoryTransactions(
    startDate: string,
    endDate: string,
    dateTimeFormat: string
  ) {
    const searchParams = new HttpParams()
      .set('startDateTime', startDate)
      .set('endDateTime', endDate)
      .set('dateTimeFormat', dateTimeFormat);

    return this.http
      .get<InventoryTransactionModel[]>(this.baseUrl, { params: searchParams })
      .pipe(
        catchError((error) => {
          console.error('Fetch Error:', error);
          return throwError(() => new Error('Failed to fetch inventory transactions.'));
        })
      );
  }

  exportReport(
    startDate: string,
    endDate: string,
    dateTimeFormat: string,
    reportType: string
  ) {
    const searchParams = new HttpParams()
      .set('startDateTime', startDate)
      .set('endDateTime', endDate)
      .set('dateTimeFormat', dateTimeFormat)
      .set('format', reportType);

    return this.http
      .get(`${this.baseUrl}/export`, {
        params: searchParams,
        responseType: 'blob'
      })
      .pipe(
        catchError((error) => {
          console.error('Export Report Error:', error);
          return throwError(() => new Error('Failed to export inventory transactions.'));
        })
      );
  }
}