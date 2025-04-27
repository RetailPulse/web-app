import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { apiConfig } from '../../environments/environment';
import { InventoryTransactionModel } from './inventory-transaction.model';
import { catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InventoryTransactionService {
  constructor(private http: HttpClient) {}

  fetchInventoryTransactions(
    startDate: string,
    endDate: string,
    dateTimeFormat: string
  ) {
    let searchParams = new HttpParams();
    searchParams = searchParams.append('startDateTime', startDate);
    searchParams = searchParams.append('endDateTime', endDate);
    searchParams = searchParams.append('dateTimeFormat', dateTimeFormat);

    return this.http
      .get<InventoryTransactionModel[]>(
        apiConfig.backend_api_url + 'api/reports/inventory-transactions',
        { params: searchParams }
      )
      .pipe(
        catchError((error) => {
          console.log(error);
          return throwError(
            () => new Error('Failed to fetch inventory transactions.')
          );
        })
      );
  }

  exportReport(
    startDate: string,
    endDate: string,
    dateTimeFormat: string,
    reportType: string
  ) {
    let searchParams = new HttpParams();
    searchParams = searchParams.append('startDateTime', startDate);
    searchParams = searchParams.append('endDateTime', endDate);
    searchParams = searchParams.append('dateTimeFormat', dateTimeFormat);
    searchParams = searchParams.append('format', reportType);

    return this.http
      .get(
        apiConfig.backend_api_url + 'api/reports/inventory-transactions/export',
        { params: searchParams, responseType: 'blob' }
      )
      .pipe(
        catchError((error) => {
          console.error('Export Report Error Message', error);
          return throwError(
            () => new Error('Failed to fetch inventory transactions.')
          );
        })
      );
  }
}
