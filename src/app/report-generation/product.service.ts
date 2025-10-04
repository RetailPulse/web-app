import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ConfigService } from '../services/config.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly config: ConfigService = inject(ConfigService);
  private readonly baseUrl = this.config.apiConfig.report_api_url + 'api/reports/products';

  exportReport(reportType: string) {
    const searchParams = new HttpParams().set('format', reportType);

    return this.http
      .get(`${this.baseUrl}/export`, {
        params: searchParams,
        responseType: 'blob'
      })
      .pipe(
        catchError((error) => {
          console.error('Export Product Report Error Message', error);
          return throwError(() => new Error('Failed to fetch products.'));
        })
      );
  }
}