import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { apiConfig } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  exportReport(reportType: string) {
    let searchParams = new HttpParams();
    searchParams = searchParams.append('format', reportType);

    return this.http
      .get(
        apiConfig.report_api_url + 'api/reports/products/export',
        { params: searchParams, responseType: 'blob' }
      )
      .pipe(
        catchError((error) => {
          console.error('Export Product Report Error Message', error);
          return throwError(
            () => new Error('Failed to fetch products.')
          );
        })
      );
  }
}
